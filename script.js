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

const TOTAL_FRETS = 24;

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

  TUNING.forEach((openNote) => {
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
      row.appendChild(cell);
    }

    fretGrid.appendChild(row);
  });
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
};

init();
