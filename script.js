const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
// Standard tuning: 1st string (high E) to 6th string (low E), displayed top to bottom
const TUNING = ["E", "B", "G", "D", "A", "E"];

const SCALE_FORMULAS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

// Scale degrees
const SCALE_DEGREES = {
  major: ["1", "2", "3", "4", "5", "6", "7"],
  minor: ["1", "2", "♭3", "4", "5", "♭6", "♭7"],
};

const PENTATONIC_FORMULAS = {
  major: [0, 2, 4, 7, 9],
  minor: [0, 3, 5, 7, 10],
};

// Pentatonic scale degrees
const PENTATONIC_DEGREES = {
  major: ["1", "2", "3", "5", "6"],
  minor: ["1", "♭3", "4", "5", "♭7"],
};

// Chord formulas
const CHORD_FORMULAS = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  aug: [0, 4, 8],
  dim: [0, 3, 6],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  "9": [0, 4, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  m9: [0, 3, 7, 10, 14],
  "6": [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
};

const CHORD_DEGREES = {
  maj: ["1", "3", "5"],
  min: ["1", "♭3", "5"],
  aug: ["1", "3", "♯5"],
  dim: ["1", "♭3", "♭5"],
  "7": ["1", "3", "5", "♭7"],
  maj7: ["1", "3", "5", "7"],
  m7: ["1", "♭3", "5", "♭7"],
  m7b5: ["1", "♭3", "♭5", "♭7"],
  dim7: ["1", "♭3", "♭5", "♭♭7"],
  "9": ["1", "3", "5", "♭7", "9"],
  maj9: ["1", "3", "5", "7", "9"],
  m9: ["1", "♭3", "5", "♭7", "9"],
  "6": ["1", "3", "5", "6"],
  m6: ["1", "♭3", "5", "6"],
};

const keySelect = document.getElementById("keySelect");
const modeSelect = document.getElementById("modeSelect");
const scaleSelect = document.getElementById("scaleSelect");
const displaySelect = document.getElementById("displaySelect");
const viewMode = document.getElementById("viewMode");
const fretGrid = document.getElementById("fretGrid");
const fretLegend = document.getElementById("fretLegend");
const chordRoot = document.getElementById("chordRoot");
const chordType = document.getElementById("chordType");
const scaleControls = document.getElementById("scaleControls");
const arpeggioControls = document.getElementById("arpeggioControls");

// Ear training elements
const earTrainingMode = document.getElementById("earTrainingMode");
const earTrainingControls = document.getElementById("earTrainingControls");
const exerciseType = document.getElementById("exerciseType");
const playExercise = document.getElementById("playExercise");
const feedback = document.getElementById("feedback");
const stats = document.getElementById("stats");

const TOTAL_FRETS = 24;

// Audio context for playing notes
let audioContext = null;
let earTrainingActive = false;
let currentExercise = null;
let score = { correct: 0, incorrect: 0 };

// Note frequencies (A4 = 440Hz)
const NOTE_FREQUENCIES = {
  C: 261.63,
  "C#": 277.18,
  D: 293.66,
  "D#": 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  G: 392.00,
  "G#": 415.30,
  A: 440.00,
  "A#": 466.16,
  B: 493.88,
};

const createOption = (value) => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = value;
  return option;
};

const buildLegend = () => {
  fretLegend.innerHTML = "";
  const spacer = document.createElement("span");
  fretLegend.appendChild(spacer);

  const markerFrets = [0, 7, 12, 19];

  for (let fret = 0; fret <= TOTAL_FRETS; fret += 1) {
    const cell = document.createElement("span");
    cell.textContent = fret === 0 ? "Open" : fret;

    // Add marker dot for specific frets
    if (markerFrets.includes(fret)) {
      cell.classList.add("fret-legend--marker");
    }

    fretLegend.appendChild(cell);
  }
};

const getScale = (root, mode, type) => {
  const base = type === "pentatonic" ? PENTATONIC_FORMULAS[mode] : SCALE_FORMULAS[mode];
  const rootIndex = NOTES.indexOf(root);
  return base.map((interval) => (rootIndex + interval) % NOTES.length);
};

const getDegree = (noteIndex, scaleIndexes) => {
  const position = scaleIndexes.indexOf(noteIndex);
  return position === -1 ? null : position + 1;
};

const getChord = (root, type) => {
  if (!root || !CHORD_FORMULAS[type]) return [];
  const formula = CHORD_FORMULAS[type];
  const rootIndex = NOTES.indexOf(root);
  return formula.map((interval) => (rootIndex + interval) % NOTES.length);
};

const getChordDegree = (noteIndex, chordIndexes, chordType) => {
  const position = chordIndexes.indexOf(noteIndex);
  if (position === -1) return null;
  return CHORD_DEGREES[chordType][position];
};

const buildFretboard = () => {
  const displayMode = displaySelect.value;
  const currentViewMode = viewMode.value;

  let notesToShow = [];
  let rootIndex = null;
  let scaleMode = null;
  let scaleType = null;
  let referenceScale = null; // For degree calculation

  if (currentViewMode === "scale") {
    // Scale mode
    const root = keySelect.value;
    scaleMode = modeSelect.value;
    scaleType = scaleSelect.value;
    notesToShow = getScale(root, scaleMode, scaleType);
    rootIndex = NOTES.indexOf(root);
    referenceScale = notesToShow;
  } else {
    // Arpeggio mode - use Key's scale for degree reference
    const root = keySelect.value;
    scaleMode = modeSelect.value;
    scaleType = scaleSelect.value;
    const chordRootNote = chordRoot.value;
    const currentChordType = chordType.value;
    notesToShow = getChord(chordRootNote, currentChordType);
    rootIndex = NOTES.indexOf(chordRootNote);
    // Use the key's scale as reference for degrees
    referenceScale = getScale(root, scaleMode, scaleType);
  }

  fretGrid.innerHTML = "";

  TUNING.forEach((openNote, stringIndex) => {
    const row = document.createElement("div");
    row.className = "string-row";

    const label = document.createElement("span");
    label.className = "string-label";
    label.textContent = openNote;
    row.appendChild(label);

    for (let fret = 0; fret <= TOTAL_FRETS; fret += 1) {
      const noteIndex = (NOTES.indexOf(openNote) + fret) % NOTES.length;
      const isInGroup = notesToShow.includes(noteIndex);
      const isRoot = noteIndex === rootIndex;

      const cell = document.createElement("div");
      cell.className = "note-cell";
      cell.dataset.note = NOTES[noteIndex];
      cell.dataset.noteIndex = noteIndex;
      cell.dataset.string = stringIndex;
      cell.dataset.fret = fret;

      if (fret === 0) {
        cell.classList.add("note-cell--open");
      }

      // Simplified styling: only highlight if in group
      if (isInGroup) {
        cell.classList.add("note-cell--in-scale");
      }

      // Only root gets special color
      if (isRoot && isInGroup) {
        cell.classList.add("note-cell--root");
      }

      // Display text
      if (displayMode === "degree" && isInGroup) {
        // Always use reference scale for degree calculation
        const position = referenceScale.indexOf(noteIndex);
        if (position !== -1) {
          if (scaleType === "pentatonic") {
            cell.textContent = PENTATONIC_DEGREES[scaleMode][position];
          } else {
            cell.textContent = SCALE_DEGREES[scaleMode][position];
          }
        } else {
          cell.textContent = NOTES[noteIndex];
        }
      } else {
        cell.textContent = NOTES[noteIndex];
      }

      if (displayMode === "degree" && !isInGroup) {
        cell.classList.add("note-cell--muted");
      }

      // Add click handler
      if (earTrainingActive) {
        cell.classList.add("clickable");
        cell.addEventListener("click", handleNoteClick);
      } else {
        // Allow clicking to play notes in normal mode
        cell.classList.add("clickable");
        cell.addEventListener("click", handleNotePlayClick);
      }

      row.appendChild(cell);
    }

    fretGrid.appendChild(row);
  });
};

// Audio functions
const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
};

const playNote = (noteName, duration = 0.5) => {
  initAudio();
  const frequency = NOTE_FREQUENCIES[noteName];
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

const playNoteSequence = async (notes, interval = 500) => {
  for (const note of notes) {
    playNote(note);
    await new Promise(resolve => setTimeout(resolve, interval));
  }
};

// Calculate frequency for a note at specific string and fret
const getNoteFrequency = (stringIndex, fret) => {
  const openNote = TUNING[stringIndex];
  const openNoteIndex = NOTES.indexOf(openNote);
  const totalSemitones = openNoteIndex + fret;
  const noteIndex = totalSemitones % 12;
  const noteName = NOTES[noteIndex];
  const baseFreq = NOTE_FREQUENCIES[noteName];

  // String base octaves relative to NOTE_FREQUENCIES (which is octave 4)
  // 1st string (E4) = 0, 2nd (B3) = -1, 3rd (G3) = -1, 4th (D3) = -1, 5th (A2) = -2, 6th (E2) = -2
  const stringOctaveOffset = [0, -1, -1, -1, -2, -2][stringIndex];

  // Calculate how many octaves we've crossed from the open string
  const octavesCrossed = Math.floor(totalSemitones / 12);

  const totalOctaveOffset = stringOctaveOffset + octavesCrossed;
  return baseFreq * Math.pow(2, totalOctaveOffset);
};

// Click handler for playing notes (non-ear-training mode)
const handleNotePlayClick = (e) => {
  const cell = e.currentTarget;
  const stringIndex = parseInt(cell.dataset.string);
  const fret = parseInt(cell.dataset.fret);
  const frequency = getNoteFrequency(stringIndex, fret);

  // Play note with correct frequency
  initAudio();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = "sine";

  const duration = 0.5;
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);

  // Visual feedback
  cell.classList.add("note-cell--playing");
  setTimeout(() => cell.classList.remove("note-cell--playing"), 200);
};

// Exercise functions
const generateFindNoteExercise = () => {
  const root = keySelect.value;
  const mode = modeSelect.value;
  const scaleType = scaleSelect.value;
  const scaleIndexes = getScale(root, mode, scaleType);
  const randomIndex = Math.floor(Math.random() * scaleIndexes.length);
  const targetNoteIndex = scaleIndexes[randomIndex];
  const targetNote = NOTES[targetNoteIndex];

  return {
    type: "findNote",
    targetNote,
    targetNoteIndex,
    validate: (clickedNoteIndex) => parseInt(clickedNoteIndex) === targetNoteIndex,
  };
};

const generateFindDegreeExercise = () => {
  const root = keySelect.value;
  const mode = modeSelect.value;
  const scaleType = scaleSelect.value;
  const scaleIndexes = getScale(root, mode, scaleType);
  const randomIndex = Math.floor(Math.random() * scaleIndexes.length);
  const targetNoteIndex = scaleIndexes[randomIndex];
  const targetNote = NOTES[targetNoteIndex];
  const targetDegree = randomIndex + 1;

  return {
    type: "findDegree",
    targetNote,
    targetNoteIndex,
    targetDegree,
    validate: (clickedNoteIndex) => parseInt(clickedNoteIndex) === targetNoteIndex,
  };
};

const generateEchoMotifExercise = () => {
  const root = keySelect.value;
  const mode = modeSelect.value;
  const scaleType = scaleSelect.value;
  const scaleIndexes = getScale(root, mode, scaleType);
  const motifLength = Math.floor(Math.random() * 2) + 3; // 3-4 notes
  const motif = [];

  for (let i = 0; i < motifLength; i++) {
    const randomIndex = Math.floor(Math.random() * scaleIndexes.length);
    motif.push(scaleIndexes[randomIndex]);
  }

  return {
    type: "echoMotif",
    motif,
    userMotif: [],
    validate: function () {
      if (this.userMotif.length !== this.motif.length) return false;
      return this.userMotif.every((note, i) => note === this.motif[i]);
    },
  };
};

// Exercise handlers
const startExercise = async () => {
  const type = exerciseType.value;
  feedback.textContent = "";
  feedback.className = "ear-training__feedback";

  if (type === "findNote") {
    currentExercise = generateFindNoteExercise();
    playNote(currentExercise.targetNote);
    feedback.textContent = "听音并在指板上找到该音符";
  } else if (type === "findDegree") {
    currentExercise = generateFindDegreeExercise();
    playNote(currentExercise.targetNote);
    feedback.textContent = `听音并找到级数 ${currentExercise.targetDegree}`;
  } else if (type === "echoMotif") {
    currentExercise = generateEchoMotifExercise();
    const motifNotes = currentExercise.motif.map((idx) => NOTES[idx]);
    await playNoteSequence(motifNotes);
    feedback.textContent = `重复刚才的 ${currentExercise.motif.length} 个音符`;
  }
};

const handleNoteClick = (e) => {
  if (!currentExercise) return;

  const cell = e.currentTarget;
  const clickedNoteIndex = parseInt(cell.dataset.noteIndex);

  // Clear previous selections
  document.querySelectorAll(".note-cell.selected").forEach((c) => {
    c.classList.remove("selected");
  });

  cell.classList.add("selected");
  playNote(cell.dataset.note, 0.3);

  if (currentExercise.type === "echoMotif") {
    currentExercise.userMotif.push(clickedNoteIndex);
    feedback.textContent = `已选择 ${currentExercise.userMotif.length}/${currentExercise.motif.length} 个音符`;

    if (currentExercise.userMotif.length === currentExercise.motif.length) {
      setTimeout(() => checkAnswer(), 300);
    }
  } else {
    setTimeout(() => checkAnswer(clickedNoteIndex), 300);
  }
};

const checkAnswer = (clickedNoteIndex) => {
  let isCorrect = false;

  if (currentExercise.type === "echoMotif") {
    isCorrect = currentExercise.validate();
  } else {
    isCorrect = currentExercise.validate(clickedNoteIndex);
  }

  if (isCorrect) {
    score.correct++;
    feedback.textContent = "✓ 正确！";
    feedback.className = "ear-training__feedback correct";
  } else {
    score.incorrect++;
    if (currentExercise.type === "echoMotif") {
      const correctNotes = currentExercise.motif.map((idx) => NOTES[idx]).join(" → ");
      feedback.textContent = `✗ 错误。正确答案: ${correctNotes}`;
    } else {
      feedback.textContent = `✗ 错误。正确答案: ${currentExercise.targetNote}`;
    }
    feedback.className = "ear-training__feedback incorrect";
  }

  updateStats();
  currentExercise = null;
};

const updateStats = () => {
  stats.textContent = `正确: ${score.correct} | 错误: ${score.incorrect}`;
};

const toggleEarTraining = () => {
  earTrainingActive = earTrainingMode.checked;
  earTrainingControls.style.display = earTrainingActive ? "grid" : "none";
  currentExercise = null;
  feedback.textContent = "";
  feedback.className = "ear-training__feedback";
  buildFretboard();
};

const toggleViewMode = () => {
  const isArpeggio = viewMode.value === "arpeggio";

  // Toggle between scale and arpeggio control rows
  if (scaleControls) {
    scaleControls.style.display = isArpeggio ? "none" : "grid";
  }
  if (arpeggioControls) {
    arpeggioControls.style.display = isArpeggio ? "grid" : "none";
  }

  buildFretboard();
};

const init = () => {
  if (keySelect.options.length === 0) {
    KEYS.forEach((key) => keySelect.appendChild(createOption(key)));
  }
  keySelect.value = "C";
  if (chordRoot) chordRoot.value = "C";
  buildLegend();
  toggleViewMode(); // Initialize view mode
  buildFretboard();

  [keySelect, modeSelect, scaleSelect, displaySelect].forEach((control) => {
    control.addEventListener("change", buildFretboard);
  });

  // View mode and chord event listeners
  if (viewMode) {
    viewMode.addEventListener("change", toggleViewMode);
  }
  if (chordRoot) {
    chordRoot.addEventListener("change", buildFretboard);
  }
  if (chordType) {
    chordType.addEventListener("change", buildFretboard);
  }

  // Ear training event listeners
  earTrainingMode.addEventListener("change", toggleEarTraining);
  playExercise.addEventListener("click", startExercise);
};

init();
