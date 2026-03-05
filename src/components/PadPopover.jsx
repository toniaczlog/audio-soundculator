import { useState, useEffect, useRef } from 'react';
import { PAD_INFO } from '../lib/padMap';

export default function PadPopover({
    padNumber,
    audioEngine,
    onClose,
    position, // { x, y }
}) {
    const padInfo = PAD_INFO.find(p => p.pad === padNumber);
    const [volume, setVolume] = useState((audioEngine.volumes.get(padNumber) || 0.8) * 100);
    const [pitch, setPitch] = useState(audioEngine.pitches.get(padNumber) || 0);
    const popoverRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                onClose();
            }
        };
        // Slight delay to avoid immediate close from the trigger
        const timer = setTimeout(() => {
            document.addEventListener('pointerdown', handleClick);
        }, 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('pointerdown', handleClick);
        };
    }, [onClose]);

    const handleVolumeChange = (e) => {
        const v = Number(e.target.value);
        setVolume(v);
        audioEngine.setVolume(padNumber, v / 100);
    };

    const handlePitchChange = (e) => {
        const p = Number(e.target.value);
        setPitch(p);
        audioEngine.setPitch(padNumber, p);
    };

    const handleClear = () => {
        audioEngine.clearPad(padNumber);
        onClose();
    };

    // Position adjustment
    const style = {
        top: Math.min(position?.y || 200, window.innerHeight - 250),
        left: Math.min(Math.max(position?.x || 100, 10), window.innerWidth - 240),
    };

    const sampleName = audioEngine.customNames.get(padNumber) || padInfo?.sampleName || '---';

    return (
        <div className="pad-popover" ref={popoverRef} style={style} role="dialog" aria-label={`Pad ${padNumber} settings`}>
            <div className="popover-title">
                PAD {padNumber} — {sampleName}
            </div>

            <div className="popover-slider-group">
                <div className="popover-slider-label">
                    <span>VOLUME</span>
                    <span>{Math.round(volume)}%</span>
                </div>
                <input
                    type="range"
                    className="popover-slider"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    aria-label="Volume"
                />
            </div>

            <div className="popover-slider-group">
                <div className="popover-slider-label">
                    <span>PITCH</span>
                    <span>{pitch > 0 ? '+' : ''}{pitch} st</span>
                </div>
                <input
                    type="range"
                    className="popover-slider"
                    min="-12"
                    max="12"
                    value={pitch}
                    onChange={handlePitchChange}
                    aria-label="Pitch in semitones"
                />
            </div>

            <button className="popover-btn" onClick={handleClear}>
                CLEAR PAD
            </button>
        </div>
    );
}
