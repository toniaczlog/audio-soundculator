/**
 * Built-in sample synthesis using Web Audio API.
 * LAZY INITIALIZATION — samples are generated on first request, not all at once.
 * STEREO — all buffers are 2-channel with subtle panning variation.
 * Includes multiple SAMPLE PACKS: Factory, LoFi, 808, Electro.
 */

let _audioCtx = null;

function getAudioContext() {
    if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
}

function createBuffer(duration, channels = 2, sampleRate = 44100) {
    const ctx = getAudioContext();
    return ctx.createBuffer(channels, Math.ceil(duration * sampleRate), sampleRate);
}

// Helper: write mono data to stereo buffer with slight pan
function writeToStereo(buf, monoData, pan = 0) {
    // pan: -1 = full left, 0 = center, 1 = full right
    const left = buf.getChannelData(0);
    const right = buf.getChannelData(1);
    const leftGain = Math.cos((pan + 1) * Math.PI / 4);
    const rightGain = Math.sin((pan + 1) * Math.PI / 4);
    for (let i = 0; i < monoData.length && i < left.length; i++) {
        left[i] = monoData[i] * leftGain;
        right[i] = monoData[i] * rightGain;
    }
}

// ═══════════════════════════════════════
// FACTORY PACK (default)
// ═══════════════════════════════════════

function synthBassDrum() {
    const duration = 0.35, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const freq = 80 - (50 * t / duration);
        mono[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-6 * t);
    }
    for (let i = 0; i < Math.min(200, mono.length); i++) {
        mono[i] += Math.sin(2 * Math.PI * 160 * i / sr) * Math.exp(-40 * i / sr) * 0.6;
    }
    writeToStereo(buf, mono, 0);
    return buf;
}

function synthSnare() {
    const duration = 0.18, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const noise = (Math.random() * 2 - 1) * 0.6;
        const tone = Math.sin(2 * Math.PI * 200 * t) * 0.5;
        mono[i] = (noise + tone) * Math.exp(-12 * t);
    }
    writeToStereo(buf, mono, 0);
    return buf;
}

function synthHiHatClosed() {
    const duration = 0.06, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        mono[i] = (Math.random() * 2 - 1) * Math.exp(-50 * t) * 0.5;
        mono[i] += Math.sin(2 * Math.PI * 6000 * t) * Math.exp(-60 * t) * 0.2;
    }
    writeToStereo(buf, mono, -0.3);
    return buf;
}

function synthHiHatOpen() {
    const duration = 0.3, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        mono[i] = (Math.random() * 2 - 1) * Math.exp(-6 * t) * 0.4;
        mono[i] += Math.sin(2 * Math.PI * 6000 * t) * Math.exp(-8 * t) * 0.15;
    }
    writeToStereo(buf, mono, -0.3);
    return buf;
}

function synthClap() {
    const duration = 0.2, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    const burstTimes = [0, 0.01, 0.023];
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        let val = 0;
        for (const bt of burstTimes) {
            if (t >= bt) val += (Math.random() * 2 - 1) * Math.exp(-20 * (t - bt)) * 0.35;
        }
        val += (Math.random() * 2 - 1) * Math.exp(-8 * t) * 0.15;
        mono[i] = val;
    }
    writeToStereo(buf, mono, 0.15);
    return buf;
}

function synthTomLow() {
    const duration = 0.25, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const freq = 120 - (60 * t / duration);
        mono[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-8 * t) * 0.8;
    }
    writeToStereo(buf, mono, -0.4);
    return buf;
}

function synthTomHigh() {
    const duration = 0.2, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const freq = 220 - (120 * t / duration);
        mono[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-10 * t) * 0.8;
    }
    writeToStereo(buf, mono, 0.4);
    return buf;
}

function synthRimshot() {
    const duration = 0.08, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        mono[i] = (Math.random() * 2 - 1) * Math.exp(-80 * t) * 0.6
            + Math.sin(2 * Math.PI * 400 * t) * Math.exp(-30 * t) * 0.7;
    }
    writeToStereo(buf, mono, 0.2);
    return buf;
}

function synthBassSynth() {
    const duration = 0.3, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        let val = 0;
        for (let h = 1; h <= 6; h++) val += Math.sin(2 * Math.PI * 80 * h * t) / h;
        mono[i] = val * 0.3 * Math.exp(-5 * t);
    }
    writeToStereo(buf, mono, 0);
    return buf;
}

function synthLeadSynth() {
    const duration = 0.25, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const vibrato = Math.sin(2 * Math.PI * 5 * t) * 10;
        const freq = 440 + vibrato;
        let val = 0;
        for (let h = 1; h <= 7; h += 2) val += Math.sin(2 * Math.PI * freq * h * t) / h;
        mono[i] = val * 0.25 * Math.exp(-6 * t);
    }
    writeToStereo(buf, mono, 0.1);
    return buf;
}

function synthChordStab() {
    const duration = 0.2, sr = 44100;
    const freqs = [164.81, 196.00, 246.94];
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        let val = 0;
        for (const f of freqs) {
            for (let h = 1; h <= 4; h++) val += Math.sin(2 * Math.PI * f * h * t) / h;
        }
        mono[i] = val * 0.12 * Math.exp(-8 * t);
    }
    writeToStereo(buf, mono, -0.1);
    return buf;
}

function synthBell() {
    const duration = 0.8, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const mod = Math.sin(2 * Math.PI * 1760 * t) * 400 * Math.exp(-3 * t);
        mono[i] = Math.sin(2 * Math.PI * (880 + mod) * t) * Math.exp(-3 * t) * 0.4;
    }
    writeToStereo(buf, mono, 0.25);
    return buf;
}

function synthVinylCrackle() {
    const duration = 0.4, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < mono.length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        const crackle = Math.random() > 0.98 ? (Math.random() * 2 - 1) * 0.3 : 0;
        const t = i / sr;
        mono[i] = (pink * 0.04 + crackle) * Math.exp(-2 * t);
    }
    writeToStereo(buf, mono, 0);
    return buf;
}

function synthSubBoom() {
    const duration = 0.5, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        mono[i] = Math.sin(2 * Math.PI * 35 * t) * Math.exp(-4 * t) * 0.9;
        mono[i] += Math.sin(2 * Math.PI * 100 * t) * Math.exp(-30 * t) * 0.4;
    }
    writeToStereo(buf, mono, 0);
    return buf;
}

function synthFXGlitch() {
    const duration = 0.15, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const freq = 2000 - (1800 * t / duration);
        const tone = Math.sin(2 * Math.PI * freq * t);
        const noise = Math.random() * 2 - 1;
        const mixed = (tone * 0.5 + noise * 0.3);
        mono[i] = Math.round(mixed * 8) / 8 * Math.exp(-10 * t) * 0.5;
    }
    writeToStereo(buf, mono, 0.5);
    return buf;
}

// ═══════════════════════════════════════
// LOFI PACK — warmer, grittier
// ═══════════════════════════════════════

function lofiKick() {
    const duration = 0.4, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const freq = 60 - (30 * t / duration);
        mono[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-5 * t) * 0.9;
        // Tape saturation: soft clip
        mono[i] = Math.tanh(mono[i] * 2) * 0.7;
    }
    writeToStereo(buf, mono, 0);
    return buf;
}

function lofiSnare() {
    const duration = 0.22, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const noise = (Math.random() * 2 - 1) * 0.5;
        const tone = Math.sin(2 * Math.PI * 180 * t) * 0.4;
        mono[i] = Math.tanh((noise + tone) * 1.5) * Math.exp(-8 * t);
    }
    writeToStereo(buf, mono, 0);
    return buf;
}

function lofiHat() {
    const duration = 0.04, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        // lo-fi: lower sample rate feel via step
        const step = i % 3 === 0 ? (Math.random() * 2 - 1) : mono[Math.max(0, i - 1)];
        mono[i] = step * Math.exp(-40 * t) * 0.4;
    }
    writeToStereo(buf, mono, -0.3);
    return buf;
}

function lofiChord() {
    const duration = 0.4, sr = 44100;
    const freqs = [130.81, 164.81, 196.00]; // C3 E3 G3 — C major
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        let val = 0;
        for (const f of freqs) {
            val += Math.sin(2 * Math.PI * f * t + Math.sin(t * 3) * 0.05);
        }
        mono[i] = Math.tanh(val * 0.4) * Math.exp(-4 * t) * 0.5;
    }
    writeToStereo(buf, mono, 0);
    return buf;
}

// ═══════════════════════════════════════
// 808 PACK — heavy sub bass, tight
// ═══════════════════════════════════════

function tr808Kick() {
    const duration = 0.6, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const freq = 55 - (25 * t / duration);
        mono[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-3.5 * t) * 0.95;
        // Subbier click
        mono[i] += Math.sin(2 * Math.PI * 120 * t) * Math.exp(-50 * t) * 0.5;
    }
    writeToStereo(buf, mono, 0);
    return buf;
}

function tr808Snare() {
    const duration = 0.2, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const tone1 = Math.sin(2 * Math.PI * 180 * t) * 0.4;
        const tone2 = Math.sin(2 * Math.PI * 330 * t) * 0.25;
        const noise = (Math.random() * 2 - 1) * 0.5;
        mono[i] = (tone1 + tone2 + noise) * Math.exp(-14 * t);
    }
    writeToStereo(buf, mono, 0);
    return buf;
}

function tr808HiHat() {
    const duration = 0.05, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    // 808 hi-hat uses 6 square wave oscillators
    const hatFreqs = [2000, 3150, 4500, 5350, 6450, 7900];
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        let val = 0;
        for (const f of hatFreqs) {
            val += (Math.sin(2 * Math.PI * f * t) > 0 ? 1 : -1);
        }
        mono[i] = val / hatFreqs.length * Math.exp(-60 * t) * 0.4;
    }
    writeToStereo(buf, mono, -0.25);
    return buf;
}

function tr808Clap() {
    const duration = 0.25, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        let val = 0;
        // Multiple bursts
        for (let b = 0; b < 4; b++) {
            const bt = b * 0.008;
            if (t >= bt) {
                val += (Math.random() * 2 - 1) * Math.exp(-25 * (t - bt)) * 0.3;
            }
        }
        // Reverb tail
        val += (Math.random() * 2 - 1) * Math.exp(-6 * t) * 0.2;
        mono[i] = val;
    }
    writeToStereo(buf, mono, 0.15);
    return buf;
}

function tr808Cowbell() {
    const duration = 0.15, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        mono[i] = (Math.sin(2 * Math.PI * 587 * t) + Math.sin(2 * Math.PI * 845 * t))
            * Math.exp(-15 * t) * 0.3;
    }
    writeToStereo(buf, mono, 0.3);
    return buf;
}

// ═══════════════════════════════════════
// ELECTRO PACK — sharper, metallic
// ═══════════════════════════════════════

function electroKick() {
    const duration = 0.3, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const freq = 100 - (60 * t / duration);
        mono[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-8 * t);
        // Distortion
        mono[i] = Math.tanh(mono[i] * 3) * 0.7;
    }
    writeToStereo(buf, mono, 0);
    return buf;
}

function electroSnare() {
    const duration = 0.15, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const noise = (Math.random() * 2 - 1) * 0.7;
        const tone = Math.sin(2 * Math.PI * 250 * t) * 0.6;
        mono[i] = Math.tanh((noise + tone) * 2) * Math.exp(-15 * t) * 0.8;
    }
    writeToStereo(buf, mono, 0);
    return buf;
}

function electroZap() {
    const duration = 0.1, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const freq = 4000 * Math.exp(-30 * t);
        mono[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-12 * t) * 0.5;
    }
    writeToStereo(buf, mono, 0.5);
    return buf;
}

function electroLaser() {
    const duration = 0.2, sr = 44100;
    const buf = createBuffer(duration, 2, sr);
    const mono = new Float32Array(Math.ceil(duration * sr));
    for (let i = 0; i < mono.length; i++) {
        const t = i / sr;
        const freq = 1500 - (1400 * t / duration);
        let val = Math.sin(2 * Math.PI * freq * t);
        val = val > 0 ? 0.5 : -0.5; // Square
        mono[i] = val * Math.exp(-8 * t) * 0.4;
    }
    writeToStereo(buf, mono, -0.4);
    return buf;
}

// ═══════════════════════════════════════
// SAMPLE PACK REGISTRY
// ═══════════════════════════════════════

const FACTORY_MAP = {
    0: synthBassDrum, 1: synthSnare, 2: synthHiHatClosed, 3: synthHiHatOpen,
    4: synthClap, 5: synthTomLow, 6: synthTomHigh, 7: synthRimshot,
    8: synthBassSynth, 9: synthLeadSynth, 10: synthChordStab, 11: synthBell,
    12: synthVinylCrackle, 13: synthSubBoom, 18: synthFXGlitch,
};

const LOFI_MAP = {
    0: lofiKick, 1: lofiSnare, 2: lofiHat, 3: synthHiHatOpen,
    4: synthClap, 5: synthTomLow, 6: synthTomHigh, 7: synthRimshot,
    8: synthBassSynth, 9: synthLeadSynth, 10: lofiChord, 11: synthBell,
    12: synthVinylCrackle, 13: synthSubBoom, 18: synthFXGlitch,
};

const TR808_MAP = {
    0: tr808Kick, 1: tr808Snare, 2: tr808HiHat, 3: synthHiHatOpen,
    4: tr808Clap, 5: synthTomLow, 6: synthTomHigh, 7: tr808Cowbell,
    8: synthBassSynth, 9: synthLeadSynth, 10: synthChordStab, 11: synthBell,
    12: synthVinylCrackle, 13: synthSubBoom, 18: synthFXGlitch,
};

const ELECTRO_MAP = {
    0: electroKick, 1: electroSnare, 2: tr808HiHat, 3: synthHiHatOpen,
    4: tr808Clap, 5: synthTomLow, 6: synthTomHigh, 7: synthRimshot,
    8: synthBassSynth, 9: synthLeadSynth, 10: synthChordStab, 11: synthBell,
    12: electroZap, 13: electroLaser, 18: synthFXGlitch,
};

export const SAMPLE_PACKS = {
    FACTORY: { name: 'FACTORY', map: FACTORY_MAP },
    LOFI: { name: 'LOFI', map: LOFI_MAP },
    '808': { name: '808', map: TR808_MAP },
    ELECTRO: { name: 'ELECTRO', map: ELECTRO_MAP },
};

export const PACK_NAMES = Object.keys(SAMPLE_PACKS);

/**
 * LazyBufferCache — generates samples on first access.
 */
class LazyBufferCache {
    constructor() {
        this._cache = new Map(); // key: `${packName}-${pad}` → AudioBuffer
        this._currentPack = 'FACTORY';
    }

    get currentPack() { return this._currentPack; }

    setPack(packName) {
        this._currentPack = SAMPLE_PACKS[packName] ? packName : 'FACTORY';
    }

    getBuffer(padNumber, packName) {
        const pack = packName || this._currentPack;
        const key = `${pack}-${padNumber}`;

        if (this._cache.has(key)) return this._cache.get(key);

        const packDef = SAMPLE_PACKS[pack];
        if (!packDef || !packDef.map[padNumber]) return null;

        const buffer = packDef.map[padNumber]();
        this._cache.set(key, buffer);
        return buffer;
    }

    // Generate all samples for a pack (for preloading)
    preloadPack(packName) {
        const pack = SAMPLE_PACKS[packName];
        if (!pack) return;
        for (const pad of Object.keys(pack.map)) {
            this.getBuffer(Number(pad), packName);
        }
    }

    clearCache() {
        this._cache.clear();
    }
}

export const bufferCache = new LazyBufferCache();
export { getAudioContext };
