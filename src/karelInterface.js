import directionTranslator, { directions } from './directionUtils';
import karelModelFactory from './karelModel';
import { capitalize, toObject } from './utils';

// Karel.instructions = {
//   move: 1,
//   turnLeft: 1,
//   putBeeper: 1,
//   pickBeeper: 1,
//   turnRight: 2,
//   turnAround: 2,
// };

// Karel.predicates = {
//   frontIsClear: 1,
//   leftIsClear: 1,
//   rightIsClear: 1,
//   beepersPresent: 1,
//   facingNorth: 1,
//   facingEast: 1,
//   facingSouth: 1,
//   facingWest: 1,
// };

/**
 * @param {import("./karelModel").karelState} initialState
 * @param {import('./karelModel').karelEngine} karelEngine
 */
export default function karelInterface(karelEngine) {
  const turns = { front: 0, left: 1, right: -1, around: 2 };
  const turnsInterface = Object.keys(turns)
    .map(key => [
      'turn' + capitalize(key),
      () => karelEngine({ turn: turns[key] }),
    ])
    .reduce(toObject, {});

  const clearInterface = Object.keys(turns)
    .map(key => [
      (key === 'around' ? 'back' : key) + 'IsClear',
      () => {
        const funcName = (key === 'around' ? 'back' : key) + 'IsClear';
        const { checkCell, karel } = karelEngine();
        const adjunctCell = directionTranslator(karel.direction + turns[key])
          .move;
        karelEngine({
          [funcName]: adjunctCell,
        });
        return checkCell(adjunctCell);
      },
    ])
    .reduce(toObject, {});

  const facingInterface = directions
    .map(({ name }, i) => [
      'facing' + capitalize(name),
      () =>
        karelEngine({ ['facing' + capitalize(name)]: i }).karel.direction === i,
    ])
    .reduce(toObject, {});

  const karelInterface = {
    ...clearInterface,
    ...facingInterface,
    ...turnsInterface,
    move: () => {
      const { direction } = karelEngine().karel;
      karelEngine({
        move: directionTranslator(direction).move,
      });
    },
    putBeeper: () => {
      karelEngine({ beeper: { cell: karelEngine().karel.cell, count: 1 } });
    },
    pickBeeper: () => {
      karelEngine({ beeper: { cell: karelEngine().karel.cell, count: -1 } });
    },
    beepersPresent: () => {
      const { karel, beepersAt } = karelEngine({ beepersPresent: karel.cell });
      return beepersAt(karel.cell).count;
    },
  };
  return karelInterface;
}
