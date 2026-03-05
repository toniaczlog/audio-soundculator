import { useState, useEffect, useCallback, useRef } from 'react';

import LCDDisplay from './components/LCDDisplay';
import CalcBody from './components/CalcBody';
import SequencerPanel from './components/SequencerPanel';
import LegendModal from './components/LegendModal';
import SampleLibrary from './components/SampleLibrary';
import PadPopover from './components/PadPopover';
import FXPanel from './components/FXPanel';

import audioEngine from './lib/audioEngine';
import sequencer from './lib/sequencer';
import tapTempoUtil from './lib/tapTempo';
import { PAD_INFO } from './lib/padMap';
import { loadFromShareLink } from './lib/exportPattern';
import useKeyboardSampler from './hooks/useKeyboardSampler';

export default function App() {
  // LCD state
  const [activePad, setActivePad] = useState(null);
  const [currentSampleName, setCurrentSampleName] = useState('---');
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(-1);
  const [lcdMessage, setLcdMessage] = useState(null);
  const [isBooting, setIsBooting] = useState(true);

  // UI state
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pressedKey, setPressedKey] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [popoverPad, setPopoverPad] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ x: 100, y: 200 });
  const [showFX, setShowFX] = useState(false);
  const [currentPattern, setCurrentPattern] = useState(0);
  const [chainMode, setChainMode] = useState(false);
  const [selectedPadForSeq, setSelectedPadForSeq] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [, forceUpdate] = useState(0); // For re-render triggers

  const flashTimerRef = useRef(null);
  const pressTimerRef = useRef(null);
  const longPressTimerRef = useRef(null);

  // ─── Boot Sequence ───
  useEffect(() => {
    const bootTimer = setTimeout(() => {
      setLcdMessage('SOUNDCULATOR v1.0');
    }, 300);

    const readyTimer = setTimeout(() => {
      setLcdMessage('READY');
    }, 1500);

    const finalTimer = setTimeout(() => {
      setIsBooting(false);
      setLcdMessage(null);
    }, 2200);

    return () => {
      clearTimeout(bootTimer);
      clearTimeout(readyTimer);
      clearTimeout(finalTimer);
    };
  }, []);

  // ─── Share Link Import ───
  useEffect(() => {
    const loaded = loadFromShareLink();
    if (loaded) {
      setBpm(sequencer.bpm);
      setLcdMessage('PATTERN LOADED');
      setTimeout(() => setLcdMessage(null), 2000);
    }
  }, []);

  // ─── Initialize Audio on first interaction ───
  const initAudio = useCallback(async () => {
    if (audioReady) return;
    try {
      await audioEngine.init();
      setAudioReady(true);
    } catch (e) {
      console.error('Audio init failed:', e);
    }
  }, [audioReady]);

  // ─── Sequencer Callbacks ───
  useEffect(() => {
    sequencer.setOnStep((step) => {
      setCurrentStep(step);
    });

    sequencer.setOnPatternChange((pattern) => {
      setCurrentPattern(pattern);
      const labels = ['A', 'B', 'C', 'D'];
      setLcdMessage(`PATTERN ${labels[pattern]}`);
      setTimeout(() => setLcdMessage(null), 800);
    });

    sequencer.setTriggerPad((padNum) => {
      audioEngine.triggerPad(padNum);
      flashPad(padNum);
    });
  }, []);

  // ─── Flash pad briefly ───
  const flashPad = useCallback((padNum) => {
    setActivePad(padNum);
    const padInfo = PAD_INFO.find(p => p.pad === padNum);
    if (padInfo) {
      setCurrentSampleName(audioEngine.customNames.get(padNum) || padInfo.sampleName);
    }
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      setActivePad(null);
    }, 120);
  }, []);

  // ─── Trigger Pad ───
  const triggerPad = useCallback(async (padNumber) => {
    await initAudio();
    audioEngine.triggerPad(padNumber);
    flashPad(padNumber);

    // Record to sequencer if recording
    if (sequencer.recording && sequencer.playing) {
      sequencer.recordPad(padNumber);
      setSelectedPadForSeq(padNumber);
      forceUpdate(v => v + 1);
    }
  }, [initAudio, flashPad]);

  // ─── Controls ───
  const handlePlay = useCallback(async () => {
    await initAudio();
    sequencer.start();
    setIsPlaying(true);
    setLcdMessage('▶ PLAY');
    setTimeout(() => setLcdMessage(null), 600);
  }, [initAudio]);

  const handleStop = useCallback(() => {
    sequencer.stop();
    setIsPlaying(false);
    setCurrentStep(-1);
    setLcdMessage('■ STOP');
    setTimeout(() => setLcdMessage(null), 600);
  }, []);

  const handleRec = useCallback(async () => {
    await initAudio();
    const recording = sequencer.toggleRecording();
    setIsRecording(recording);
    setLcdMessage(recording ? '● REC ON' : '● REC OFF');
    setTimeout(() => setLcdMessage(null), 600);
  }, [initAudio]);

  const handleClear = useCallback(() => {
    audioEngine.stopAll();
    if (isPlaying) {
      sequencer.stop();
      setIsPlaying(false);
      setCurrentStep(-1);
    }
    setIsRecording(false);
    sequencer.recording = false;
    setLcdMessage('CLEAR');
    setTimeout(() => setLcdMessage(null), 600);
  }, [isPlaying]);

  const handleTap = useCallback(async () => {
    await initAudio();
    const newBpm = tapTempoUtil.tap();
    if (newBpm) {
      setBpm(newBpm);
      sequencer.setBPM(newBpm);
      setLcdMessage(`TAP ${newBpm}`);
      setTimeout(() => setLcdMessage(null), 600);
    }
  }, [initAudio]);

  const handleLegend = useCallback(() => {
    setShowLegend(v => !v);
  }, []);

  // ─── Long press pad → popover ───
  const handleLongPressPad = useCallback((padNumber) => {
    const el = document.getElementById(`key-pad-${padNumber}`);
    const rect = el?.getBoundingClientRect();
    setPopoverPad(padNumber);
    setPopoverPos({
      x: rect ? rect.left : 100,
      y: rect ? rect.bottom + 8 : 200,
    });
  }, []);

  // ─── Long press ± → FX panel ───
  const handleLongPressFx = useCallback(() => {
    setShowFX(v => !v);
  }, []);

  // ─── Keyboard pressed visual sync ───
  const setPressed = useCallback((key) => {
    setPressedKey(key);
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    if (key !== null) {
      pressTimerRef.current = setTimeout(() => {
        setPressedKey(null);
      }, 150);
    }
  }, []);

  // ─── Sequencer step toggle for selected pad ───
  const handleToggleStep = useCallback((stepIndex) => {
    sequencer.toggleStep(selectedPadForSeq, stepIndex);
    forceUpdate(v => v + 1);
  }, [selectedPadForSeq]);

  const isStepActive = useCallback((stepIndex) => {
    return sequencer.isStepActive(selectedPadForSeq, stepIndex);
  }, [selectedPadForSeq]);

  const hasActiveStepsAtIndex = useCallback((stepIndex) => {
    return sequencer.hasActiveStepsAtIndex(stepIndex);
  }, []);

  // ─── Pattern controls ───
  const handleSwitchPattern = useCallback((index) => {
    sequencer.switchPattern(index);
    setCurrentPattern(index);
    const labels = ['A', 'B', 'C', 'D'];
    setLcdMessage(`PATTERN ${labels[index]}`);
    setTimeout(() => setLcdMessage(null), 600);
    forceUpdate(v => v + 1);
  }, []);

  const handleCopyPattern = useCallback((targetIndex) => {
    sequencer.copyPatternTo(targetIndex);
    const labels = ['A', 'B', 'C', 'D'];
    setLcdMessage(`COPY → ${labels[targetIndex]}`);
    setTimeout(() => setLcdMessage(null), 600);
  }, []);

  const handleToggleChain = useCallback(() => {
    const chain = sequencer.toggleChainMode();
    setChainMode(chain);
    setLcdMessage(chain ? 'CHAIN ON' : 'CHAIN OFF');
    setTimeout(() => setLcdMessage(null), 600);
  }, []);

  // ─── Keyboard Hook ───
  useKeyboardSampler({
    triggerPad,
    onPlay: handlePlay,
    onStop: handleStop,
    onRec: handleRec,
    onClear: handleClear,
    onTap: handleTap,
    onLegend: handleLegend,
    setPressed,
  });

  // ─── Brand strip long press for library ───
  const handleBrandPointerDown = useCallback(() => {
    longPressTimerRef.current = setTimeout(() => {
      setShowLibrary(true);
      longPressTimerRef.current = null;
    }, 500);
  }, []);

  const handleBrandPointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }, []);

  return (
    <>
      {/* Calculator Body */}
      <div
        className="calc-body"
        onClick={initAudio}
        role="application"
        aria-label="Soundculator - Music Sampler Calculator"
      >
        {/* Brand Strip */}
        <div
          className="brand-strip"
          onPointerDown={handleBrandPointerDown}
          onPointerUp={handleBrandPointerUp}
          onPointerLeave={handleBrandPointerUp}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="brand-dot" />
            <span className="brand-name">SOUNDCULATOR</span>
          </div>
          <button
            className="brand-help"
            onClick={(e) => {
              e.stopPropagation();
              handleLegend();
            }}
            aria-label="Open keyboard shortcuts (F1)"
          >
            ?
          </button>
        </div>

        {/* LCD Display */}
        <LCDDisplay
          padNumber={activePad}
          sampleName={currentSampleName}
          bpm={bpm}
          currentStep={currentStep}
          sequencerSteps={hasActiveStepsAtIndex}
          isBooting={isBooting}
          lcdMessage={lcdMessage}
        />

        {/* Calculator Keys */}
        <CalcBody
          onPadTrigger={triggerPad}
          onClear={handleClear}
          onRec={handleRec}
          onPlay={handlePlay}
          onStop={() => isPlaying ? handleStop() : handleTap()}
          onTap={handleTap}
          onLongPressPad={handleLongPressPad}
          onLongPressFx={handleLongPressFx}
          activePad={activePad}
          pressedKey={pressedKey}
          isRecording={isRecording}
          isPlaying={isPlaying}
        />
      </div>

      {/* Sequencer Panel (below calculator) */}
      <SequencerPanel
        steps={16}
        currentStep={currentStep}
        activeSteps={hasActiveStepsAtIndex}
        isStepActive={isStepActive}
        onToggleStep={handleToggleStep}
        currentPattern={currentPattern}
        onSwitchPattern={handleSwitchPattern}
        onCopyPattern={handleCopyPattern}
        chainMode={chainMode}
        onToggleChain={handleToggleChain}
      />

      {/* FX Panel */}
      <FXPanel
        audioEngine={audioEngine}
        isOpen={showFX}
        onClose={() => setShowFX(false)}
      />

      {/* Legend Modal */}
      {showLegend && <LegendModal onClose={() => setShowLegend(false)} />}

      {/* Sample Library Drawer */}
      {showLibrary && (
        <SampleLibrary
          onClose={() => setShowLibrary(false)}
          onLoadSample={(pad) => {
            setLcdMessage(`LOADED PAD ${pad}`);
            setTimeout(() => setLcdMessage(null), 1000);
            forceUpdate(v => v + 1);
          }}
          audioEngine={audioEngine}
          onImportPattern={() => {
            setBpm(sequencer.bpm);
            setCurrentPattern(sequencer.currentPattern);
            forceUpdate(v => v + 1);
          }}
        />
      )}

      {/* Pad Popover */}
      {popoverPad !== null && (
        <PadPopover
          padNumber={popoverPad}
          audioEngine={audioEngine}
          onClose={() => setPopoverPad(null)}
          position={popoverPos}
        />
      )}
    </>
  );
}
