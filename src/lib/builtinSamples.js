/**
 * Built-in sample synthesis using Web Audio API.
 * Each function creates and returns an AudioBuffer with the synthesized sound.
 */

let _audioCtx = null;

function getAudioContext() {
    if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
}

function createBuffer(duration, sampleRate = 44100) {
    const ctx = getAudioContext();
    return ctx.createBuffer(1, Math.ceil(duration * sampleRate), sampleRate);
}

function applyEnvelope(data, attack, decay, sampleRate = 44100) {
    const attackSamples = Math.ceil(attack * sampleRate);
    const decaySamples = data.length - attackSamples;
    for (let i = 0; i < data.length; i++) {
        let env = 1;
        if (i < attackSamples) {
            env = i / attackSamples;
        } else {
            const decayPos = (i - attackSamples) / decaySamples;
            env = Math.max(0, 1 - decayPos);
        }
        data[i] *= env;
    }
}

function applyExpDecay(data, decayRate = 5, sampleRate = 44100) {
    for (let i = 0; i < data.length; i++) {
        data[i] *= Math.exp(-decayRate * i / sampleRate);
    }
}

// PAD 0 — Bass Drum: Sine sweep 80Hz→30Hz, 0.35s
function synthBassDrum() {
    const duration = 0.35;
    const sr = 44100;
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        const freq = 80 - (50 * t / duration);
        const phase = 2 * Math.PI * freq * t;
        data[i] = Math.sin(phase) * Math.exp(-6 * t);
    }
    // Punchy click at start
    for (let i = 0; i < Math.min(200, data.length); i++) {
        data[i] += Math.sin(2 * Math.PI * 160 * i / sr) * Math.exp(-40 * i / sr) * 0.6;
    }
    return buf;
}

// PAD 1 — Snare: Noise burst + 200Hz tone, 0.15s
function synthSnare() {
    const duration = 0.18;
    const sr = 44100;
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        const noise = (Math.random() * 2 - 1) * 0.6;
        const tone = Math.sin(2 * Math.PI * 200 * t) * 0.5;
        data[i] = (noise + tone) * Math.exp(-12 * t);
    }
    return buf;
}

// PAD 2 — Hi-Hat Closed: Short bandpass noise, 0.06s
function synthHiHatClosed() {
    const duration = 0.06;
    const sr = 44100;
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        // High-freq noise
        data[i] = (Math.random() * 2 - 1) * Math.exp(-50 * t) * 0.5;
        // Add metallic character
        data[i] += Math.sin(2 * Math.PI * 6000 * t) * Math.exp(-60 * t) * 0.2;
    }
    return buf;
}

// PAD 3 — Hi-Hat Open: Longer bandpass noise, 0.3s
function synthHiHatOpen() {
    const duration = 0.3;
    const sr = 44100;
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-6 * t) * 0.4;
        data[i] += Math.sin(2 * Math.PI * 6000 * t) * Math.exp(-8 * t) * 0.15;
    }
    return buf;
}

// PAD 4 — Clap: 3 layered noise bursts
function synthClap() {
    const duration = 0.2;
    const sr = 44100;
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    const burstTimes = [0, 0.01, 0.023];
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        let val = 0;
        for (const bt of burstTimes) {
            if (t >= bt) {
                const localT = t - bt;
                val += (Math.random() * 2 - 1) * Math.exp(-20 * localT) * 0.35;
            }
        }
        // Reverb tail
        val += (Math.random() * 2 - 1) * Math.exp(-8 * t) * 0.15;
        data[i] = val;
    }
    return buf;
}

// PAD 5 — Tom Low: Sine sweep 120Hz→60Hz, 0.25s
function synthTomLow() {
    const duration = 0.25;
    const sr = 44100;
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        const freq = 120 - (60 * t / duration);
        data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-8 * t) * 0.8;
    }
    return buf;
}

// PAD 6 — Tom High: Sine sweep 220Hz→100Hz, 0.2s
function synthTomHigh() {
    const duration = 0.2;
    const sr = 44100;
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        const freq = 220 - (120 * t / duration);
        data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-10 * t) * 0.8;
    }
    return buf;
}

// PAD 7 — Rimshot: Sharp click + 400Hz ping, 0.08s
function synthRimshot() {
    const duration = 0.08;
    const sr = 44100;
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        // Click
        const click = (Math.random() * 2 - 1) * Math.exp(-80 * t) * 0.6;
        // Ping
        const ping = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-30 * t) * 0.7;
        data[i] = click + ping;
    }
    return buf;
}

// PAD 8 — Bass Synth: Short sawtooth 80Hz, 0.3s, lowpass filtered approx
function synthBassSynth() {
    const duration = 0.3;
    const sr = 44100;
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        // Sawtooth approximation
        let val = 0;
        for (let h = 1; h <= 6; h++) {
            val += Math.sin(2 * Math.PI * 80 * h * t) / h;
        }
        data[i] = val * 0.3 * Math.exp(-5 * t);
    }
    return buf;
}

// PAD 9 — Lead Synth: Square wave 440Hz, 0.25s, slight vibrato
function synthLeadSynth() {
    const duration = 0.25;
    const sr = 44100;
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        const vibrato = Math.sin(2 * Math.PI * 5 * t) * 10;
        const freq = 440 + vibrato;
        // Square wave via harmonics
        let val = 0;
        for (let h = 1; h <= 7; h += 2) {
            val += Math.sin(2 * Math.PI * freq * h * t) / h;
        }
        data[i] = val * 0.25 * Math.exp(-6 * t);
    }
    return buf;
}

// PAD 10 — Chord Stab: 3-voice detuned saw (E minor), 0.2s
function synthChordStab() {
    const duration = 0.2;
    const sr = 44100;
    const freqs = [164.81, 196.00, 246.94]; // E3, G3, B3
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        let val = 0;
        for (const f of freqs) {
            for (let h = 1; h <= 4; h++) {
                val += Math.sin(2 * Math.PI * f * h * t) / h;
            }
        }
        data[i] = val * 0.12 * Math.exp(-8 * t);
    }
    return buf;
}

// PAD 11 — Bell: FM synthesis, carrier 880Hz, modulator 1760Hz
function synthBell() {
    const duration = 0.8;
    const sr = 44100;
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        const mod = Math.sin(2 * Math.PI * 1760 * t) * 400 * Math.exp(-3 * t);
        data[i] = Math.sin(2 * Math.PI * (880 + mod) * t) * Math.exp(-3 * t) * 0.4;
    }
    return buf;
}

// PAD 12 — Vinyl Crackle: Pink noise burst, 0.4s
function synthVinylCrackle() {
    const duration = 0.4;
    const sr = 44100;
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise approximation (Voss-McCartney simplified)
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        // Add crackle pops
        const crackle = Math.random() > 0.98 ? (Math.random() * 2 - 1) * 0.3 : 0;
        const t = i / sr;
        data[i] = (pink * 0.04 + crackle) * Math.exp(-2 * t);
    }
    return buf;
}

// PAD 13 — Sub Boom: Very low sine 35Hz, 0.5s
function synthSubBoom() {
    const duration = 0.5;
    const sr = 44100;
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        data[i] = Math.sin(2 * Math.PI * 35 * t) * Math.exp(-4 * t) * 0.9;
        // Add a click transient
        data[i] += Math.sin(2 * Math.PI * 100 * t) * Math.exp(-30 * t) * 0.4;
    }
    return buf;
}

// PAD 18 — FX / Glitch: Short glitchy noise burst with pitch sweep
function synthFXGlitch() {
    const duration = 0.15;
    const sr = 44100;
    const buf = createBuffer(duration, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        const freq = 2000 - (1800 * t / duration);
        const tone = Math.sin(2 * Math.PI * freq * t);
        const noise = Math.random() * 2 - 1;
        // Bit-crushed effect
        const mixed = (tone * 0.5 + noise * 0.3);
        const crushed = Math.round(mixed * 8) / 8;
        data[i] = crushed * Math.exp(-10 * t) * 0.5;
    }
    return buf;
}

// Map pad number → synth function
const SYNTH_MAP = {
    0: synthBassDrum,
    1: synthSnare,
    2: synthHiHatClosed,
    3: synthHiHatOpen,
    4: synthClap,
    5: synthTomLow,
    6: synthTomHigh,
    7: synthRimshot,
    8: synthBassSynth,
    9: synthLeadSynth,
    10: synthChordStab,
    11: synthBell,
    12: synthVinylCrackle,
    13: synthSubBoom,
    18: synthFXGlitch,
};

/**
 * Generate all built-in sample buffers.
 * Returns Map<padNumber, AudioBuffer>
 */
export function generateBuiltinSamples() {
    const samples = new Map();
    for (const [pad, synthFn] of Object.entries(SYNTH_MAP)) {
        samples.set(Number(pad), synthFn());
    }
    return samples;
}

export { getAudioContext };
