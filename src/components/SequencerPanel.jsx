import { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { PAD_INFO } from '../lib/padMap';

// #16: Emoji icons for pads
const PAD_ICONS = {
    0: '🥁', 1: '🪘', 2: '🔔', 3: '🔔', 4: '👏',
    5: '🎯', 6: '🎯', 7: '🥢', 8: '🎸', 9: '🎹',
    10: '🎵', 11: '🔔', 12: '💿', 13: '💥', 14: '🅰',
    15: '🅱', 16: '©', 17: '🅳', 18: '⚡',
};

export default function SequencerPanel({
    steps = 16,
    currentStep,
    sequencer,   // direct sequencer reference for multi-pad view
    onToggleStep,
    currentPattern,
    onSwitchPattern,
    onCopyPattern,
    chainMode,
    onToggleChain,
    selectedPad,
    onSelectPad,
    swing,
    onSwingChange,
    onLoadPreset,
    presetNames,
    forceRender,
}) {
    const [expanded, setExpanded] = useState(true);
    const [viewMode, setViewMode] = useState('single'); // 'single' | 'multi' (#1)
    const [showPresets, setShowPresets] = useState(false);

    const patternLabels = ['A', 'B', 'C', 'D'];

    // #1: Get all active pads for multi-view
    const activePads = useMemo(() => {
        if (!sequencer) return [selectedPad ?? 0];
        const pads = [];
        for (const [pad, stepsArr] of sequencer.activeSteps) {
            if (stepsArr.some(s => s !== false)) pads.push(pad);
        }
        // Always show selected pad
        if (selectedPad !== undefined && !pads.includes(selectedPad)) {
            pads.unshift(selectedPad);
        }
        pads.sort((a, b) => a - b);
        return pads.length > 0 ? pads : [selectedPad ?? 0];
    }, [sequencer, selectedPad, forceRender]);

    // #13: Get velocity class
    const getVelocityClass = (padNum, stepIdx) => {
        if (!sequencer) return '';
        const v = sequencer.getStepVelocity(padNum, stepIdx);
        if (v === false) return '';
        if (v <= 0.5) return 'ghost';
        if (v >= 1.2) return 'accent';
        return 'active';
    };

    const handlePatternLongPress = useCallback((index) => {
        onCopyPattern?.(index);
    }, [onCopyPattern]);

    const padInfo = PAD_INFO.find(p => p.pad === selectedPad) || PAD_INFO[0];

    return (
        <div className={clsx('sequencer-panel', expanded ? 'expanded' : 'collapsed')}
            role="region" aria-label="Sequencer">
            <div
                className="seq-toggle"
                onClick={() => setExpanded(v => !v)}
                role="button"
                aria-label={expanded ? 'Collapse sequencer' : 'Expand sequencer'}
                tabIndex={0}
            />

            {/* Header with pad selector (#11) and view toggle (#1) */}
            <div className="seq-header">
                <div className="seq-label">SEQUENCER</div>
                <div className="seq-controls-row">
                    {/* #11: Pad selector */}
                    <select
                        className="seq-pad-select"
                        value={selectedPad ?? 0}
                        onChange={(e) => onSelectPad?.(Number(e.target.value))}
                        aria-label="Select pad for step editing"
                    >
                        {PAD_INFO.map(p => (
                            <option key={p.pad} value={p.pad}>
                                {PAD_ICONS[p.pad] || ''} PAD {p.pad} — {p.sampleName}
                            </option>
                        ))}
                    </select>

                    {/* #1: View mode toggle */}
                    <button
                        className={clsx('seq-view-btn', { active: viewMode === 'multi' })}
                        onClick={() => setViewMode(v => v === 'single' ? 'multi' : 'single')}
                        aria-label={viewMode === 'single' ? 'Switch to multi-pad view' : 'Switch to single pad view'}
                        title={viewMode === 'single' ? 'Multi-pad view' : 'Single pad view'}
                    >
                        {viewMode === 'single' ? '☰' : '▬'}
                    </button>

                    {/* Presets toggle (#5) */}
                    <button
                        className={clsx('seq-view-btn', { active: showPresets })}
                        onClick={() => setShowPresets(v => !v)}
                        aria-label="Show preset beats"
                        title="Preset beats"
                    >
                        ♫
                    </button>
                </div>
            </div>

            {/* #5: Preset beats dropdown */}
            {showPresets && (
                <div className="seq-presets">
                    {presetNames?.map((name, i) => (
                        <button
                            key={i}
                            className="preset-btn"
                            onClick={() => {
                                onLoadPreset?.(i);
                                setShowPresets(false);
                            }}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            )}

            {/* #2: Swing slider */}
            <div className="seq-swing-row">
                <span className="seq-swing-label">SWING</span>
                <input
                    type="range"
                    className="seq-swing-slider"
                    min="0"
                    max="75"
                    value={swing || 0}
                    onChange={(e) => onSwingChange?.(Number(e.target.value))}
                    aria-label="Swing amount"
                />
                <span className="seq-swing-value">{swing || 0}%</span>
            </div>

            {viewMode === 'single' ? (
                <>
                    {/* Single pad view: 16 steps in 2 rows */}
                    <div className="seq-steps" role="group" aria-label="Steps 1-8">
                        {Array.from({ length: 8 }, (_, i) => {
                            const velClass = getVelocityClass(selectedPad ?? 0, i);
                            return (
                                <button
                                    key={i}
                                    className={clsx('seq-step', velClass, {
                                        current: currentStep === i,
                                    })}
                                    onClick={() => onToggleStep?.(i)}
                                    aria-label={`Step ${i + 1}`}
                                />
                            );
                        })}
                    </div>
                    <div className="seq-steps" role="group" aria-label="Steps 9-16">
                        {Array.from({ length: 8 }, (_, i) => {
                            const velClass = getVelocityClass(selectedPad ?? 0, i + 8);
                            return (
                                <button
                                    key={i + 8}
                                    className={clsx('seq-step', velClass, {
                                        current: currentStep === i + 8,
                                    })}
                                    onClick={() => onToggleStep?.(i + 8)}
                                    aria-label={`Step ${i + 9}`}
                                />
                            );
                        })}
                    </div>
                </>
            ) : (
                /* #1: Multi-pad view — one row per pad */
                <div className="seq-multi">
                    {activePads.map(padNum => {
                        const info = PAD_INFO.find(p => p.pad === padNum);
                        return (
                            <div
                                key={padNum}
                                className={clsx('seq-multi-row', { selected: padNum === selectedPad })}
                                onClick={() => onSelectPad?.(padNum)}
                            >
                                <span className="seq-multi-label" title={info?.sampleName}>
                                    {PAD_ICONS[padNum] || '•'}
                                </span>
                                <div className="seq-multi-steps">
                                    {Array.from({ length: 16 }, (_, i) => {
                                        const velClass = getVelocityClass(padNum, i);
                                        return (
                                            <button
                                                key={i}
                                                className={clsx('seq-mini-step', velClass, {
                                                    current: currentStep === i,
                                                })}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectPad?.(padNum);
                                                    onToggleStep?.(i, padNum);
                                                }}
                                                aria-label={`Pad ${padNum} Step ${i + 1}`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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
                            aria-label={`Pattern ${label}`}
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
