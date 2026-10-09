# Conway's Game of Life

A simple Game of Life in the browser, written in plain JavaScript. The grid starts with the word **YELLOW** spelled out in live cells.

## Run it

The easiest way is to open `index.html` in your browser.

To run it on localhost instead:

```bash
npx serve
```

Then open the address it prints (usually `http://localhost:3000`).

## Controls

- **Start / Pause:** run or stop the simulation
- **Reset:** bring back the YELLOW pattern
- **Click or drag on the grid:** draw live cells

## Rules

1. A live cell with fewer than 2 live neighbors dies.
2. A live cell with 2 or 3 live neighbors survives.
3. A live cell with more than 3 live neighbors dies.
4. A dead cell with exactly 3 live neighbors becomes alive.

The edges wrap around, so the left side connects to the right and the top to the bottom.
