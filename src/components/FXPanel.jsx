import { useState, useRef, useCallback } from 'react';
import clsx from 'clsx';

export default function FXPanel({ audioEngine, isOpen, onClose }) {
    const [masterVol, setMasterVol] = useState(80);
    const [reverbVal, setReverbVal] = useState(0);
    const [delayVal, setDelayVal] = useState(0);
    const [compOn, setCompOn] = useState(true);

    // Knob drag state
    const dragRef = useRef(null);

    const handleKnobStart = useCallback((param, e) => {
        e.preventDefault();
        const startY = e.clientY || e.touches?.[0]?.clientY;
        let currentVal;
        switch (param) {
            case 'reverb': currentVal = reverbVal; break;
            case 'delay': currentVal = delayVal; break;
            case 'master': currentVal = masterVol; break;
            default: return;
        }

        const onMove = (moveEvent) => {
            const y = moveEvent.clientY || moveEvent.touches?.[0]?.clientY;
            const delta = (startY - y) * 0.5; // Invert: drag up = increase
            const newVal = Math.max(0, Math.min(100, currentVal + delta));

            switch (param) {
                case 'reverb':
                    setReverbVal(Math.round(newVal));
                    audioEngine.setReverbMix(newVal / 100);
                    break;
                case 'delay':
                    setDelayVal(Math.round(newVal));
                    audioEngine.setDelayMix(newVal / 100);
                    break;
                case 'master':
                    setMasterVol(Math.round(newVal));
                    audioEngine.setMasterVolume(newVal / 100);
                    break;
            }
        };

        const onEnd = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onEnd);
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onEnd);
    }, [reverbVal, delayVal, masterVol, audioEngine]);

    return (
        <div className={clsx('fx-panel', { open: isOpen })} role="region" aria-label="Master FX Panel">
            <div className="fx-label">MASTER</div>
            <div
                className="fx-knob"
                style={{ transform: `rotate(${(masterVol / 100) * 270 - 135}deg)` }}
                onPointerDown={(e) => handleKnobStart('master', e)}
                role="slider"
                aria-label="Master volume"
                aria-valuenow={masterVol}
            />
            <div className="fx-value">{masterVol}%</div>

            <div className="fx-label">REVERB</div>
            <div
                className="fx-knob"
                style={{ transform: `rotate(${(reverbVal / 100) * 270 - 135}deg)` }}
                onPointerDown={(e) => handleKnobStart('reverb', e)}
                role="slider"
                aria-label="Reverb amount"
                aria-valuenow={reverbVal}
            />
            <div className="fx-value">{reverbVal}%</div>

            <div className="fx-label">DELAY</div>
            <div
                className="fx-knob"
                style={{ transform: `rotate(${(delayVal / 100) * 270 - 135}deg)` }}
                onPointerDown={(e) => handleKnobStart('delay', e)}
                role="slider"
                aria-label="Delay amount"
                aria-valuenow={delayVal}
            />
            <div className="fx-value">{delayVal}%</div>

            <div className="fx-label">COMP</div>
            <button
                className={clsx('fx-toggle', { active: compOn })}
                onClick={() => {
                    const next = !compOn;
                    setCompOn(next);
                    audioEngine.setCompEnabled(next);
                }}
                aria-label={`Compressor ${compOn ? 'on' : 'off'}`}
                aria-pressed={compOn}
            >
                {compOn ? 'ON' : 'OFF'}
            </button>
        </div>
    );
}
