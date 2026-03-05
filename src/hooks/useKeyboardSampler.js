/**
 * useKeyboardSampler — Hook that maps physical keyboard to pad triggers.
 */

import { useEffect, useCallback } from 'react';
import { KEY_TO_PAD } from '../lib/padMap';

export default function useKeyboardSampler({
    triggerPad,
    onPlay,
    onStop,
    onRec,
    onClear,
    onTap,
    onLegend,
    setPressed,
}) {
    const onKeyDown = useCallback((e) => {
        if (e.repeat) return;

        // Prevent Tab from changing focus
        if (e.key === 'Tab') {
            e.preventDefault();
        }
        // Prevent F1 from opening browser help
        if (e.key === 'F1') {
            e.preventDefault();
        }

        const action = KEY_TO_PAD[e.key];

        if (action === undefined) return;

        if (typeof action === 'number') {
            triggerPad(action);
            if (setPressed) setPressed(action);
        } else {
            switch (action) {
                case 'PLAY': onPlay?.(); break;
                case 'STOP': onStop?.(); break;
                case 'REC': onRec?.(); break;
                case 'CLEAR': onClear?.(); break;
                case 'TAP': onTap?.(); break;
                case 'LEGEND': onLegend?.(); break;
            }
            if (setPressed) setPressed(action);
        }
    }, [triggerPad, onPlay, onStop, onRec, onClear, onTap, onLegend, setPressed]);

    const onKeyUp = useCallback((e) => {
        const action = KEY_TO_PAD[e.key];
        if (action !== undefined && setPressed) {
            setPressed(null);
        }
    }, [setPressed]);

    useEffect(() => {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [onKeyDown, onKeyUp]);
}
