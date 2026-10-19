const CELL_SIZE = 10; // 10x10 pixels
const COLS = 70;
const ROWS = 40;
const SIZE = COLS * ROWS;
const TICK_MS = 150;
const ALIVE_COLOR = "#fde047";
const DEAD_COLOR = "#1e293b";
const WORD = "YELLOW";
const WORD_START_ROW = 16;
const WORD_START_COL = 8;
const LETTER_SPACING = 9;

const LETTERS = {
  Y: [
    [0, 0],
    [0, 6],
    [1, 1],
    [1, 5],
    [2, 2],
    [2, 4],
    [3, 3],
    [4, 3],
    [5, 3],
  ],
  E: [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [1, 0],
    [2, 0],
    [2, 1],
    [2, 2],
    [2, 3],
    [3, 0],
    [4, 0],
    [5, 0],
    [5, 1],
    [5, 2],
    [5, 3],
    [5, 4],
  ],
  L: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
    [5, 1],
    [5, 2],
    [5, 3],
    [5, 4],
  ],
  O: [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 0],
    [1, 4],
    [2, 0],
    [2, 4],
    [3, 0],
    [3, 4],
    [4, 0],
    [4, 4],
    [5, 1],
    [5, 2],
    [5, 3],
  ],
  W: [
    [0, 0],
    [0, 6],
    [1, 0],
    [1, 6],
    [2, 0],
    [2, 3],
    [2, 6],
    [3, 0],
    [3, 2],
    [3, 4],
    [3, 6],
    [4, 0],
    [4, 2],
    [4, 4],
    [4, 6],
    [5, 1],
    [5, 5],
  ],
};

const indexOf = (row, col) => row * COLS + col;

export function computeNextGeneration(current, target) {
  let liveCount = 0;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      let neighbors = 0;

      for (let rowShift = -1; rowShift <= 1; rowShift++) {
        for (let colShift = -1; colShift <= 1; colShift++) {
          if (rowShift === 0 && colShift === 0) continue; // skip the cell itself

          const neighborRow = (row + rowShift + ROWS) % ROWS; // wraps around edges
          const neighborCol = (col + colShift + COLS) % COLS;
          neighbors += current[indexOf(neighborRow, neighborCol)];
        }
      }

      const cell = indexOf(row, col);
      const alive =
        neighbors === 3 || (neighbors === 2 && current[cell] === 1) ? 1 : 0;
      target[cell] = alive;
      liveCount += alive;
    }
  }

  return liveCount;
}

export function writeWord(grid, word) {
  grid.fill(0);
  let startCol = WORD_START_COL;

  for (const letter of word) {
    for (const [rowOffset, colOffset] of LETTERS[letter]) {
      grid[indexOf(WORD_START_ROW + rowOffset, startCol + colOffset)] = 1;
    }
    startCol += LETTER_SPACING;
  }
}

export function countLiveCells(grid) {
  let count = 0;
  for (let cell = 0; cell < SIZE; cell++) count += grid[cell];
  return count;
}

function getRequiredElement(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Game of Life: missing element #${id}`);
  return element;
}

export function init() {
  const canvas = getRequiredElement("lifeCanvas");
  const startBtn = getRequiredElement("startButton");
  const stepBtn = getRequiredElement("stepButton");
  const resetBtn = getRequiredElement("resetButton");
  const clearBtn = getRequiredElement("clearButton");
  const statsDisplay = getRequiredElement("stats");

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Game of Life: canvas is not supported");

  canvas.width = COLS * CELL_SIZE;
  canvas.height = ROWS * CELL_SIZE;

  let grid = new Uint8Array(SIZE);
  let back = new Uint8Array(SIZE);
  let liveCount = 0;
  let isRunning = false;
  let generation = 0;
  let loopTimeoutId = null;
  let isDrawing = false;
  let paintValue = 1;

  const updateStats = () => {
    statsDisplay.textContent = `Generation: ${generation} | Live Cells: ${liveCount}`;
  };

  const fillCell = (cell) => {
    context.fillRect(
      (cell % COLS) * CELL_SIZE,
      Math.trunc(cell / COLS) * CELL_SIZE,
      CELL_SIZE - 1,
      CELL_SIZE - 1,
    );
  };

  const drawCell = (cell) => {
    context.fillStyle = grid[cell] === 1 ? ALIVE_COLOR : DEAD_COLOR;
    fillCell(cell);
  };

  const drawAll = () => {
    for (const value of [0, 1]) {
      context.fillStyle = value === 1 ? ALIVE_COLOR : DEAD_COLOR;
      for (let cell = 0; cell < SIZE; cell++) {
        if (grid[cell] === value) fillCell(cell);
      }
    }
    updateStats();
  };

  const drawChanged = () => {
    for (let cell = 0; cell < SIZE; cell++) {
      if (grid[cell] !== back[cell]) drawCell(cell);
    }
    updateStats();
  };

  const step = () => {
    liveCount = computeNextGeneration(grid, back);
    [grid, back] = [back, grid]; // swap buffers
    generation++;
    drawChanged();
  };

  const gameLoop = () => {
    if (!isRunning) return;
    step();
    loopTimeoutId = setTimeout(gameLoop, TICK_MS);
  };

  const setRunning = (running) => {
    isRunning = running;
    startBtn.textContent = running ? "Pause" : "Start";
    startBtn.dataset.running = running;
    stepBtn.disabled = running;
    clearTimeout(loopTimeoutId); // remove any pending loop
    if (running) gameLoop();
  };

  const resetGrid = (setup) => {
    setRunning(false);
    generation = 0;
    setup(grid);
    liveCount = countLiveCells(grid);
    drawAll();
  };

  const getIndexFromPointer = (pointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    const col = Math.floor(
      ((pointerEvent.clientX - bounds.left) / bounds.width) * COLS,
    );
    const row = Math.floor(
      ((pointerEvent.clientY - bounds.top) / bounds.height) * ROWS,
    );
    const onGrid = row >= 0 && row < ROWS && col >= 0 && col < COLS;
    return onGrid ? indexOf(row, col) : -1;
  };

  const paintAtPointer = (pointerEvent) => {
    const cell = getIndexFromPointer(pointerEvent);
    if (cell === -1 || grid[cell] === paintValue) return; // off grid
    grid[cell] = paintValue;
    liveCount += paintValue === 1 ? 1 : -1;
    drawCell(cell); // only cell not grid
    updateStats();
  };

  const onPointerDown = (pointerEvent) => {
    isDrawing = true;
    canvas.setPointerCapture(pointerEvent.pointerId); // keep receiving moves outside the canvas
    const cell = getIndexFromPointer(pointerEvent);
    if (cell !== -1) paintValue = grid[cell] === 1 ? 0 : 1; // alive? erase. dead? draw.
    paintAtPointer(pointerEvent);
  };

  const onPointerMove = (pointerEvent) => {
    if (isDrawing) paintAtPointer(pointerEvent);
  };

  const onPointerUp = () => {
    isDrawing = false;
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  startBtn.addEventListener("click", () => setRunning(!isRunning));
  stepBtn.addEventListener("click", () => {
    if (!isRunning) step();
  });
  resetBtn.addEventListener("click", () =>
    resetGrid((g) => writeWord(g, WORD)),
  );
  clearBtn.addEventListener("click", () => resetGrid((g) => g.fill(0)));

  resetGrid((g) => writeWord(g, WORD));
}

if (typeof document !== "undefined") {
  init();
}
