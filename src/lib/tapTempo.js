/**
 * Tap Tempo — averages last 4 tap intervals to calculate BPM.
 */

class TapTempo {
    constructor() {
        this.taps = [];
        this.maxTaps = 4;
        this.timeout = 2000; // Reset after 2s of inactivity
        this._lastTap = 0;
    }

    tap() {
        const now = performance.now();

        // Reset if too long since last tap
        if (now - this._lastTap > this.timeout) {
            this.taps = [];
        }

        this.taps.push(now);
        this._lastTap = now;

        // Keep only last N taps
        if (this.taps.length > this.maxTaps) {
            this.taps = this.taps.slice(-this.maxTaps);
        }

        // Need at least 2 taps to calculate
        if (this.taps.length < 2) return null;

        // Average intervals
        let totalInterval = 0;
        for (let i = 1; i < this.taps.length; i++) {
            totalInterval += this.taps[i] - this.taps[i - 1];
        }
        const avgInterval = totalInterval / (this.taps.length - 1);

        // Convert ms interval to BPM
        const bpm = Math.round(60000 / avgInterval);
        return Math.max(40, Math.min(300, bpm));
    }

    reset() {
        this.taps = [];
        this._lastTap = 0;
    }
}

const tapTempo = new TapTempo();
export default tapTempo;
