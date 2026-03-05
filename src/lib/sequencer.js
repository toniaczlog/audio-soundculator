/**
 * Sequencer v2 — Web Audio clock scheduling, swing, velocity, undo/redo, localStorage persist.
 */

class Sequencer {
    constructor() {
        this.steps = 16;
        this.bpm = 120;
        this.swing = 0;         // #2: 0-75%
        this.currentStep = -1;
        this.playing = false;
        this.recording = false;

        // 4 pattern slots A/B/C/D
        // Each pattern: Map<padNumber, (boolean|number)[16]>
        // Value: false = off, true = normal (1.0), 0.4 = ghost, 1.0 = normal, 1.3 = accent (#13)
        this.patterns = [new Map(), new Map(), new Map(), new Map()];
        this.currentPattern = 0;
        this.chainMode = false;

        // #4: Web Audio clock scheduling
        this._schedulerTimer = null;
        this._nextStepTime = 0;
        this._scheduleAheadTime = 0.1; // seconds
        this._lookAhead = 25; // ms

        this._onStep = null;
        this._onPatternChange = null;
        this._triggerPad = null;
        this._schedulePad = null; // #4: Web Audio scheduled trigger
        this._audioCtx = null;

        // Mute/solo
        this.mutedPads = new Set();
        this.soloedPad = null;

        // #12: Undo/Redo
        this._undoStack = [];
        this._redoStack = [];
        this._maxUndo = 20;
    }

    get activeSteps() {
        return this.patterns[this.currentPattern];
    }

    setOnStep(callback) { this._onStep = callback; }
    setOnPatternChange(callback) { this._onPatternChange = callback; }
    setTriggerPad(callback) { this._triggerPad = callback; }
    setSchedulePad(callback) { this._schedulePad = callback; }
    setAudioContext(ctx) { this._audioCtx = ctx; }

    setBPM(bpm) {
        this.bpm = Math.max(40, Math.min(300, bpm));
        // If playing, the scheduler loop auto-adapts (no restart needed)
    }

    setSwing(value) {
        this.swing = Math.max(0, Math.min(75, value));
    }

    // #2: Calculate step time with swing
    _getStepDuration(stepIndex) {
        const baseStep = 60 / this.bpm / 4; // 16th note duration
        if (this.swing === 0) return baseStep;

        // Swing: delay every odd step
        const swingAmount = (this.swing / 100) * baseStep;
        if (stepIndex % 2 === 1) {
            return baseStep + swingAmount;
        } else {
            return baseStep - swingAmount;
        }
    }

    // #13: Cycle velocity for a step
    // false → 0.4 (ghost) → true/1.0 (normal) → 1.3 (accent) → false
    static VELOCITY_CYCLE = [false, 0.4, 1.0, 1.3];

    toggleStep(padNumber, stepIndex) {
        this._pushUndo();
        const pattern = this.activeSteps;
        if (!pattern.has(padNumber)) {
            pattern.set(padNumber, new Array(this.steps).fill(false));
        }
        const steps = pattern.get(padNumber);
        const current = steps[stepIndex];

        // #13: Cycle through velocity levels
        const cycle = Sequencer.VELOCITY_CYCLE;
        const currentIdx = current === false ? 0
            : current === 0.4 ? 1
                : (current === true || current === 1.0) ? 2
                    : current === 1.3 ? 3
                        : 0;
        const nextIdx = (currentIdx + 1) % cycle.length;
        steps[stepIndex] = cycle[nextIdx];

        this._autoPersist();
    }

    setStep(padNumber, stepIndex, value) {
        const pattern = this.activeSteps;
        if (!pattern.has(padNumber)) {
            pattern.set(padNumber, new Array(this.steps).fill(false));
        }
        pattern.get(padNumber)[stepIndex] = value;
        this._autoPersist();
    }

    isStepActive(padNumber, stepIndex) {
        const steps = this.activeSteps.get(padNumber);
        if (!steps) return false;
        return steps[stepIndex] !== false;
    }

    // #13: Get velocity value for a step
    getStepVelocity(padNumber, stepIndex) {
        const steps = this.activeSteps.get(padNumber);
        if (!steps) return false;
        const v = steps[stepIndex];
        if (v === false) return false;
        if (v === true) return 1.0;
        return v;
    }

    hasActiveStepsAtIndex(stepIndex) {
        for (const [, steps] of this.activeSteps) {
            if (steps[stepIndex] && steps[stepIndex] !== false) return true;
        }
        return false;
    }

    // Get all pads that have steps in current pattern
    getActivePads() {
        const pads = new Set();
        for (const [pad, steps] of this.activeSteps) {
            if (steps.some(s => s !== false)) pads.add(pad);
        }
        return pads;
    }

    // #4: Web Audio clock-based scheduling
    start() {
        if (this.playing) return;
        this.playing = true;
        this.currentStep = -1;
        this._completedFirstLoop = false;

        if (this._audioCtx) {
            this._nextStepTime = this._audioCtx.currentTime + 0.05;
            this._scheduleLoop();
        } else {
            // Fallback to setInterval
            this._startIntervalFallback();
        }
    }

    _scheduleLoop() {
        this._schedulerTimer = setInterval(() => {
            if (!this._audioCtx || !this.playing) return;

            while (this._nextStepTime < this._audioCtx.currentTime + this._scheduleAheadTime) {
                this.currentStep = (this.currentStep + 1) % this.steps;

                // Chain mode
                if (this.chainMode && this.currentStep === 0) {
                    if (this._completedFirstLoop) {
                        this.currentPattern = (this.currentPattern + 1) % 4;
                        if (this._onPatternChange) this._onPatternChange(this.currentPattern);
                    }
                    this._completedFirstLoop = true;
                }

                // Schedule pads
                for (const [padNumber, steps] of this.activeSteps) {
                    const stepVal = steps[this.currentStep];
                    if (stepVal === false) continue;

                    if (this.soloedPad !== null && padNumber !== this.soloedPad) continue;
                    if (this.mutedPads.has(padNumber)) continue;

                    const velocity = typeof stepVal === 'number' ? stepVal : 1.0;

                    if (this._schedulePad) {
                        this._schedulePad(padNumber, this._nextStepTime, velocity);
                    } else if (this._triggerPad) {
                        this._triggerPad(padNumber, velocity);
                    }
                }

                if (this._onStep) this._onStep(this.currentStep);

                // Advance time with swing
                this._nextStepTime += this._getStepDuration(this.currentStep);
            }
        }, this._lookAhead);
    }

    _startIntervalFallback() {
        const stepInterval = (60 / this.bpm) * 1000 / 4;
        this._schedulerTimer = setInterval(() => {
            this.currentStep = (this.currentStep + 1) % this.steps;

            if (this.chainMode && this.currentStep === 0) {
                if (this._completedFirstLoop) {
                    this.currentPattern = (this.currentPattern + 1) % 4;
                    if (this._onPatternChange) this._onPatternChange(this.currentPattern);
                }
                this._completedFirstLoop = true;
            }

            for (const [padNumber, steps] of this.activeSteps) {
                const stepVal = steps[this.currentStep];
                if (stepVal === false) continue;
                if (this.soloedPad !== null && padNumber !== this.soloedPad) continue;
                if (this.mutedPads.has(padNumber)) continue;

                const velocity = typeof stepVal === 'number' ? stepVal : 1.0;
                if (this._triggerPad) this._triggerPad(padNumber, velocity);
            }

            if (this._onStep) this._onStep(this.currentStep);
        }, stepInterval);
    }

    stop() {
        this.playing = false;
        this.currentStep = -1;
        this._completedFirstLoop = false;
        if (this._schedulerTimer) {
            clearInterval(this._schedulerTimer);
            this._schedulerTimer = null;
        }
        if (this._onStep) this._onStep(-1);
    }

    toggleRecording() {
        this.recording = !this.recording;
        return this.recording;
    }

    recordPad(padNumber) {
        if (!this.recording || !this.playing || this.currentStep < 0) return;
        this._pushUndo();
        this.setStep(padNumber, this.currentStep, 1.0);
    }

    switchPattern(index) {
        this.currentPattern = Math.max(0, Math.min(3, index));
        if (this._onPatternChange) this._onPatternChange(this.currentPattern);
    }

    copyPatternTo(targetIndex) {
        const source = this.patterns[this.currentPattern];
        const target = new Map();
        source.forEach((steps, pad) => target.set(pad, [...steps]));
        this.patterns[targetIndex] = target;
    }

    toggleChainMode() {
        this.chainMode = !this.chainMode;
        return this.chainMode;
    }

    toggleMute(padNumber) {
        if (this.mutedPads.has(padNumber)) this.mutedPads.delete(padNumber);
        else this.mutedPads.add(padNumber);
    }

    toggleSolo(padNumber) {
        this.soloedPad = this.soloedPad === padNumber ? null : padNumber;
    }

    clearPattern() {
        this._pushUndo();
        this.patterns[this.currentPattern] = new Map();
        this._autoPersist();
    }

    clearAll() {
        this.stop();
        this.recording = false;
        this.patterns = [new Map(), new Map(), new Map(), new Map()];
        this.currentPattern = 0;
        this.mutedPads.clear();
        this.soloedPad = null;
        this._autoPersist();
    }

    // ═══ #12: Undo/Redo ═══

    _pushUndo() {
        this._undoStack.push(this._snapshotPattern());
        if (this._undoStack.length > this._maxUndo) this._undoStack.shift();
        this._redoStack = [];
    }

    _snapshotPattern() {
        const snap = new Map();
        this.activeSteps.forEach((steps, pad) => snap.set(pad, [...steps]));
        return { pattern: this.currentPattern, data: snap };
    }

    _restoreSnapshot(snap) {
        this.patterns[snap.pattern] = snap.data;
        if (snap.pattern !== this.currentPattern) {
            this.currentPattern = snap.pattern;
            if (this._onPatternChange) this._onPatternChange(this.currentPattern);
        }
    }

    undo() {
        if (this._undoStack.length === 0) return false;
        this._redoStack.push(this._snapshotPattern());
        const snap = this._undoStack.pop();
        this._restoreSnapshot(snap);
        this._autoPersist();
        return true;
    }

    redo() {
        if (this._redoStack.length === 0) return false;
        this._undoStack.push(this._snapshotPattern());
        const snap = this._redoStack.pop();
        this._restoreSnapshot(snap);
        this._autoPersist();
        return true;
    }

    get canUndo() { return this._undoStack.length > 0; }
    get canRedo() { return this._redoStack.length > 0; }

    // ═══ #20: localStorage Persistence ═══

    _autoPersist() {
        try {
            localStorage.setItem('soundculator-patterns', JSON.stringify(this.toJSON()));
        } catch (e) { /* ignore */ }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('soundculator-patterns');
            if (saved) {
                this.fromJSON(JSON.parse(saved));
                return true;
            }
        } catch (e) { /* ignore */ }
        return false;
    }

    // ═══ Serialization ═══

    toJSON() {
        const patternsData = this.patterns.map(pattern => {
            const obj = {};
            pattern.forEach((steps, pad) => { obj[pad] = steps; });
            return obj;
        });
        return {
            bpm: this.bpm,
            swing: this.swing,
            currentPattern: this.currentPattern,
            patterns: patternsData,
        };
    }

    fromJSON(data) {
        if (data.bpm) this.bpm = data.bpm;
        if (typeof data.swing === 'number') this.swing = data.swing;
        if (typeof data.currentPattern === 'number') this.currentPattern = data.currentPattern;
        if (data.patterns) {
            this.patterns = data.patterns.map(patternObj => {
                const map = new Map();
                Object.entries(patternObj).forEach(([pad, steps]) => {
                    map.set(Number(pad), steps.map(s => s === null ? false : s));
                });
                return map;
            });
        }
    }
}

const sequencer = new Sequencer();
export default sequencer;
