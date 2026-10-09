function initGameOfLife() {
  document.title = " Yellow Simulation Conway's Game of Life";

  const viewport = document.createElement("meta");
  viewport.name = "viewport";
  viewport.content = "width=device-width, initial-scale=1.0";
  document.head.appendChild(viewport);

  const style = document.createElement("style");
  style.textContent = `
    body {
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    h1 {
      margin-bottom: 25px;
      color: #fde047;
    }
    .controls {
      margin-bottom: 15px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }
    button {
      background-color: #1e293b;
      color: #f8fafc;
      border: 1px solid #475569;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }
    button:hover {
      background-color: #334155;
      border-color: #64748b;
    }
    button#startButton {
      background-color: #eab308;
      border-color: #0f172a;
      color: #0f172a;
    }
    button#startButton:hover {
      background-color: #ca8a04;
    }
    canvas {
      border: 2px solid #334155;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      cursor: crosshair;
    }
    .stats {
      margin-top: 6px;
      font-size: 14px;
      color: #94a3b8;
    }
    .rules {
      max-width: 700px;
      margin-top: 30px;
      padding: 20px 24px;
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      line-height: 1.6;
    }
    .rules h3 {
      margin-top: 0;
      color: #fde047;
    }
    .rules li {
      margin-bottom: 8px;
    }
    .rules strong {
      color: #fde047;
    }
  `;
  document.head.appendChild(style);

  document.body.innerHTML = `
    <h1>Conway's Game of Life</h1>
    <div class="controls">
      <button id="startButton">Start</button>
      <button id="resetButton">Reset to 'YELLOW'</button>
    </div>

    <canvas id="lifeCanvas"></canvas>
    <div class="stats" id="stats">Generation: 0 | Live Cells: 0</div>

    <section class="rules">
    <h3>How to use this page</h3>
      <ul>
        <li>Click <strong>Start</strong> to run the simulation, and <strong>Pause</strong> to stop it.</li>
        <li>Click or drag on the grid to bring cells to life.</li>
        <li>Click <strong>Reset</strong> to bring back the "YELLOW" starting pattern.</li>
      </ul>
      <p>Every generation, all cells update at the same time using these rules:</p>
      <ol>
        <li>
          <strong>Underpopulation:</strong> A live cell with fewer than 2 live
          neighbors dies.
        </li>
        <li>
          <strong>Survival:</strong> A live cell with 2 or 3 live neighbors
          lives on to the next generation.
        </li>
        <li>
          <strong>Overpopulation:</strong> A live cell with more than 3 live
          neighbors dies.
        </li>
        <li>
          <strong>Reproduction:</strong> A dead cell with exactly 3 live
          neighbors becomes alive.
        </li>
      </ol>
      <p>
        In this version the edges wrap around, so a cell on the right edge
        neighbors the cell on the left edge, and the top connects to the
        bottom.
      </p>
    </section>
  `;

  const canvas = document.getElementById("lifeCanvas");
  const context = canvas.getContext("2d");
  const startBtn = document.getElementById("startButton");
  const resetBtn = document.getElementById("resetButton");
  const statsDisplay = document.getElementById("stats");

  const CELL_SIZE = 10; // 10x10 pixels
  const COLS = 70;
  const ROWS = 40;

  canvas.width = COLS * CELL_SIZE;
  canvas.height = ROWS * CELL_SIZE;

  let grid = createGrid();
  let isRunning = false;
  let generation = 0;
  let loopTimeoutId = null;
  let isDrawing = false;

  function createGrid() {
    return Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(0));
  }

  function spellYellow() {
    grid = createGrid();
    const startRow = 16;
    let startCol = 8;

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
      [
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
      // L
      [
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
    // context.clearRect(0, 0, canvas.width, canvas.height);
    let liveCount = 0;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (grid[row][col] === 1) {
          context.fillStyle = "#fde047";
          context.fillRect(
            col * CELL_SIZE,
            row * CELL_SIZE,
            // -1 to leave spave for grid effect
            CELL_SIZE - 1,
            CELL_SIZE - 1,
          );
          liveCount++;
        } else {
          context.fillStyle = "#1e293b";
          context.fillRect(
            col * CELL_SIZE,
            row * CELL_SIZE,
            CELL_SIZE - 1,
            CELL_SIZE - 1,
          );
        }
      }
    }
    statsDisplay.innerText = `Generation: ${generation} | Live Cells: ${liveCount}`;
  }

  function runNextGeneration() {
    const nextGrid = createGrid();

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        let neighbors = 0;

        // checks row & above & below the current row
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
          // checks col & left & right of the current column
          for (let colOffset = -1; colOffset <= 1; colOffset++) {
            if (rowOffset === 0 && colOffset === 0) continue;
            const neighborRow = (row + rowOffset + ROWS) % ROWS; // wraps around top/bottom edges
            const neighborCol = (col + colOffset + COLS) % COLS; // wraps around left/right edges
            neighbors += grid[neighborRow][neighborCol]; //add 1 if alive, 0 if dead.
          }
        }

        if (grid[row][col] === 1 && (neighbors === 2 || neighbors === 3)) {
          nextGrid[row][col] = 1; // survives
        } else if (grid[row][col] === 0 && neighbors === 3) {
          nextGrid[row][col] = 1; // becomes alive
        }
      }
    }

    grid = nextGrid; // replace
    generation++; // increment counter
  }

  function gameLoop() {
    if (!isRunning) return;
    runNextGeneration();
    draw();
    loopTimeoutId = setTimeout(gameLoop, 150);
  }

  function activateCellAtMouse(mouseEvent) {
    const canvasBounds = canvas.getBoundingClientRect();
    const mouseX = mouseEvent.clientX - canvasBounds.left;
    const mouseY = mouseEvent.clientY - canvasBounds.top;
    const col = Math.floor(mouseX / CELL_SIZE); // column the mouse is over
    const row = Math.floor(mouseY / CELL_SIZE); // row the mouse is over

    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      grid[row][col] = 1;
      draw();
    }
  }

  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    activateCellAtMouse(e);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) activateCellAtMouse(e);
  });

  window.addEventListener("mouseup", () => (isDrawing = false));

  startBtn.addEventListener("click", () => {
    isRunning = !isRunning;
    startBtn.innerText = isRunning ? "Pause" : "Start";
    startBtn.style.backgroundColor = isRunning ? "#ef4444" : "#eab308";
    startBtn.style.color = isRunning ? "#f8fafc" : "#0f172a";
    clearTimeout(loopTimeoutId); // rm old loops
    if (isRunning) gameLoop();
  });

  resetBtn.addEventListener("click", () => {
    isRunning = false;
    startBtn.innerText = "Start";
    startBtn.style.backgroundColor = "#eab308";
    startBtn.style.color = "#0f172a";
    clearTimeout(loopTimeoutId); // rm old loops
    generation = 0;
    spellYellow();
    draw();
  });

  spellYellow();
  draw();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGameOfLife);
} else {
  initGameOfLife();
}
