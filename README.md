# 🎹 Soundculator

**A vintage 1970s pocket calculator that's secretly a fully functional music sampler and drum machine.**

Soundculator looks like a chunky, cream-colored Casio-style calculator, but every button triggers a drum or synth sample. Built with React + Vite and the Web Audio API — no backend required.

---

## ✨ Features

- **19 Sample Pads** — mapped to calculator keys (0–9, operators, memory keys)
- **14 Built-in Sounds** — synthesized drums and synths (kick, snare, hats, clap, toms, rimshot, bass synth, lead, chord stab, bell, vinyl crackle, sub boom, FX glitch)
- **16-Step Sequencer** — with record mode, pattern memory (A/B/C/D), and chain mode
- **Tap Tempo** — tap the `=` key to set BPM
- **Per-Pad Volume & Pitch** — long-press any key for sliders
- **Master FX** — reverb, delay, compressor (long-press `±` to open)
- **Custom Sample Upload** — drag & drop .wav/.mp3/.ogg/.aiff files
- **Export / Import Patterns** — JSON download, clipboard copy, share links
- **Keyboard Mapping** — full physical keyboard support (press `F1` for legend)
- **PWA** — installable, works offline
- **Vintage LCD Display** — with scanlines, ghost segments, and waveform animation

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `0`–`9` | Trigger PADs 0–9 (drums + synths) |
| `/` | PAD 10 — Chord Stab |
| `*` | PAD 11 — Bell |
| `-` | PAD 12 — Vinyl Crackle |
| `+` | PAD 13 — Sub Boom |
| `m` | PAD 14 — Custom Slot A |
| `r` | PAD 15 — Custom Slot B |
| `p` | PAD 16 — Custom Slot C |
| `n` | PAD 17 — Custom Slot D |
| `.` | PAD 18 — FX / Glitch |
| `Enter` | ▶ Play sequencer |
| `Escape` | ■ Stop sequencer |
| `Tab` | ● Toggle record mode |
| `c` | Clear / panic stop |
| `t` | Tap tempo |
| `F1` | Keyboard legend modal |

---

## 🎵 How to Load Custom Samples

1. **Long-press** the brand label at the top ("SOUNDCULATOR") to open the Sample Library
2. **Drag & drop** an audio file onto the drop zone — it auto-assigns to the next free custom slot (PADs 14–17)
3. Or click **LOAD** next to a specific custom slot to assign a file
4. Supported formats: `.wav`, `.mp3`, `.ogg`, `.aiff`
5. ⚠️ Custom samples are stored in session only — they won't persist after closing the tab

---

## 📤 Export / Import Patterns

Open the Sample Library (long-press brand label) to access export controls:

- **COPY JSON** — copies the pattern to clipboard
- **DOWNLOAD** — saves as `Soundculator-YYYY-MM-DD.json`
- **LOAD JSON** — import a previously saved pattern file
- **SHARE LINK** — generates a URL with the pattern encoded (copy to clipboard)

When someone opens a share link, the pattern loads automatically.

---

## 🚀 Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for production

```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack

- **React 18** + **Vite**
- **Web Audio API** — all sounds synthesized client-side
- **No backend** — 100% client-side
- **PWA ready** — manifest + service worker

---

*Made with ♫ — a calculator that grooves.*
