"use strict";

var Yellow = Yellow || {};

Yellow.GameOfLife = (function () {
  const CELL_SIZE = 10; // 10x10 pixels
  const COLS = 70;
  const ROWS = 40;
  const TICK_MS = 150;
  const COLORS = Object.freeze({ alive: "#fde047", dead: "#1e293b" });

  function getNextGrid(currentGrid) {
    const rows = currentGrid.length;
    const cols = currentGrid[0].length;
    const nextGrid = currentGrid.map((row) => row.map(() => 0));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let neighbors = 0;

        // checks row & above & below the current row
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
          // checks col & left & right of the current column
          for (let colOffset = -1; colOffset <= 1; colOffset++) {
            if (rowOffset === 0 && colOffset === 0) continue;
            const neighborRow = (row + rowOffset + rows) % rows; // wraps around top/bottom edges
            const neighborCol = (col + colOffset + cols) % cols; // wraps around left/right edges
            neighbors += currentGrid[neighborRow][neighborCol]; // add 1 if alive, 0 if dead.
          }
        }

        if (
          currentGrid[row][col] === 1 &&
          (neighbors === 2 || neighbors === 3)
        ) {
          nextGrid[row][col] = 1; // survives
        } else if (currentGrid[row][col] === 0 && neighbors === 3) {
          nextGrid[row][col] = 1; // becomes alive
        }
        // everything else stays 0 (dies or stays dead), since nextGrid starts empty
      }
    }

    return nextGrid;
  }

  function getRequiredElement(id) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Game of Life: missing element #${id}`);
    return element;
  }

  function onLoad() {
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

    let grid = createGrid();
    let isRunning = false;
    let generation = 0;
    let loopTimeoutId = null;
    let isDrawing = false;
    let paintValue = 1;

    function createGrid() {
      return Array(ROWS)
        .fill(null)
        .map(() => Array(COLS).fill(0));
    }

    function spellYellow() {
      grid = createGrid();
      const startRow = 16;
      let startCol = 8;

      const letterL = [
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
      ];
      const letters = [
        // [rowOffset, colOffset]
        // Y
        [
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
        // E
        [
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
        // L
        letterL,
        // L
        letterL,
        // O
        [
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
        // W
        [
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
      ];

      letters.forEach((letter) => {
        letter.forEach(([rowOffset, colOffset]) => {
          grid[startRow + rowOffset][startCol + colOffset] = 1;
        });
        startCol += 9;
      });
    }

    function draw() {
      let liveCount = 0;

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const alive = grid[row][col] === 1;
          context.fillStyle = alive ? COLORS.alive : COLORS.dead;
          context.fillRect(
            col * CELL_SIZE,
            row * CELL_SIZE,
            CELL_SIZE - 1,
            CELL_SIZE - 1,
          );
          if (alive) liveCount++;
        }
      }

      statsDisplay.textContent = `Generation: ${generation} | Live Cells: ${liveCount}`;
    }

    function runNextGeneration() {
      grid = getNextGrid(grid); // replace
      generation++; // increment counter
    }

    function gameLoop() {
      if (!isRunning) return;
      runNextGeneration();
      draw();
      loopTimeoutId = setTimeout(gameLoop, TICK_MS);
    }

    function getCellFromMouse(pointerEvent) {
      const bounds = canvas.getBoundingClientRect();
      // scale
      const col = Math.floor(
        ((pointerEvent.clientX - bounds.left) / bounds.width) * COLS,
      );
      const row = Math.floor(
        ((pointerEvent.clientY - bounds.top) / bounds.height) * ROWS,
      );
      const onGrid = row >= 0 && row < ROWS && col >= 0 && col < COLS;
      return onGrid ? { row, col } : null;
    }

    function activateCellAtMouse(pointerEvent) {
      const cell = getCellFromMouse(pointerEvent);
      if (!cell) return;
      if (grid[cell.row][cell.col] === paintValue) return; // nothing to change
      grid[cell.row][cell.col] = paintValue;
      draw();
    }

    function setRunning(running) {
      isRunning = running;
      startBtn.textContent = running ? "Pause" : "Start";
      startBtn.dataset.running = running;
      stepBtn.disabled = running; // while paused
      clearTimeout(loopTimeoutId); // rm old loops
      if (running) gameLoop();
    }

    function resetGrid(setup) {
      setRunning(false);
      generation = 0;
      setup();
      draw();
    }

    function onPointerDown(pointerEvent) {
      isDrawing = true;
      canvas.setPointerCapture(pointerEvent.pointerId); // keep receiving moves if the pointer leaves the canvas
      const cell = getCellFromMouse(pointerEvent);
      if (cell) paintValue = grid[cell.row][cell.col] === 1 ? 0 : 1; // alive? erase. dead? draw.
      activateCellAtMouse(pointerEvent);
    }

    function onPointerMove(pointerEvent) {
      if (isDrawing) activateCellAtMouse(pointerEvent);
    }

    function onPointerUp() {
      isDrawing = false;
    }

    function onStartClick() {
      setRunning(!isRunning);
    }

    function onStepClick() {
      if (isRunning) return;
      runNextGeneration();
      draw();
    }

    function onResetClick() {
      resetGrid(spellYellow);
    }

    function onClearClick() {
      resetGrid(() => (grid = createGrid()));
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    startBtn.addEventListener("click", onStartClick);
    stepBtn.addEventListener("click", onStepClick);
    resetBtn.addEventListener("click", onResetClick);
    clearBtn.addEventListener("click", onClearClick);

    spellYellow();
    draw();
  }

  return { onLoad };
})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", Yellow.GameOfLife.onLoad);
} else {
  Yellow.GameOfLife.onLoad();
}
