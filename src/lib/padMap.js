// Physical keyboard → Pad number mapping
export const KEY_TO_PAD = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '/': 10,
  '*': 11,
  '-': 12,
  '+': 13,
  'm': 14,
  'r': 15,
  'p': 16,
  'n': 17,
  '.': 18,
  // Controls
  'c': 'CLEAR',
  'Enter': 'PLAY',
  'Escape': 'STOP',
  'Tab': 'REC',
  't': 'TAP',
  'F1': 'LEGEND',
};

// Pad metadata: label, sample name, button variant
export const PAD_INFO = [
  { pad: 0,  label: '0',   calcLabel: '0',   sampleName: 'BASS DRM',  variant: 'digit' },
  { pad: 1,  label: '1',   calcLabel: '1',   sampleName: 'SNARE',     variant: 'digit' },
  { pad: 2,  label: '2',   calcLabel: '2',   sampleName: 'HH CLSD',   variant: 'digit' },
  { pad: 3,  label: '3',   calcLabel: '3',   sampleName: 'HH OPEN',   variant: 'digit' },
  { pad: 4,  label: '4',   calcLabel: '4',   sampleName: 'CLAP',      variant: 'digit' },
  { pad: 5,  label: '5',   calcLabel: '5',   sampleName: 'TOM LO',    variant: 'digit' },
  { pad: 6,  label: '6',   calcLabel: '6',   sampleName: 'TOM HI',    variant: 'digit' },
  { pad: 7,  label: '7',   calcLabel: '7',   sampleName: 'RIMSHOT',   variant: 'digit' },
  { pad: 8,  label: '8',   calcLabel: '8',   sampleName: 'BASS SYN',  variant: 'digit' },
  { pad: 9,  label: '9',   calcLabel: '9',   sampleName: 'LEAD SYN',  variant: 'digit' },
  { pad: 10, label: '÷',   calcLabel: '÷',   sampleName: 'CRD STAB',  variant: 'operator' },
  { pad: 11, label: '×',   calcLabel: '×',   sampleName: 'BELL',      variant: 'operator' },
  { pad: 12, label: '−',   calcLabel: '−',   sampleName: 'VINYL',     variant: 'operator' },
  { pad: 13, label: '+',   calcLabel: '+',   sampleName: 'SUB BOOM',  variant: 'operator' },
  { pad: 14, label: 'MC',  calcLabel: 'MC',  sampleName: 'CUSTOM A',  variant: 'memory' },
  { pad: 15, label: 'MR',  calcLabel: 'MR',  sampleName: 'CUSTOM B',  variant: 'memory' },
  { pad: 16, label: 'M+',  calcLabel: 'M+',  sampleName: 'CUSTOM C',  variant: 'memory' },
  { pad: 17, label: '±',   calcLabel: '±',   sampleName: 'CUSTOM D',  variant: 'digit' },
  { pad: 18, label: '.',   calcLabel: '.',   sampleName: 'FX GLTCH',  variant: 'digit' },
];

// Grid layout definition — each cell in reading order (row by row)
// null = skip (used by double-height spans)
export const GRID_LAYOUT = [
  // Row 0: MC, MR, M+, C/CE, REC
  { pad: 14, variant: 'memory' },
  { pad: 15, variant: 'memory' },
  { pad: 16, variant: 'memory' },
  { type: 'clear', label: 'C/CE' },
  { type: 'rec', label: '●REC' },

  // Row 1: 7, 8, 9, ÷, PLAY (double-height start)
  { pad: 7 },
  { pad: 8 },
  { pad: 9 },
  { pad: 10, variant: 'operator' },
  { type: 'play', label: '▶', doubleHeight: true },

  // Row 2: 4, 5, 6, ×, (PLAY continues)
  { pad: 4 },
  { pad: 5 },
  { pad: 6 },
  { pad: 11, variant: 'operator' },
  null, // PLAY spans here

  // Row 3: 1, 2, 3, −, STOP (double-height start)
  { pad: 1 },
  { pad: 2 },
  { pad: 3 },
  { pad: 12, variant: 'operator' },
  { type: 'stop', label: '■', doubleHeight: true },

  // Row 4: ±, 0, ., +, (STOP continues → becomes TAP)
  { pad: 17 },
  { pad: 0 },
  { pad: 18 },
  { pad: 13, variant: 'operator' },
  null, // STOP spans here
];

// Keyboard key → on-screen pad/action for highlight sync
export const KEY_TO_GRID_INDEX = {};
Object.entries(KEY_TO_PAD).forEach(([key, padOrAction]) => {
  KEY_TO_GRID_INDEX[key] = padOrAction;
});
