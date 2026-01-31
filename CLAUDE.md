# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a guitar scale visualization tool (吉他音阶可视化工具) - a static web application that displays guitar scales across a 24-fret fretboard. It's a pure frontend application with no build process or dependencies.

## Development Commands

**Local preview:**
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

**Deployment:** This project is deployed via GitHub Pages from the `main` branch root directory.

## Architecture

This is a vanilla JavaScript application with three core files:

- **index.html** - Main HTML structure with controls for Key, Mode (Major/Minor), Scale Type (7-tone/Pentatonic), and Display Mode (Note names/Scale degrees)
- **script.js** - Core application logic
- **styles.css** - Dark-themed UI styling

### Key Technical Details

**Music Theory Constants (script.js:1-13):**
- Standard tuning: `["E", "A", "D", "G", "B", "E"]` (6th to 1st string)
- Chromatic notes: All 12 semitones from C to B
- Scale formulas defined as semitone intervals from root note
  - Major/Minor heptatonic scales (7 notes)
  - Major/Minor pentatonic scales (5 notes)

**Core Functions:**
- `getScale(root, mode, type)` - Generates scale note indices based on root key, mode, and scale type
- `buildFretboard()` - Main rendering function that creates the fretboard grid dynamically
- `getDegree(noteIndex, scaleIndexes)` - Maps note to its scale degree (1-7 or 1-5)

**DOM Structure:**
- Fretboard is rendered as a CSS Grid with 6 rows (strings) × 25 columns (0-24 frets)
- Each cell displays either:
  - Fixed note names (C, D#, etc.)
  - Scale degrees (1-7 or 1-5)
- CSS classes applied based on note state:
  - `.note-cell--in-scale` - Notes in the selected scale
  - `.note-cell--root` - Root note highlighting
  - `.note-cell--muted` - Out-of-scale notes in degree mode

**Responsive Behavior:**
- On screens ≤900px, fretboard displays only frets 0-12 (first octave)
- Defined in styles.css:151-156

## Language Note

The UI contains Chinese text. When modifying user-facing strings, maintain the bilingual approach (English labels in code, Chinese in UI where present).
