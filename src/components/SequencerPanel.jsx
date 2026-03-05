import { useState, useCallback } from 'react';
import clsx from 'clsx';

export default function SequencerPanel({
    steps = 16,
    currentStep,
    activeSteps, // function(stepIndex) → boolean (has any active pads)
    isStepActive, // function(stepIndex) → boolean (current selected pad)
    onToggleStep,
    currentPattern,
    onSwitchPattern,
    onCopyPattern,
    chainMode,
    onToggleChain,
}) {
    const [expanded, setExpanded] = useState(true);

    const patternLabels = ['A', 'B', 'C', 'D'];

    const handlePatternLongPress = useCallback((index) => {
        // Copy current pattern to target
        onCopyPattern?.(index);
    }, [onCopyPattern]);

    return (
        <div className={clsx('sequencer-panel', expanded ? 'expanded' : 'collapsed')}
            role="region" aria-label="Sequencer">
            {/* Toggle handle */}
            <div
                className="seq-toggle"
                onClick={() => setExpanded(v => !v)}
                role="button"
                aria-label={expanded ? 'Collapse sequencer' : 'Expand sequencer'}
                tabIndex={0}
            />

            <div className="seq-label">SEQUENCER</div>

            {/* Steps row 1 (1-8) */}
            <div className="seq-steps" role="group" aria-label="Steps 1-8">
                {Array.from({ length: 8 }, (_, i) => (
                    <button
                        key={i}
                        className={clsx('seq-step', {
                            active: isStepActive?.(i),
                            current: currentStep === i,
                        })}
                        onClick={() => onToggleStep?.(i)}
                        aria-label={`Step ${i + 1}${isStepActive?.(i) ? ' (active)' : ''}`}
                        aria-pressed={isStepActive?.(i)}
                    />
                ))}
            </div>

            {/* Steps row 2 (9-16) */}
            <div className="seq-steps" role="group" aria-label="Steps 9-16">
                {Array.from({ length: 8 }, (_, i) => (
                    <button
                        key={i + 8}
                        className={clsx('seq-step', {
                            active: isStepActive?.(i + 8),
                            current: currentStep === i + 8,
                        })}
                        onClick={() => onToggleStep?.(i + 8)}
                        aria-label={`Step ${i + 9}${isStepActive?.(i + 8) ? ' (active)' : ''}`}
                        aria-pressed={isStepActive?.(i + 8)}
                    />
                ))}
            </div>

            {/* Pattern tabs */}
            <div className="pattern-tabs">
                {patternLabels.map((label, i) => {
                    let longPressTimer = null;
                    return (
                        <button
                            key={label}
                            className={clsx('pattern-tab', { active: currentPattern === i })}
                            onPointerDown={() => {
                                longPressTimer = setTimeout(() => {
                                    handlePatternLongPress(i);
                                    longPressTimer = null;
                                }, 500);
                            }}
                            onPointerUp={() => {
                                if (longPressTimer) {
                                    clearTimeout(longPressTimer);
                                    onSwitchPattern?.(i);
                                }
                            }}
                            onPointerLeave={() => {
                                if (longPressTimer) clearTimeout(longPressTimer);
                            }}
                            aria-label={`Pattern ${label}${currentPattern === i ? ' (active)' : ''}`}
                            aria-pressed={currentPattern === i}
                        >
                            {label}
                        </button>
                    );
                })}

                <button
                    className={clsx('chain-toggle', { active: chainMode })}
                    onClick={onToggleChain}
                    aria-label={`Chain mode ${chainMode ? 'on' : 'off'}`}
                    aria-pressed={chainMode}
                >
                    CHAIN
                </button>
            </div>
        </div>
    );
}
