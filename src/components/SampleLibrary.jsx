import { useState, useRef, useCallback } from 'react';
import { PAD_INFO } from '../lib/padMap';
import { exportPatternJSON, copyToClipboard, downloadJSON, generateShareLink, importPatternJSON } from '../lib/exportPattern';

export default function SampleLibrary({
    onClose,
    onLoadSample,
    audioEngine,
    onImportPattern,
}) {
    const [dragOver, setDragOver] = useState(false);
    const [assignTarget, setAssignTarget] = useState(null);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);
    const jsonInputRef = useRef(null);

    const customSlots = [14, 15, 16, 17];

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 2000);
    };

    const getNextFreeSlot = () => {
        for (const slot of customSlots) {
            if (!audioEngine.hasSample(slot)) return slot;
        }
        return customSlots[0]; // Overwrite first if all full
    };

    const handleFile = useCallback(async (file, targetPad) => {
        if (!file) return;
        const validTypes = ['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/aiff', 'audio/mp3', 'audio/x-wav', 'audio/x-aiff'];
        const ext = file.name.split('.').pop().toLowerCase();
        const validExts = ['wav', 'mp3', 'ogg', 'aiff'];

        if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
            showMessage('Invalid file type');
            return;
        }

        const pad = targetPad ?? getNextFreeSlot();
        const arrayBuffer = await file.arrayBuffer();
        await audioEngine.loadCustomSample(pad, arrayBuffer, file.name.split('.')[0].toUpperCase().slice(0, 8));

        // Save to sessionStorage
        try {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result;
                sessionStorage.setItem(`soundculator-sample-${pad}`, JSON.stringify({
                    name: file.name,
                    data: base64,
                }));
            };
            reader.readAsDataURL(file);
        } catch (e) { /* ignore */ }

        showMessage(`Loaded → PAD ${pad}`);
        onLoadSample?.(pad);
    }, [audioEngine, onLoadSample]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFile(file, assignTarget);
        setAssignTarget(null);
    }, [handleFile, assignTarget]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => setDragOver(false);

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        handleFile(file, assignTarget);
        setAssignTarget(null);
        e.target.value = '';
    };

    const handleJsonImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const success = importPatternJSON(reader.result);
            showMessage(success ? 'PATTERN LOADED' : 'IMPORT FAILED');
            if (success) onImportPattern?.();
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <>
            <div className="drawer-backdrop" onClick={onClose} />
            <div className="sample-drawer" role="dialog" aria-label="Sample Library">
                <div className="drawer-header">♫ SAMPLE LIBRARY</div>

                {message && (
                    <div style={{
                        textAlign: 'center',
                        fontFamily: "'VT323', monospace",
                        fontSize: '14px',
                        color: 'var(--key-clear)',
                        marginBottom: '8px',
                    }}>
                        {message}
                    </div>
                )}

                {/* Sample list */}
                {PAD_INFO.map((pad) => (
                    <div key={pad.pad} className="sample-row">
                        <span className="sample-badge">{pad.pad}</span>
                        <span className="sample-name">
                            {audioEngine.customNames.get(pad.pad) || pad.sampleName}
                        </span>
                        <button
                            className="sample-btn"
                            onClick={() => audioEngine.triggerPad(pad.pad)}
                            aria-label={`Preview ${pad.sampleName}`}
                        >
                            ▶
                        </button>
                        {pad.pad >= 14 && pad.pad <= 17 && (
                            <button
                                className="sample-btn"
                                onClick={() => {
                                    setAssignTarget(pad.pad);
                                    fileInputRef.current?.click();
                                }}
                                aria-label={`Assign custom sample to pad ${pad.pad}`}
                            >
                                LOAD
                            </button>
                        )}
                    </div>
                ))}

                {/* Drop zone */}
                <div
                    className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => {
                        setAssignTarget(null);
                        fileInputRef.current?.click();
                    }}
                    role="button"
                    aria-label="Drop audio file here or click to browse"
                >
                    📂 DROP FILE HERE<br />
                    <span style={{ fontSize: '12px', opacity: 0.7 }}>.wav .mp3 .ogg .aiff</span>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".wav,.mp3,.ogg,.aiff"
                    style={{ display: 'none' }}
                    onChange={handleFileInput}
                />

                {/* Export/Import section */}
                <div className="export-section">
                    <button className="export-btn" onClick={() => {
                        copyToClipboard(exportPatternJSON());
                        showMessage('COPIED TO CLIPBOARD');
                    }}>
                        COPY JSON
                    </button>
                    <button className="export-btn" onClick={() => {
                        downloadJSON();
                        showMessage('DOWNLOADED');
                    }}>
                        DOWNLOAD
                    </button>
                    <button className="export-btn" onClick={() => jsonInputRef.current?.click()}>
                        LOAD JSON
                    </button>
                    <button className="export-btn" onClick={() => {
                        const link = generateShareLink();
                        copyToClipboard(link);
                        showMessage('SHARE LINK COPIED');
                    }}>
                        SHARE LINK
                    </button>
                </div>

                <input
                    ref={jsonInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleJsonImport}
                />

                <div style={{
                    textAlign: 'center',
                    marginTop: '10px',
                    fontFamily: "'VT323', monospace",
                    fontSize: '11px',
                    color: 'var(--shadow)',
                    opacity: 0.7,
                }}>
                    ⚠ Custom samples are session-only
                </div>
            </div>
        </>
    );
}
