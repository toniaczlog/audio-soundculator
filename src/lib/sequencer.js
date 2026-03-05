/**
 * 16-step Sequencer Engine
 * Manages pattern playback, recording, and pattern memory (A/B/C/D).
 */

class Sequencer {
    constructor() {
        this.steps = 16;
        this.bpm = 120;
        this.currentStep = -1;
        this.playing = false;
        this.recording = false;

        // 4 pattern slots: A, B, C, D
        // Each pattern: Map<padNumber, boolean[16]>
        this.patterns = [
            new Map(), // A
            new Map(), // B
            new Map(), // C
            new Map(), // D
        ];
        this.currentPattern = 0; // 0=A, 1=B, 2=C, 3=D
        this.chainMode = false;

        this._intervalId = null;
        this._onStep = null;
        this._onPatternChange = null;
        this._triggerPad = null;

        // Mute/solo state
        this.mutedPads = new Set();
        this.soloedPad = null;
    }

    get activeSteps() {
        return this.patterns[this.currentPattern];
    }

    setOnStep(callback) {
        this._onStep = callback;
    }

    setOnPatternChange(callback) {
        this._onPatternChange = callback;
    }

    setTriggerPad(callback) {
        this._triggerPad = callback;
    }

    setBPM(bpm) {
        this.bpm = Math.max(40, Math.min(300, bpm));
        if (this.playing) {
            this.stop();
            this.start();
        }
    }

    toggleStep(padNumber, stepIndex) {
        const pattern = this.activeSteps;
        if (!pattern.has(padNumber)) {
            pattern.set(padNumber, new Array(this.steps).fill(false));
        }
        const steps = pattern.get(padNumber);
        steps[stepIndex] = !steps[stepIndex];
    }

    setStep(padNumber, stepIndex, value) {
        const pattern = this.activeSteps;
        if (!pattern.has(padNumber)) {
            pattern.set(padNumber, new Array(this.steps).fill(false));
        }
        pattern.get(padNumber)[stepIndex] = value;
    }

    isStepActive(padNumber, stepIndex) {
        const steps = this.activeSteps.get(padNumber);
        return steps ? steps[stepIndex] : false;
    }

    hasActiveStepsAtIndex(stepIndex) {
        for (const [, steps] of this.activeSteps) {
            if (steps[stepIndex]) return true;
        }
        return false;
    }

    start() {
        if (this.playing) return;
        this.playing = true;
        this.currentStep = -1;

        const stepInterval = (60 / this.bpm) * 1000 / 4; // 16th notes

        this._intervalId = setInterval(() => {
            this.currentStep = (this.currentStep + 1) % this.steps;

            // Chain mode: on step 0, advance pattern
            if (this.chainMode && this.currentStep === 0 && this.currentStep !== -1) {
                // Only advance after first full loop
                if (this._completedFirstLoop) {
                    this.currentPattern = (this.currentPattern + 1) % 4;
                    if (this._onPatternChange) {
                        this._onPatternChange(this.currentPattern);
                    }
                }
                this._completedFirstLoop = true;
            }

            // Fire active pads for this step
            for (const [padNumber, steps] of this.activeSteps) {
                if (steps[this.currentStep]) {
                    // Check mute/solo
                    if (this.soloedPad !== null && padNumber !== this.soloedPad) continue;
                    if (this.mutedPads.has(padNumber)) continue;

                    if (this._triggerPad) {
                        this._triggerPad(padNumber);
                    }
                }
            }

            if (this._onStep) {
                this._onStep(this.currentStep);
            }
        }, stepInterval);
    }

    stop() {
        this.playing = false;
        this.currentStep = -1;
        this._completedFirstLoop = false;
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        if (this._onStep) {
            this._onStep(-1);
        }
    }

    toggleRecording() {
        this.recording = !this.recording;
        return this.recording;
    }

    recordPad(padNumber) {
        if (!this.recording || !this.playing) return;
        this.setStep(padNumber, this.currentStep, true);
    }

    switchPattern(index) {
        this.currentPattern = Math.max(0, Math.min(3, index));
        if (this._onPatternChange) {
            this._onPatternChange(this.currentPattern);
        }
    }

    copyPatternTo(targetIndex) {
        const source = this.patterns[this.currentPattern];
        const target = new Map();
        source.forEach((steps, pad) => {
            target.set(pad, [...steps]);
        });
        this.patterns[targetIndex] = target;
    }

    toggleChainMode() {
        this.chainMode = !this.chainMode;
        return this.chainMode;
    }

    toggleMute(padNumber) {
        if (this.mutedPads.has(padNumber)) {
            this.mutedPads.delete(padNumber);
        } else {
            this.mutedPads.add(padNumber);
        }
    }

    toggleSolo(padNumber) {
        if (this.soloedPad === padNumber) {
            this.soloedPad = null;
        } else {
            this.soloedPad = padNumber;
        }
    }

    clearPattern() {
        this.patterns[this.currentPattern] = new Map();
    }

    clearAll() {
        this.stop();
        this.recording = false;
        this.patterns = [new Map(), new Map(), new Map(), new Map()];
        this.currentPattern = 0;
        this.mutedPads.clear();
        this.soloedPad = null;
    }

    // Serialization
    toJSON() {
        const patternsData = this.patterns.map(pattern => {
            const obj = {};
            pattern.forEach((steps, pad) => {
                obj[pad] = steps;
            });
            return obj;
        });
        return {
            bpm: this.bpm,
            currentPattern: this.currentPattern,
            patterns: patternsData,
        };
    }

    fromJSON(data) {
        if (data.bpm) this.bpm = data.bpm;
        if (typeof data.currentPattern === 'number') this.currentPattern = data.currentPattern;
        if (data.patterns) {
            this.patterns = data.patterns.map(patternObj => {
                const map = new Map();
                Object.entries(patternObj).forEach(([pad, steps]) => {
                    map.set(Number(pad), steps);
                });
                return map;
            });
        }
    }
}

const sequencer = new Sequencer();
export default sequencer;
