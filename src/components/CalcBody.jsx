import CalcKey from './CalcKey';
import { PAD_INFO, GRID_LAYOUT } from '../lib/padMap';

export default function CalcBody({
    onPadTrigger,
    onClear,
    onRec,
    onPlay,
    onStop,
    onTap,
    onLongPressPad,
    onLongPressFx,
    activePad,
    pressedKey,
    isRecording,
    isPlaying,
}) {
    const getPadInfo = (padNum) => PAD_INFO.find(p => p.pad === padNum);

    const isKeyPressed = (padOrAction) => {
        return pressedKey === padOrAction;
    };

    const renderKey = (cell, index) => {
        if (cell === null) return null; // Skip cells covered by span

        // Control keys
        if (cell.type) {
            switch (cell.type) {
                case 'clear':
                    return (
                        <CalcKey
                            key={`ctrl-${index}`}
                            id="key-clear"
                            label="C/CE"
                            variant="clear"
                            onTrigger={onClear}
                            isPressed={isKeyPressed('CLEAR')}
                            ariaLabel="Clear / panic stop all sounds"
                        />
                    );
                case 'rec':
                    return (
                        <CalcKey
                            key={`ctrl-${index}`}
                            id="key-rec"
                            label="●REC"
                            variant="rec"
                            onTrigger={onRec}
                            isPressed={isKeyPressed('REC')}
                            isRecording={isRecording}
                            ariaLabel="Toggle record mode"
                        />
                    );
                case 'play':
                    return (
                        <CalcKey
                            key={`ctrl-${index}`}
                            id="key-play"
                            label="▶"
                            variant="control"
                            onTrigger={onPlay}
                            isPressed={isKeyPressed('PLAY')}
                            isDoubleHeight={true}
                            ariaLabel="Play sequencer"
                        />
                    );
                case 'stop':
                    return (
                        <CalcKey
                            key={`ctrl-${index}`}
                            id="key-stop"
                            label="■ / TAP"
                            subLabel="STOP·TAP"
                            variant="control"
                            onTrigger={() => {
                                if (isPlaying) {
                                    onStop?.();
                                } else {
                                    onTap?.();
                                }
                            }}
                            onLongPress={onTap}
                            isPressed={isKeyPressed('STOP') || isKeyPressed('TAP')}
                            isDoubleHeight={true}
                            ariaLabel="Stop sequencer / Tap tempo"
                        />
                    );
                default:
                    return null;
            }
        }

        // Pad keys
        const padInfo = getPadInfo(cell.pad);
        if (!padInfo) return null;

        const variant = cell.variant || padInfo.variant;

        return (
            <CalcKey
                key={`pad-${cell.pad}`}
                id={`key-pad-${cell.pad}`}
                label={padInfo.calcLabel}
                subLabel={`PAD ${cell.pad}`}
                variant={variant}
                onTrigger={() => onPadTrigger(cell.pad)}
                onLongPress={
                    cell.pad === 17 ? onLongPressFx : () => onLongPressPad?.(cell.pad)
                }
                isActive={activePad === cell.pad}
                isPressed={isKeyPressed(cell.pad)}
                ariaLabel={`${padInfo.calcLabel} - ${padInfo.sampleName} (Pad ${cell.pad})`}
            />
        );
    };

    return (
        <div className="calc-grid" role="group" aria-label="Calculator keypad">
            {GRID_LAYOUT.map((cell, i) => renderKey(cell, i)).filter(Boolean)}
        </div>
    );
}
