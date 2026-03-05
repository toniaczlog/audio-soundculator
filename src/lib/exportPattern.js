/**
 * Export / Import pattern data as JSON.
 * Also supports share link via base64 URL param.
 */

import sequencer from './sequencer';

export function exportPatternJSON() {
    return JSON.stringify(sequencer.toJSON(), null, 2);
}

export function importPatternJSON(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        sequencer.fromJSON(data);
        return true;
    } catch (e) {
        console.error('Failed to import pattern:', e);
        return false;
    }
}

export function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
}

export function downloadJSON(filename) {
    const json = exportPatternJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `Soundculator-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function generateShareLink() {
    const json = exportPatternJSON();
    const encoded = btoa(unescape(encodeURIComponent(json)));
    const url = new URL(window.location.href);
    url.searchParams.set('p', encoded);
    return url.toString();
}

export function loadFromShareLink() {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('p');
    if (!encoded) return false;

    try {
        const json = decodeURIComponent(escape(atob(encoded)));
        return importPatternJSON(json);
    } catch (e) {
        console.error('Failed to load share link:', e);
        return false;
    }
}
