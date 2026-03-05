import { KEY_TO_PAD } from '../lib/padMap';

const SECTIONS = [
    {
        title: 'DRUM PADS',
        items: [
            { key: '0', desc: 'PAD 0 — Bass Drum', variant: '' },
            { key: '1', desc: 'PAD 1 — Snare', variant: '' },
            { key: '2', desc: 'PAD 2 — Hi-Hat Closed', variant: '' },
            { key: '3', desc: 'PAD 3 — Hi-Hat Open', variant: '' },
            { key: '4', desc: 'PAD 4 — Clap', variant: '' },
            { key: '5', desc: 'PAD 5 — Tom Low', variant: '' },
            { key: '6', desc: 'PAD 6 — Tom High', variant: '' },
            { key: '7', desc: 'PAD 7 — Rimshot', variant: '' },
        ],
    },
    {
        title: 'SYNTH PADS',
        items: [
            { key: '8', desc: 'PAD 8 — Bass Synth', variant: '' },
            { key: '9', desc: 'PAD 9 — Lead Synth', variant: '' },
            { key: '/', desc: 'PAD 10 — Chord Stab', variant: 'op' },
            { key: '*', desc: 'PAD 11 — Bell', variant: 'op' },
            { key: '-', desc: 'PAD 12 — Vinyl Crackle', variant: 'op' },
            { key: '+', desc: 'PAD 13 — Sub Boom', variant: 'op' },
        ],
    },
    {
        title: 'CUSTOM SLOTS',
        items: [
            { key: 'm', desc: 'PAD 14 — Custom A', variant: 'func' },
            { key: 'r', desc: 'PAD 15 — Custom B', variant: 'func' },
            { key: 'p', desc: 'PAD 16 — Custom C', variant: 'func' },
            { key: 'n', desc: 'PAD 17 — Custom D', variant: '' },
            { key: '.', desc: 'PAD 18 — FX / Glitch', variant: '' },
        ],
    },
    {
        title: 'CONTROLS',
        items: [
            { key: 'Enter', desc: '▶ PLAY sequence', variant: 'ctrl' },
            { key: 'Esc', desc: '■ STOP sequence', variant: 'ctrl' },
            { key: 'Tab', desc: '● REC toggle', variant: 'func' },
            { key: 'c', desc: 'C/CE clear / panic', variant: 'clr' },
            { key: 't', desc: 'TAP tempo', variant: 'ctrl' },
            { key: 'F1', desc: 'Open/close this modal', variant: 'ctrl' },
        ],
    },
];

export default function LegendModal({ onClose }) {
    return (
        <div className="overlay-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Keyboard Legend">
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                <div className="modal-header">⌨ KEYBOARD MAP</div>
                <button className="modal-close" onClick={onClose} aria-label="Close modal">✕</button>

                <div className="legend-grid">
                    {SECTIONS.map((section, si) => (
                        <div key={si}>
                            <div className="legend-section">{section.title}</div>
                            {section.items.map((item, ii) => (
                                <div key={ii} className="legend-row">
                                    <span className={`legend-key ${item.variant}`}>{item.key}</span>
                                    <span className="legend-desc">{item.desc}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                <div style={{
                    textAlign: 'center',
                    marginTop: '16px',
                    fontFamily: "'VT323', monospace",
                    fontSize: '13px',
                    color: 'var(--shadow)',
                }}>
                    LONG PRESS any pad key for volume/pitch controls
                </div>
            </div>
        </div>
    );
}
