// import { LitElement, html, css } from 'lit-element';

import directionTransforms from './directionUtils';
import { toDegrees, vAdd, vMul } from './utils';
import { debounce } from 'lodash-es';
/**
 * @param {HTMLCanvasElement} canvas
 * @param {import('./karelModel').karelState} karelState
 */
const draw = (canvas, karelState) => {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const [nrows, ncols] = karelState.dimensions;
  const cellSize = nrows > ncols ? canvas.width / nrows : canvas.height / ncols;

  const [startX, endX] = worldBounds(canvas.width, ncols, cellSize);
  const [startY, endY] = worldBounds(canvas.height, nrows, cellSize);

  drawKarel(karelState.karel);
  drawWorld(karelState);
  karelState.beepers.forEach(drawBeeper);

  function worldBounds(length, numDivisions, cellSize) {
    const centerX = length / 2;
    return [
      centerX - (numDivisions / 2) * cellSize,
      centerX + (numDivisions / 2) * cellSize,
    ];
  }

  function cellHandle(col, row) {
    return [startX + col * cellSize, startY + (nrows - row - 1) * cellSize];
  }
  function cellCenter(col, row) {
    return cellHandle(col, row).map(dim => dim + cellSize / 2);
  }

  function drawCenter(col, row) {
    const [x, y] = cellCenter(col, row);
    line([x + cellSize / 20, y, x - cellSize / 20, y]);
    line([x, y - cellSize / 20, x, y + cellSize / 20]);
  }

  function drawKarel({ cell, direction }) {
    const paths = [
      [
        'M26,118 L26,75 L13,75 L0,75 L0,59.5 L0,44 L6.5,44 L13,44 L13,52.5 L13,61 L19.5,61 L26,61 L26,50.3 L26,39.5 L34.7,30.8 L43.5,22 L58.8,22 L74,22 L73.8,11.3 L73.5,0.5 L91.3,0.2 L109.1,0 L108.8,6.7 L108.5,13.5 L97.8,13.8 L87,14.1 L87,18 L87,22 L110.8,22.2 L134.5,22.5 L134.8,79 L135,135.5 L122.3,148.2 L109.5,161 L67.8,161 L26,161 L26,118 Z M117.3,144.2 L130,131.5 L129.8,79 L129.5,26.5 L89,26.4 L48.5,26.3 L39.3,35.3 L30,44.4 L30,100.7 L30,157 L67.3,157 L104.5,157 L117.3,144.2 Z',
        { id: 'Shape', fill: '#000000', fillRule: 'nonzero' },
      ],
      [
        'M130,26 L130,131.5 L104.5,157 L30,157 L30,44.4 L48,26.3 L130,26 Z M100,70 L48,70 L48,144 L100,144 L100,70 Z',
        { id: 'Combined-Shape', fill: '#FFFFFF' },
      ],
      [
        'M48,107 L48,70 L74,70 L100,70 L100,107 L100,144 L74,144 L48,144 L48,107 Z M95.5,107 L95.5,74.5 L74,74.5 L52.5,74.5 L52.2,107.3 L52,140 L73.7,139.8 L95.5,139.5 L95.5,107 Z',
        { id: 'Shape', fill: '#000000', fillRule: 'nonzero' },
      ],
      [
        'M74,50.5 L74,48 L91.3,48.2 C107.7,48.5 108.5,48.6 108.5,50.5 C108.5,52.4 107.7,52.5 91.3,52.8 L74,53 L74,50.5 Z',
        { id: 'Path', fill: '#000000', fillRule: 'nonzero' },
      ],
    ];
    const { name, angle, cellCorrection } = directionTransforms(direction);

    const correctedCell = vAdd(cellCorrection, cell);
    ctx.translate(...cellHandle(...correctedCell));

    ctx.scale(-1, 1);
    // ctx.fillRect(0, 0, 5, 5);
    ctx.rotate(toDegrees(270 + angle));
    const svgSize = 160;
    const margin = 12;
    const scale = cellSize / (svgSize + margin);
    ctx.scale(scale, scale);

    paths.forEach(([path, { fill }]) => {
      const p = new Path2D(path);
      ctx.fillStyle = fill;
      ctx.fill(p);
    });
    ctx.resetTransform();
  }

  function drawWorld() {
    for (let row = 0; row <= nrows; row++) {
      line([startX, startY + row * cellSize, endX, startY + row * cellSize]);
    }
    for (let col = 0; col <= ncols; col++) {
      line([startX + col * cellSize, startY, startX + col * cellSize, endY]);
    }
    for (let i = 0; i < ncols; i++) {
      for (let j = 0; j < nrows; j++) {
        drawCenter(i, j);
      }
    }
  }

  function drawBeeper({ cell, count }) {
    if (!count) return;
    const center = cellCenter(...cell);
    const handle = cellHandle(...cell);
    const rightHandle = cellHandle(cell[0] + 1, cell[0]);
    const bottomHandle = cellHandle(cell[0], cell[1] - 1);

    ctx.beginPath();
    ctx.moveTo(handle[0], center[1]);

    ctx.lineTo(center[0], handle[1]);
    ctx.lineTo(rightHandle[0], center[1]);
    ctx.lineTo(center[0], bottomHandle[1]);
    ctx.lineTo(handle[0], center[1]);
    ctx.fillStyle = 'cyan';
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
    ctx.fillText(count, ...center);
  }

  function line(coords) {
    const [x, y, x1, y1] = coords;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();
  }
};
export default debounce(draw, 50, { cancel: true });
