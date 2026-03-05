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
import { PACK_NAMES } from './lib/builtinSamples';
import { PRESET_BEATS } from './lib/presetBeats';
import { loadFromShareLink } from './lib/exportPattern';
import useKeyboardSampler from './hooks/useKeyboardSampler';

export default function App() {
  // LCD state
  const [activePad, setActivePad] = useState(null);
  const [currentSampleName, setCurrentSampleName] = useState('---');
  const [bpm, setBpm] = useState(120);
  const [swing, setSwing] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);
  const [lcdMessage, setLcdMessage] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const [lcdMode, setLcdMode] = useState('wave'); // #18: 'wave' | 'scope'

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
  const [currentPack, setCurrentPack] = useState('FACTORY');
  const [darkMode, setDarkMode] = useState(false); // #6: Night mode
  const [, forceUpdate] = useState(0);

  const flashTimerRef = useRef(null);
  const pressTimerRef = useRef(null);
  const longPressTimerRef = useRef(null);

  // ─── Boot Sequence ───
  useEffect(() => {
    setTimeout(() => setLcdMessage('SOUNDCULATOR v2.0'), 300);
    setTimeout(() => setLcdMessage('READY'), 1500);
    setTimeout(() => { setIsBooting(false); setLcdMessage(null); }, 2200);

    // #20: Load persisted patterns
    const loaded = sequencer.loadFromStorage();
    if (loaded) {
      setBpm(sequencer.bpm);
      setSwing(sequencer.swing);
      setCurrentPattern(sequencer.currentPattern);
    }

    // #6: Load dark mode pref
    const dm = localStorage.getItem('soundculator-darkmode');
    if (dm === 'true') setDarkMode(true);
  }, []);

  // #6: Apply dark mode class
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('soundculator-darkmode', darkMode);
  }, [darkMode]);

  // Share link import
  useEffect(() => {
    const loaded = loadFromShareLink();
    if (loaded) {
      setBpm(sequencer.bpm);
      setSwing(sequencer.swing);
      setLcdMessage('PATTERN LOADED');
      setTimeout(() => setLcdMessage(null), 2000);
    }
  }, []);

  // ─── Init Audio ───
  const initAudio = useCallback(async () => {
    if (audioReady) return;
    try {
      await audioEngine.init();
      // #4: Connect sequencer to Web Audio context
      sequencer.setAudioContext(audioEngine.ctx);
      sequencer.setSchedulePad((pad, when, vel) => {
        audioEngine.schedulePad(pad, when, vel);
      });
      setAudioReady(true);
    } catch (e) {
      console.error('Audio init failed:', e);
    }
  }, [audioReady]);

  // ─── Sequencer Callbacks ───
  useEffect(() => {
    sequencer.setOnStep((step) => setCurrentStep(step));
    sequencer.setOnPatternChange((pattern) => {
      setCurrentPattern(pattern);
      const labels = ['A', 'B', 'C', 'D'];
      setLcdMessage(`PATTERN ${labels[pattern]}`);
      setTimeout(() => setLcdMessage(null), 800);
    });
    sequencer.setTriggerPad((padNum, velocity) => {
      audioEngine.triggerPad(padNum, velocity);
      flashPad(padNum);
    });
  }, []);

  // ─── Flash pad ───
  const flashPad = useCallback((padNum) => {
    setActivePad(padNum);
    const padInfo = PAD_INFO.find(p => p.pad === padNum);
    if (padInfo) setCurrentSampleName(audioEngine.customNames.get(padNum) || padInfo.sampleName);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setActivePad(null), 120);
  }, []);

  // ─── Trigger Pad ───
  const triggerPad = useCallback(async (padNumber) => {
    await initAudio();
    audioEngine.triggerPad(padNumber);
    flashPad(padNumber);
    setSelectedPadForSeq(padNumber);

    if (sequencer.recording && sequencer.playing) {
      sequencer.recordPad(padNumber);
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
    audioEngine.stopAll();
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
    if (isPlaying) { sequencer.stop(); setIsPlaying(false); setCurrentStep(-1); }
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

  const handleLegend = useCallback(() => setShowLegend(v => !v), []);

  // ─── Long press ───
  const handleLongPressPad = useCallback((padNumber) => {
    const el = document.getElementById(`key-pad-${padNumber}`);
    const rect = el?.getBoundingClientRect();
    setPopoverPad(padNumber);
    setPopoverPos({ x: rect ? rect.left : 100, y: rect ? rect.bottom + 8 : 200 });
  }, []);

  const handleLongPressFx = useCallback(() => setShowFX(v => !v), []);

  // ─── Keyboard visual sync ───
  const setPressed = useCallback((key) => {
    setPressedKey(key);
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    if (key !== null) {
      pressTimerRef.current = setTimeout(() => setPressedKey(null), 150);
    }
  }, []);

  // ─── Sequencer toggles ───
  const handleToggleStep = useCallback((stepIndex, overridePad) => {
    const pad = overridePad ?? selectedPadForSeq;
    sequencer.toggleStep(pad, stepIndex);
    forceUpdate(v => v + 1);
  }, [selectedPadForSeq]);

  // ─── Pattern controls ───
  const handleSwitchPattern = useCallback((index) => {
    sequencer.switchPattern(index);
    setCurrentPattern(index);
    setLcdMessage(`PATTERN ${['A', 'B', 'C', 'D'][index]}`);
    setTimeout(() => setLcdMessage(null), 600);
    forceUpdate(v => v + 1);
  }, []);

  const handleCopyPattern = useCallback((targetIndex) => {
    sequencer.copyPatternTo(targetIndex);
    setLcdMessage(`COPY → ${['A', 'B', 'C', 'D'][targetIndex]}`);
    setTimeout(() => setLcdMessage(null), 600);
  }, []);

  const handleToggleChain = useCallback(() => {
    const chain = sequencer.toggleChainMode();
    setChainMode(chain);
    setLcdMessage(chain ? 'CHAIN ON' : 'CHAIN OFF');
    setTimeout(() => setLcdMessage(null), 600);
  }, []);

  // #2: Swing
  const handleSwingChange = useCallback((val) => {
    setSwing(val);
    sequencer.setSwing(val);
  }, []);

  // #5: Load preset beat
  const handleLoadPreset = useCallback((index) => {
    const preset = PRESET_BEATS[index];
    if (!preset) return;

    sequencer.clearPattern();
    Object.entries(preset.pattern).forEach(([pad, steps]) => {
      sequencer.activeSteps.set(Number(pad), [...steps]);
    });
    sequencer.setBPM(preset.bpm);
    sequencer.setSwing(preset.swing);
    setBpm(preset.bpm);
    setSwing(preset.swing);
    setLcdMessage(`♫ ${preset.name}`);
    setTimeout(() => setLcdMessage(null), 1200);
    forceUpdate(v => v + 1);
  }, []);

  // #15: Switch sample pack
  const handleSwitchPack = useCallback(async (packName) => {
    await initAudio();
    audioEngine.switchPack(packName);
    setCurrentPack(packName);
    setLcdMessage(`PACK: ${packName}`);
    setTimeout(() => setLcdMessage(null), 800);
  }, [initAudio]);

  // #12: Undo/Redo keyboard shortcuts
  useEffect(() => {
    const handleKeyCombo = (e) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (sequencer.undo()) {
          setLcdMessage('UNDO');
          setTimeout(() => setLcdMessage(null), 600);
          forceUpdate(v => v + 1);
        }
      } else if ((e.ctrlKey && e.key === 'z' && e.shiftKey) || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        if (sequencer.redo()) {
          setLcdMessage('REDO');
          setTimeout(() => setLcdMessage(null), 600);
          forceUpdate(v => v + 1);
        }
      }
      // #18: Toggle LCD scope mode
      else if (e.key === 'F2') {
        e.preventDefault();
        setLcdMode(m => m === 'wave' ? 'scope' : 'wave');
      }
    };
    window.addEventListener('keydown', handleKeyCombo);
    return () => window.removeEventListener('keydown', handleKeyCombo);
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
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  }, []);

  return (
    <>
      <div className="calc-body" onClick={initAudio}
        role="application" aria-label="Soundculator - Music Sampler Calculator">
        {/* Brand Strip */}
        <div className="brand-strip"
          onPointerDown={handleBrandPointerDown}
          onPointerUp={handleBrandPointerUp}
          onPointerLeave={handleBrandPointerUp}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="brand-dot" />
            <span className="brand-name">SOUNDCULATOR</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* #15: Sample pack switcher */}
            <select
              className="pack-select"
              value={currentPack}
              onChange={(e) => {
                e.stopPropagation();
                handleSwitchPack(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Select sample pack"
            >
              {PACK_NAMES.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {/* #6: Dark mode toggle */}
            <button
              className="brand-help"
              onClick={(e) => { e.stopPropagation(); setDarkMode(v => !v); }}
              aria-label="Toggle dark mode"
              title="Night mode"
            >
              {darkMode ? '☀' : '🌙'}
            </button>

            {/* Legend */}
            <button
              className="brand-help"
              onClick={(e) => { e.stopPropagation(); handleLegend(); }}
              aria-label="Open keyboard shortcuts (F1)"
            >
              ?
            </button>
          </div>
        </div>

        {/* LCD Display */}
        <LCDDisplay
          padNumber={activePad}
          sampleName={currentSampleName}
          bpm={bpm}
          currentStep={currentStep}
          sequencerSteps={(i) => sequencer.hasActiveStepsAtIndex(i)}
          isBooting={isBooting}
          lcdMessage={lcdMessage}
          audioEngine={audioReady ? audioEngine : null}
          lcdMode={lcdMode}
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

      {/* Sequencer Panel */}
      <SequencerPanel
        steps={16}
        currentStep={currentStep}
        sequencer={sequencer}
        onToggleStep={handleToggleStep}
        currentPattern={currentPattern}
        onSwitchPattern={handleSwitchPattern}
        onCopyPattern={handleCopyPattern}
        chainMode={chainMode}
        onToggleChain={handleToggleChain}
        selectedPad={selectedPadForSeq}
        onSelectPad={setSelectedPadForSeq}
        swing={swing}
        onSwingChange={handleSwingChange}
        onLoadPreset={handleLoadPreset}
        presetNames={PRESET_BEATS.map(p => p.name)}
        forceRender={forceUpdate}
      />

      {/* FX Panel */}
      <FXPanel audioEngine={audioEngine} isOpen={showFX} onClose={() => setShowFX(false)} />

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
            setSwing(sequencer.swing);
            setCurrentPattern(sequencer.currentPattern);
            forceUpdate(v => v + 1);
          }}
          sequencer={sequencer}
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
