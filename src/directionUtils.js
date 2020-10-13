import { mod } from './utils';
export const directions = [
  { index: 0, name: 'north', angle: 0, cellCorrection: [1, -1], move: [0, 1] },
  { index: 1, name: 'east', angle: 270, cellCorrection: [0, -1], move: [1, 0] },
  {
    index: 2,
    name: 'south',
    angle: 180,
    cellCorrection: [0, 0],
    move: [0, -1],
  },
  { index: 3, name: 'west', angle: 90, cellCorrection: [1, 0], move: [-1, 0] },
];
/**
 *
 * @param {string|number} dir
 */
export default dir => {
  dir =
    typeof dir === 'string'
      ? directions
          .map(({ name }, i) => [name, i])
          .filter(([name]) => name.startsWith(dir.toLowerCase()))[0][1]
      : mod(dir, 4);
  return directions[dir];
};
