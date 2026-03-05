import { useRef, useCallback } from 'react';
import clsx from 'clsx';

export default function CalcKey({
    label,
    subLabel,
    variant = 'digit',
    onTrigger,
    onLongPress,
    isActive = false,
    isPressed = false,
    isDoubleHeight = false,
    isRecording = false,
    ariaLabel,
    id,
}) {
    const longPressTimer = useRef(null);
    const wasLongPress = useRef(false);

    const handlePointerDown = useCallback((e) => {
        e.preventDefault();
        wasLongPress.current = false;

        if (onLongPress) {
            longPressTimer.current = setTimeout(() => {
                wasLongPress.current = true;
                onLongPress();
            }, 500);
        }
    }, [onLongPress]);

    const handlePointerUp = useCallback((e) => {
        e.preventDefault();
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        if (!wasLongPress.current) {
            onTrigger?.();
        }
        wasLongPress.current = false;
    }, [onTrigger]);

    const handlePointerLeave = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const className = clsx(
        'calc-key',
        variant,
        {
            'double-height': isDoubleHeight,
            'pressed': isPressed,
            'flash': isActive,
        }
    );

    return (
        <button
            id={id}
            className={className}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={ariaLabel || label}
            role="button"
            tabIndex={0}
        >
            {variant === 'rec' && (
                <span className={clsx('rec-led', { on: isRecording })} aria-hidden="true" />
            )}
            <span className="key-label">{label}</span>
            {subLabel && <span className="key-sub">{subLabel}</span>}
        </button>
    );
}
