/**
 * Audio Engine — manages sample playback, per-pad volume/pitch, master FX chain.
 * Uses Web Audio API directly (no Tone.js dependency for core playback).
 */

import { generateBuiltinSamples, getAudioContext } from './builtinSamples';

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.buffers = new Map();       // padNumber → AudioBuffer
        this.volumes = new Map();       // padNumber → 0-1
        this.pitches = new Map();       // padNumber → semitones (-12 to +12)
        this.activeSources = new Map(); // padNumber → AudioBufferSourceNode[]
        this.customNames = new Map();   // padNumber → custom name

        // Master FX nodes
        this.masterGain = null;
        this.compressor = null;
        this.reverb = null;
        this.delay = null;
        this.reverbMix = 0;
        this.delayMix = 0;
        this.compEnabled = true;

        this._reverbDry = null;
        this._reverbWet = null;
        this._delayDry = null;
        this._delayWet = null;

        this.initialized = false;
        this.onTriggerCallback = null;
    }

    async init() {
        if (this.initialized) return;

        this.ctx = getAudioContext();
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        // Generate built-in samples
        const builtins = generateBuiltinSamples();
        builtins.forEach((buf, pad) => {
            this.buffers.set(pad, buf);
            this.volumes.set(pad, 0.8);
            this.pitches.set(pad, 0);
        });

        // Initialize custom slots
        for (let i = 14; i <= 17; i++) {
            this.volumes.set(i, 0.8);
            this.pitches.set(i, 0);
        }

        // Build master FX chain
        this._buildFXChain();

        // Load saved settings
        this._loadSettings();

        this.initialized = true;
    }

    _buildFXChain() {
        const ctx = this.ctx;

        // Master gain
        this.masterGain = ctx.createGain();
        this.masterGain.gain.value = 0.8;

        // Compressor
        this.compressor = ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 12;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;

        // Reverb (convolution-based impulse)
        this.reverb = ctx.createConvolver();
        this._createReverbIR();

        // Delay
        this.delay = ctx.createDelay(1.0);
        this.delay.delayTime.value = 0.3;
        this._delayFeedback = ctx.createGain();
        this._delayFeedback.gain.value = 0.3;

        // Dry/Wet for reverb
        this._reverbDry = ctx.createGain();
        this._reverbDry.gain.value = 1;
        this._reverbWet = ctx.createGain();
        this._reverbWet.gain.value = 0;

        // Dry/Wet for delay
        this._delayDry = ctx.createGain();
        this._delayDry.gain.value = 1;
        this._delayWet = ctx.createGain();
        this._delayWet.gain.value = 0;

        // Route: masterGain → compressor → reverbDry → delayDry → destination
        //                                → reverbWet → reverb → delayDry → destination
        //                                                      → delayWet → delay → feedback loop → destination
        this.masterGain.connect(this.compressor);

        // Compressor → reverb split
        this.compressor.connect(this._reverbDry);
        this.compressor.connect(this._reverbWet);
        this._reverbWet.connect(this.reverb);

        // Reverb merge → delay split
        this._reverbDry.connect(this._delayDry);
        this.reverb.connect(this._delayDry);
        this._reverbDry.connect(this._delayWet);
        this.reverb.connect(this._delayWet);

        // Delay
        this._delayWet.connect(this.delay);
        this.delay.connect(this._delayFeedback);
        this._delayFeedback.connect(this.delay);
        this.delay.connect(ctx.destination);

        // Dry path
        this._delayDry.connect(ctx.destination);
    }

    _createReverbIR() {
        const ctx = this.ctx;
        const length = ctx.sampleRate * 1.5;
        const ir = ctx.createBuffer(2, length, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const data = ir.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-3 * i / length);
            }
        }
        this.reverb.buffer = ir;
    }

    triggerPad(padNumber) {
        if (!this.initialized) return;
        const buffer = this.buffers.get(padNumber);
        if (!buffer) return;

        const ctx = this.ctx;
        if (ctx.state === 'suspended') ctx.resume();

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Pitch
        const semitones = this.pitches.get(padNumber) || 0;
        source.playbackRate.value = Math.pow(2, semitones / 12);

        // Volume
        const gainNode = ctx.createGain();
        gainNode.gain.value = this.volumes.get(padNumber) || 0.8;

        source.connect(gainNode);
        gainNode.connect(this.masterGain);

        source.start(0);

        // Track active sources
        if (!this.activeSources.has(padNumber)) {
            this.activeSources.set(padNumber, []);
        }
        this.activeSources.get(padNumber).push(source);

        source.onended = () => {
            const sources = this.activeSources.get(padNumber);
            if (sources) {
                const idx = sources.indexOf(source);
                if (idx !== -1) sources.splice(idx, 1);
            }
        };

        // Callback
        if (this.onTriggerCallback) {
            this.onTriggerCallback(padNumber);
        }
    }

    stopAll() {
        this.activeSources.forEach((sources) => {
            sources.forEach(s => {
                try { s.stop(); } catch (e) { /* already stopped */ }
            });
        });
        this.activeSources.clear();
    }

    setVolume(padNumber, vol) {
        this.volumes.set(padNumber, Math.max(0, Math.min(1, vol)));
        this._saveSettings();
    }

    setPitch(padNumber, semitones) {
        this.pitches.set(padNumber, Math.max(-12, Math.min(12, semitones)));
        this._saveSettings();
    }

    setMasterVolume(vol) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, vol));
        }
    }

    setReverbMix(val) {
        this.reverbMix = val;
        if (this._reverbWet) {
            this._reverbWet.gain.value = val;
            this._reverbDry.gain.value = 1 - val * 0.5;
        }
    }

    setDelayMix(val) {
        this.delayMix = val;
        if (this._delayWet) {
            this._delayWet.gain.value = val;
            this._delayDry.gain.value = 1 - val * 0.3;
        }
    }

    setCompEnabled(enabled) {
        this.compEnabled = enabled;
        // Simple toggle: set ratio to 1 (no compression) or restore
        if (this.compressor) {
            this.compressor.ratio.value = enabled ? 4 : 1;
        }
    }

    async loadCustomSample(padNumber, arrayBuffer, name) {
        if (!this.ctx) return;
        try {
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.buffers.set(padNumber, audioBuffer);
            this.customNames.set(padNumber, name);
            if (!this.volumes.has(padNumber)) this.volumes.set(padNumber, 0.8);
            if (!this.pitches.has(padNumber)) this.pitches.set(padNumber, 0);
        } catch (e) {
            console.error('Failed to decode audio:', e);
        }
    }

    clearPad(padNumber) {
        this.buffers.delete(padNumber);
        this.customNames.delete(padNumber);
    }

    hasSample(padNumber) {
        return this.buffers.has(padNumber);
    }

    _saveSettings() {
        try {
            const settings = {
                volumes: Object.fromEntries(this.volumes),
                pitches: Object.fromEntries(this.pitches),
            };
            localStorage.setItem('soundculator-settings', JSON.stringify(settings));
        } catch (e) { /* ignore */ }
    }

    _loadSettings() {
        try {
            const saved = localStorage.getItem('soundculator-settings');
            if (saved) {
                const settings = JSON.parse(saved);
                if (settings.volumes) {
                    Object.entries(settings.volumes).forEach(([k, v]) => {
                        this.volumes.set(Number(k), v);
                    });
                }
                if (settings.pitches) {
                    Object.entries(settings.pitches).forEach(([k, v]) => {
                        this.pitches.set(Number(k), v);
                    });
                }
            }
        } catch (e) { /* ignore */ }
    }
}

// Singleton
const audioEngine = new AudioEngine();
export default audioEngine;
