/**
 * Audio Engine v2 — Web Audio API based.
 * Features: lazy sample loading, per-pad volume/pitch, master FX chain,
 * AnalyserNode for waveform visualization, proper memory cleanup,
 * haptic feedback support, MIDI input.
 */

import { bufferCache, getAudioContext, PACK_NAMES } from './builtinSamples';

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.customBuffers = new Map();   // padNumber → AudioBuffer (user uploads)
        this.volumes = new Map();
        this.pitches = new Map();
        this.activeSources = new Map();   // padNumber → { source, gain }[]
        this.customNames = new Map();

        // Master FX
        this.masterGain = null;
        this.compressor = null;
        this.reverb = null;
        this.delay = null;
        this.analyser = null;  // #3, #18: AnalyserNode for waveform
        this.reverbMix = 0;
        this.delayMix = 0;
        this.compEnabled = true;
        this._reverbDry = null;
        this._reverbWet = null;
        this._delayDry = null;
        this._delayWet = null;
        this._delayFeedback = null;

        this.initialized = false;
        this.onTriggerCallback = null;
        this.currentPack = 'FACTORY';

        // MIDI
        this._midiAccess = null;
    }

    async init() {
        if (this.initialized) return;

        this.ctx = getAudioContext();
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        // Initialize default volumes/pitches for all pads
        for (let i = 0; i <= 18; i++) {
            if (!this.volumes.has(i)) this.volumes.set(i, 0.8);
            if (!this.pitches.has(i)) this.pitches.set(i, 0);
        }

        this._buildFXChain();
        this._loadSettings();

        // #19: Try MIDI setup
        this._setupMIDI();

        this.initialized = true;
    }

    _buildFXChain() {
        const ctx = this.ctx;

        // Analyser for visualizations (#3, #18)
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.7;

        this.masterGain = ctx.createGain();
        this.masterGain.gain.value = 0.8;

        this.compressor = ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 12;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;

        this.reverb = ctx.createConvolver();
        this._createReverbIR();

        this.delay = ctx.createDelay(1.0);
        this.delay.delayTime.value = 0.3;
        this._delayFeedback = ctx.createGain();
        this._delayFeedback.gain.value = 0.3;

        this._reverbDry = ctx.createGain();
        this._reverbDry.gain.value = 1;
        this._reverbWet = ctx.createGain();
        this._reverbWet.gain.value = 0;

        this._delayDry = ctx.createGain();
        this._delayDry.gain.value = 1;
        this._delayWet = ctx.createGain();
        this._delayWet.gain.value = 0;

        // Route: masterGain → analyser → compressor → reverb split → delay split → destination
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.compressor);

        this.compressor.connect(this._reverbDry);
        this.compressor.connect(this._reverbWet);
        this._reverbWet.connect(this.reverb);

        this._reverbDry.connect(this._delayDry);
        this.reverb.connect(this._delayDry);
        this._reverbDry.connect(this._delayWet);
        this.reverb.connect(this._delayWet);

        this._delayWet.connect(this.delay);
        this.delay.connect(this._delayFeedback);
        this._delayFeedback.connect(this.delay);
        this.delay.connect(ctx.destination);

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

    // Get audio buffer for a pad (custom or from pack)
    _getBuffer(padNumber) {
        if (this.customBuffers.has(padNumber)) {
            return this.customBuffers.get(padNumber);
        }
        return bufferCache.getBuffer(padNumber, this.currentPack);
    }

    triggerPad(padNumber, velocity = 1.0) {
        if (!this.initialized) return;
        const buffer = this._getBuffer(padNumber);
        if (!buffer) return;

        const ctx = this.ctx;
        if (ctx.state === 'suspended') ctx.resume();

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Pitch
        const semitones = this.pitches.get(padNumber) || 0;
        source.playbackRate.value = Math.pow(2, semitones / 12);

        // Volume with velocity (#13)
        const gainNode = ctx.createGain();
        const baseVol = this.volumes.get(padNumber) || 0.8;
        gainNode.gain.value = baseVol * velocity;

        source.connect(gainNode);
        gainNode.connect(this.masterGain);

        source.start(0);

        // Track active sources for cleanup (#17)
        if (!this.activeSources.has(padNumber)) {
            this.activeSources.set(padNumber, []);
        }
        const entry = { source, gain: gainNode };
        this.activeSources.get(padNumber).push(entry);

        // #17: Proper cleanup on end — disconnect nodes to free memory
        source.onended = () => {
            try {
                source.disconnect();
                gainNode.disconnect();
            } catch (e) { /* already disconnected */ }
            const sources = this.activeSources.get(padNumber);
            if (sources) {
                const idx = sources.indexOf(entry);
                if (idx !== -1) sources.splice(idx, 1);
            }
        };

        // #10: Haptic feedback on mobile
        if (navigator.vibrate) {
            navigator.vibrate(8);
        }

        if (this.onTriggerCallback) {
            this.onTriggerCallback(padNumber);
        }
    }

    // Schedule a pad trigger at a specific Web Audio time (#4)
    schedulePad(padNumber, when, velocity = 1.0) {
        if (!this.initialized) return;
        const buffer = this._getBuffer(padNumber);
        if (!buffer) return;

        const ctx = this.ctx;
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const semitones = this.pitches.get(padNumber) || 0;
        source.playbackRate.value = Math.pow(2, semitones / 12);

        const gainNode = ctx.createGain();
        const baseVol = this.volumes.get(padNumber) || 0.8;
        gainNode.gain.value = baseVol * velocity;

        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.start(when);

        // Cleanup
        source.onended = () => {
            try {
                source.disconnect();
                gainNode.disconnect();
            } catch (e) { /* */ }
        };
    }

    stopAll() {
        this.activeSources.forEach((sources) => {
            sources.forEach(({ source, gain }) => {
                try {
                    source.stop();
                    source.disconnect();
                    gain.disconnect();
                } catch (e) { /* already stopped */ }
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
        if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, vol));
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
        if (this.compressor) this.compressor.ratio.value = enabled ? 4 : 1;
    }

    // #15: Switch sample pack
    switchPack(packName) {
        this.currentPack = packName;
        bufferCache.setPack(packName);
    }

    async loadCustomSample(padNumber, arrayBuffer, name) {
        if (!this.ctx) return;
        try {
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.customBuffers.set(padNumber, audioBuffer);
            this.customNames.set(padNumber, name);
            if (!this.volumes.has(padNumber)) this.volumes.set(padNumber, 0.8);
            if (!this.pitches.has(padNumber)) this.pitches.set(padNumber, 0);
        } catch (e) {
            console.error('Failed to decode audio:', e);
        }
    }

    clearPad(padNumber) {
        this.customBuffers.delete(padNumber);
        this.customNames.delete(padNumber);
    }

    hasSample(padNumber) {
        return this.customBuffers.has(padNumber) || bufferCache.getBuffer(padNumber) !== null;
    }

    // #3, #18: Get waveform data for visualization
    getWaveformData() {
        if (!this.analyser) return null;
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteTimeDomainData(data);
        return data;
    }

    getFrequencyData() {
        if (!this.analyser) return null;
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(data);
        return data;
    }

    // #9: Render pattern to WAV using OfflineAudioContext
    async renderPatternToWAV(patternData, bpm, loops = 1) {
        const steps = 16;
        const stepDuration = 60 / bpm / 4;
        const totalDuration = stepDuration * steps * loops;
        const sampleRate = 44100;
        const offline = new OfflineAudioContext(2, Math.ceil(totalDuration * sampleRate), sampleRate);

        for (let loop = 0; loop < loops; loop++) {
            for (const [padStr, stepArray] of Object.entries(patternData)) {
                const padNumber = Number(padStr);
                const buffer = this._getBuffer(padNumber);
                if (!buffer) continue;

                for (let s = 0; s < steps; s++) {
                    if (!stepArray[s]) continue;
                    const velocity = typeof stepArray[s] === 'number' ? stepArray[s] : 1.0;
                    const when = (loop * steps + s) * stepDuration;
                    const source = offline.createBufferSource();
                    source.buffer = buffer;
                    const gain = offline.createGain();
                    gain.gain.value = (this.volumes.get(padNumber) || 0.8) * velocity;
                    source.connect(gain);
                    gain.connect(offline.destination);
                    source.start(when);
                }
            }
        }

        const rendered = await offline.startRendering();
        return this._audioBufferToWAV(rendered);
    }

    _audioBufferToWAV(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        const dataSize = buffer.length * blockAlign;
        const headerSize = 44;
        const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
        const view = new DataView(arrayBuffer);

        // WAV header
        const writeString = (offset, str) => {
            for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
        };
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, dataSize, true);

        // Interleave channels and write samples
        const channels = [];
        for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch));

        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                const sample = Math.max(-1, Math.min(1, channels[ch][i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    // #19: MIDI setup
    async _setupMIDI() {
        if (!navigator.requestMIDIAccess) return;
        try {
            this._midiAccess = await navigator.requestMIDIAccess();
            this._midiAccess.inputs.forEach(input => {
                input.onmidimessage = (msg) => this._handleMIDI(msg);
            });
            // Listen for new connections
            this._midiAccess.onstatechange = () => {
                this._midiAccess.inputs.forEach(input => {
                    input.onmidimessage = (msg) => this._handleMIDI(msg);
                });
            };
        } catch (e) {
            // MIDI not available
        }
    }

    _handleMIDI(msg) {
        const [status, note, velocity] = msg.data;
        const command = status & 0xf0;

        if (command === 0x90 && velocity > 0) {
            // Note On — map MIDI notes 36-53 to pads 0-17, or 60-77
            let padNumber = null;
            if (note >= 36 && note <= 54) padNumber = note - 36;
            else if (note >= 60 && note <= 78) padNumber = note - 60;

            if (padNumber !== null && padNumber <= 18) {
                const vel = velocity / 127;
                this.triggerPad(padNumber, vel);
            }
        }
    }

    _saveSettings() {
        try {
            const settings = {
                volumes: Object.fromEntries(this.volumes),
                pitches: Object.fromEntries(this.pitches),
                pack: this.currentPack,
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
                    Object.entries(settings.volumes).forEach(([k, v]) => this.volumes.set(Number(k), v));
                }
                if (settings.pitches) {
                    Object.entries(settings.pitches).forEach(([k, v]) => this.pitches.set(Number(k), v));
                }
                if (settings.pack) {
                    this.currentPack = settings.pack;
                    bufferCache.setPack(settings.pack);
                }
            }
        } catch (e) { /* ignore */ }
    }
}

const audioEngine = new AudioEngine();
export default audioEngine;
