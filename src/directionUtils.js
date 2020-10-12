import { mod } from './utils';
export const directions = [
  { name: 'north', angle: 0, cellCorrection: [1, 1], move: [1, 0] },
  { name: 'east', angle: 270, cellCorrection: [0, 1], move: [0, 1] },
  { name: 'south', angle: 180, cellCorrection: [0, 0], move: [-1, 0] },
  { name: 'west', angle: 90, cellCorrection: [1, 0], move: [0, -1] },
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
