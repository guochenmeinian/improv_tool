const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const TUNING = ["E", "A", "D", "G", "B", "E"];

const SCALE_FORMULAS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const PENTATONIC_FORMULAS = {
  major: [0, 2, 4, 7, 9],
  minor: [0, 3, 5, 7, 10],
};

const keySelect = document.getElementById("keySelect");
const modeSelect = document.getElementById("modeSelect");
const scaleSelect = document.getElementById("scaleSelect");
const displaySelect = document.getElementById("displaySelect");
const fretGrid = document.getElementById("fretGrid");
const fretLegend = document.getElementById("fretLegend");

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
  for (let fret = 0; fret <= TOTAL_FRETS; fret += 1) {
    const cell = document.createElement("span");
    cell.textContent = fret === 0 ? "Open" : fret;
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

const buildFretboard = () => {
  const root = keySelect.value;
  const mode = modeSelect.value;
  const scaleType = scaleSelect.value;
  const displayMode = displaySelect.value;
  const scaleIndexes = getScale(root, mode, scaleType);
  const rootIndex = NOTES.indexOf(root);

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
      const isInScale = scaleIndexes.includes(noteIndex);
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

      if (isInScale) {
        cell.classList.add("note-cell--in-scale");
      }

      if (isRoot) {
        cell.classList.add("note-cell--root");
      }

      const degree = getDegree(noteIndex, scaleIndexes);
      if (displayMode === "degree" && isInScale) {
        cell.textContent = degree;
      } else {
        cell.textContent = NOTES[noteIndex];
      }

      if (displayMode === "degree" && !isInScale) {
        cell.classList.add("note-cell--muted");
      }

      // Add ear training click handler
      if (earTrainingActive) {
        cell.classList.add("clickable");
        cell.addEventListener("click", handleNoteClick);
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

const init = () => {
  if (keySelect.options.length === 0) {
    KEYS.forEach((key) => keySelect.appendChild(createOption(key)));
  }
  keySelect.value = "C";
  buildLegend();
  buildFretboard();

  [keySelect, modeSelect, scaleSelect, displaySelect].forEach((control) => {
    control.addEventListener("change", buildFretboard);
  });

  // Ear training event listeners
  earTrainingMode.addEventListener("change", toggleEarTraining);
  playExercise.addEventListener("click", startExercise);
};

init();
