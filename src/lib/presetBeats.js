/**
 * Preset Beats — ready-made patterns to load instantly.
 * Each preset defines BPM, swing, and step data per pad.
 * Steps: false = off, 0.4 = ghost, 1.0 = normal, 1.3 = accent
 */

const _ = false;
const g = 0.4;   // ghost
const n = 1.0;   // normal
const a = 1.3;   // accent

export const PRESET_BEATS = [
    {
        name: 'BOOM BAP',
        bpm: 90,
        swing: 30,
        pattern: {
            0: [a, _, _, _, _, _, _, _, a, _, _, _, _, _, n, _], // kick
            1: [_, _, _, _, a, _, _, _, _, _, _, _, a, _, _, _], // snare
            2: [n, _, n, _, n, _, n, _, n, _, n, _, n, _, n, _], // hh closed
            3: [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, n], // hh open
        },
    },
    {
        name: 'FOUR FLOOR',
        bpm: 128,
        swing: 0,
        pattern: {
            0: [a, _, _, _, a, _, _, _, a, _, _, _, a, _, _, _], // kick on every beat
            2: [_, _, n, _, _, _, n, _, _, _, n, _, _, _, n, _], // hh offbeat
            1: [_, _, _, _, a, _, _, _, _, _, _, _, a, _, _, _], // snare 2&4
            4: [_, _, _, _, _, _, _, _, _, _, _, n, _, _, _, _], // clap
        },
    },
    {
        name: 'TRAP 808',
        bpm: 140,
        swing: 0,
        pattern: {
            0: [a, _, _, _, _, _, _, n, _, _, a, _, _, _, _, _], // 808 kick
            1: [_, _, _, _, a, _, _, _, _, _, _, _, a, _, _, _], // snare
            2: [n, n, g, n, n, g, n, n, n, g, n, n, n, g, n, n], // rapid hi-hat
            3: [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, n], // open hat
        },
    },
    {
        name: 'DISCO',
        bpm: 115,
        swing: 10,
        pattern: {
            0: [a, _, _, _, a, _, _, _, a, _, _, _, a, _, _, _],
            1: [_, _, _, _, a, _, _, _, _, _, _, _, a, _, _, _],
            3: [_, _, n, _, _, _, n, _, _, _, n, _, _, _, n, _], // open hat offbeat
            4: [_, _, _, _, a, _, _, _, _, _, _, _, a, _, _, _], // clap on 2&4
        },
    },
    {
        name: 'REGGAETON',
        bpm: 95,
        swing: 0,
        pattern: {
            0: [a, _, _, n, _, _, n, _, a, _, _, n, _, _, n, _], // dembow kick
            1: [_, _, _, _, a, _, _, _, _, _, _, _, a, _, _, _],
            2: [n, _, n, _, n, _, n, _, n, _, n, _, n, _, n, _],
            7: [_, _, _, n, _, _, _, _, _, _, _, n, _, _, _, _], // rimshot
        },
    },
    {
        name: 'HOUSE',
        bpm: 124,
        swing: 5,
        pattern: {
            0: [a, _, _, _, a, _, _, _, a, _, _, _, a, _, _, _],
            2: [g, _, n, _, g, _, n, _, g, _, n, _, g, _, n, _],
            4: [_, _, _, _, a, _, _, _, _, _, _, _, a, _, _, _],
            8: [n, _, _, _, _, _, _, _, n, _, _, _, _, _, _, _], // bass synth
        },
    },
    {
        name: 'DNBASS',
        bpm: 174,
        swing: 0,
        pattern: {
            0: [a, _, _, _, _, _, _, _, _, _, n, _, n, _, _, _],
            1: [_, _, _, _, a, _, _, _, _, _, _, _, _, _, a, _],
            2: [n, _, n, _, n, _, n, _, n, _, n, _, n, _, n, _],
            3: [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, n],
        },
    },
    {
        name: 'LO-FI',
        bpm: 80,
        swing: 45,
        pattern: {
            0: [a, _, _, _, _, _, n, _, _, _, a, _, _, _, _, _],
            1: [_, _, _, _, a, _, _, _, _, _, _, g, a, _, _, _],
            2: [g, _, n, _, g, _, n, _, g, _, n, _, g, _, n, _],
            12: [g, g, g, g, g, g, g, g, g, g, g, g, g, g, g, g], // vinyl crackle layer
        },
    },
    {
        name: 'TECHNO',
        bpm: 135,
        swing: 0,
        pattern: {
            0: [a, _, _, _, a, _, _, _, a, _, _, _, a, _, _, _],
            2: [n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n], // constant hh
            4: [_, _, _, _, _, _, _, _, _, _, _, _, a, _, _, _],
            7: [_, _, n, _, _, _, _, _, _, _, n, _, _, _, _, _], // rimshot
        },
    },
    {
        name: 'BOSSA',
        bpm: 100,
        swing: 20,
        pattern: {
            0: [a, _, _, n, _, _, _, _, a, _, _, _, _, n, _, _],
            7: [_, _, n, _, _, n, _, _, _, _, n, _, _, n, _, _], // rimshot pattern
            2: [g, _, n, _, g, _, n, _, g, _, n, _, g, _, n, _],
            1: [_, _, _, _, _, _, _, _, _, _, _, _, n, _, _, _],
        },
    },
    {
        name: 'AMBIENT',
        bpm: 70,
        swing: 15,
        pattern: {
            11: [n, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _], // bell
            10: [_, _, _, _, _, _, _, _, n, _, _, _, _, _, _, _], // chord
            12: [g, g, g, g, g, g, g, g, g, g, g, g, g, g, g, g], // vinyl
            13: [n, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _], // sub boom
        },
    },
    {
        name: 'AFROBEAT',
        bpm: 110,
        swing: 20,
        pattern: {
            0: [a, _, _, n, _, _, a, _, _, _, n, _, _, a, _, _],
            1: [_, _, _, _, a, _, _, _, _, n, _, _, a, _, _, _],
            2: [n, n, g, n, n, g, n, n, g, n, n, g, n, n, g, n],
            11: [_, _, _, _, _, _, _, _, n, _, _, _, _, _, _, _], // bell accent
        },
    },
];
