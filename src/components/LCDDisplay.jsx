import { useState, useEffect, useRef, useCallback } from 'react';

const WAVE_CHARS = '▁▂▃▄▅▆▇█';
const GHOST_TEXT = '8888888888888888';

export default function LCDDisplay({
    padNumber,
    sampleName,
    bpm,
    currentStep,
    sequencerSteps,
    isBooting,
    lcdMessage,
    audioEngine,  // #3: for AnalyserNode waveform
    lcdMode,      // #18: 'wave' | 'scope'
}) {
    const [isAnimating, setIsAnimating] = useState(false);
    const waveTimerRef = useRef(null);
    const prevPadRef = useRef(null);
    const [displayName, setDisplayName] = useState(sampleName || '---');
    const [nameSlide, setNameSlide] = useState(false);
    const canvasRef = useRef(null);
    const animFrameRef = useRef(null);
    const [waveText, setWaveText] = useState('▁'.repeat(32));

    // #7: BPM counter animation
    const [displayBpm, setDisplayBpm] = useState(bpm);
    const bpmAnimRef = useRef(null);
    const prevBpmRef = useRef(bpm);

    // #7: Animate BPM flick
    useEffect(() => {
        if (bpm !== prevBpmRef.current) {
            const from = prevBpmRef.current;
            const to = bpm;
            const diff = to - from;
            const totalFrames = 8;
            let frame = 0;

            if (bpmAnimRef.current) clearInterval(bpmAnimRef.current);

            bpmAnimRef.current = setInterval(() => {
                frame++;
                const progress = frame / totalFrames;
                // Ease-out
                const eased = 1 - Math.pow(1 - progress, 3);
                setDisplayBpm(Math.round(from + diff * eased));

                if (frame >= totalFrames) {
                    clearInterval(bpmAnimRef.current);
                    setDisplayBpm(to);
                }
            }, 30);

            prevBpmRef.current = bpm;
        }
    }, [bpm]);

    // Trigger animation when pad changes
    useEffect(() => {
        if (padNumber !== null && padNumber !== prevPadRef.current) {
            setIsAnimating(true);
            setNameSlide(true);
            setTimeout(() => setNameSlide(false), 20);
            setTimeout(() => setIsAnimating(false), 300);
            prevPadRef.current = padNumber;
        }
    }, [padNumber]);

    useEffect(() => {
        if (sampleName) setDisplayName(sampleName);
    }, [sampleName]);

    // #3, #18: Real-time waveform from AnalyserNode
    useEffect(() => {
        if (!audioEngine?.analyser) return;

        const drawWave = () => {
            const data = audioEngine.getWaveformData();
            if (data) {
                if (lcdMode === 'scope' && canvasRef.current) {
                    // Canvas oscilloscope mode
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');
                    const width = canvas.width;
                    const height = canvas.height;

                    ctx.clearRect(0, 0, width, height);

                    // Scanline background
                    ctx.fillStyle = 'rgba(200, 212, 160, 0.05)';
                    for (let y = 0; y < height; y += 3) {
                        ctx.fillRect(0, y, width, 1);
                    }

                    // Waveform
                    ctx.strokeStyle = '#2a4a1a';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();

                    const sliceWidth = width / data.length;
                    let x = 0;

                    for (let i = 0; i < data.length; i++) {
                        const v = data[i] / 128.0;
                        const y = (v * height) / 2;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                        x += sliceWidth;
                    }

                    ctx.stroke();

                    // Glow effect
                    ctx.strokeStyle = 'rgba(42, 74, 26, 0.3)';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                } else {
                    // ASCII waveform mode
                    const chars = [];
                    const step = Math.floor(data.length / 32);
                    for (let i = 0; i < 32; i++) {
                        const sample = data[i * step] || 128;
                        const normalized = Math.abs(sample - 128) / 128;
                        const charIdx = Math.min(WAVE_CHARS.length - 1, Math.floor(normalized * WAVE_CHARS.length * 2));
                        chars.push(WAVE_CHARS[charIdx] || '▁');
                    }
                    setWaveText(chars.join(''));
                }
            }
            animFrameRef.current = requestAnimationFrame(drawWave);
        };

        drawWave();
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [audioEngine, lcdMode]);

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
                        <div className="version">v2.0</div>
                    </div>
                </div>
                <div className="lcd-screws-bottom"><span>●</span><span>●</span></div>
            </div>
        );
    }

    const padDisplay = padNumber !== null ? `PAD ${String(padNumber).padStart(2, '0')}` : 'PAD --';
    const bpmDisplay = `BPM ${displayBpm}`;

    return (
        <div className="lcd-container" role="status" aria-label="LCD Display">
            <div className="lcd-screen">
                {/* Ghost segments */}
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

                {/* Row 3: Waveform (ASCII or Canvas scope) */}
                <div className="lcd-row lcd-row-wave">
                    {lcdMode === 'scope' ? (
                        <canvas
                            ref={canvasRef}
                            width={300}
                            height={20}
                            style={{ width: '100%', height: '20px', imageRendering: 'pixelated' }}
                        />
                    ) : (
                        <span>{waveText}</span>
                    )}
                </div>
            </div>
            <div className="lcd-screws-bottom" aria-hidden="true">
                <span>●</span><span>●</span>
            </div>
        </div>
    );
}
