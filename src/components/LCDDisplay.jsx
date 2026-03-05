import { useState, useEffect, useRef, useCallback } from 'react';

const WAVE_FRAMES = [
    '▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
    '▁▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
    '▁▁▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
    '▁▁▁▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁',
];

const IDLE_WAVE = '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁';
const GHOST_TEXT = '8888888888888888';

export default function LCDDisplay({
    padNumber,
    sampleName,
    bpm,
    currentStep,
    sequencerSteps, // Map or function to check active steps
    isBooting,
    lcdMessage,
}) {
    const [waveFrame, setWaveFrame] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const waveTimerRef = useRef(null);
    const prevPadRef = useRef(null);
    const [displayName, setDisplayName] = useState(sampleName || '---');
    const [nameSlide, setNameSlide] = useState(false);

    // Trigger wave animation when pad changes
    useEffect(() => {
        if (padNumber !== null && padNumber !== prevPadRef.current) {
            setIsAnimating(true);
            setWaveFrame(0);
            setNameSlide(true);

            let frame = 0;
            if (waveTimerRef.current) clearInterval(waveTimerRef.current);

            waveTimerRef.current = setInterval(() => {
                frame++;
                if (frame >= WAVE_FRAMES.length) {
                    clearInterval(waveTimerRef.current);
                    setIsAnimating(false);
                    return;
                }
                setWaveFrame(frame);
            }, 60);

            // Slide name in
            setTimeout(() => setNameSlide(false), 20);

            prevPadRef.current = padNumber;
        }
    }, [padNumber]);

    // Update display name
    useEffect(() => {
        if (sampleName) {
            setDisplayName(sampleName);
        }
    }, [sampleName]);

    // Build step dots
    const renderStepDots = useCallback(() => {
        const dots = [];
        for (let i = 0; i < 16; i++) {
            let className = 'step-dot';
            if (i === currentStep) className += ' current';
            else if (sequencerSteps?.(i)) className += ' active';
            dots.push(<span key={i} className={className} />);
        }
        return dots;
    }, [currentStep, sequencerSteps]);

    if (isBooting) {
        return (
            <div className="lcd-container" role="status" aria-label="LCD Display">
                <div className="lcd-screen">
                    <div className="lcd-boot">
                        <div>{lcdMessage || 'SOUNDCULATOR'}</div>
                        <div className="version">v1.0</div>
                    </div>
                </div>
                <div className="lcd-screws-bottom"><span>●</span><span>●</span></div>
            </div>
        );
    }

    const padDisplay = padNumber !== null ? `PAD ${String(padNumber).padStart(2, '0')}` : 'PAD --';
    const bpmDisplay = `BPM ${bpm}`;
    const waveText = isAnimating ? WAVE_FRAMES[waveFrame] || IDLE_WAVE : IDLE_WAVE;

    return (
        <div className="lcd-container" role="status" aria-label="LCD Display">
            <div className="lcd-screen">
                {/* Ghost segments layer */}
                <div className="lcd-ghost" aria-hidden="true">
                    <span style={{ fontSize: '18px' }}>{GHOST_TEXT.slice(0, 6)}</span>
                    <span style={{ fontSize: '16px' }}>{GHOST_TEXT.slice(0, 8)}</span>
                </div>

                {/* Row 1: Pad + Sample Name */}
                <div className="lcd-row lcd-row-pad">
                    <span>{lcdMessage || padDisplay}</span>
                    <span style={{
                        transition: 'transform 0.2s ease-out, opacity 0.2s',
                        transform: nameSlide ? 'translateX(20px)' : 'translateX(0)',
                        opacity: nameSlide ? 0 : 1,
                        maxWidth: '140px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {displayName}
                    </span>
                </div>

                {/* Row 2: BPM + Step Dots */}
                <div className="lcd-row">
                    <span>{bpmDisplay}</span>
                    <div className="step-dots">
                        {renderStepDots()}
                    </div>
                </div>

                {/* Row 3: Waveform */}
                <div className="lcd-row lcd-row-wave">
                    <span>{waveText}</span>
                </div>
            </div>
            <div className="lcd-screws-bottom" aria-hidden="true">
                <span>●</span><span>●</span>
            </div>
        </div>
    );
}
