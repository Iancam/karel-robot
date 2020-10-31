import directionTranslator, { directions } from './directionUtils';
import { capitalize, toObject } from './utils';
import { flowRight, flow, entries } from 'lodash-es';
export const Karel = {
  instructions: {
    move: 1,
    turnLeft: 1,
    putBeeper: 1,
    pickBeeper: 1,
    turnRight: 2,
    turnAround: 2,
  },
  predicates: {
    frontIsClear: 1,
    leftIsClear: 1,
    rightIsClear: 1,
    beepersPresent: 1,
    facingNorth: 1,
    facingEast: 1,
    facingSouth: 1,
    facingWest: 1,
  },
};

function negateInterface(iface) {
  return Object.entries(iface)
    .map(([k, fx]) => ['not' + k[0].toUpperCase() + k.slice(1), () => !fx()])
    .reduce(toObject, {});
}
/**
 * @param {import('./karelModel').karelEngine} karelEngine
 *
 */
export default function karelInterface(karelEngine, options = {}) {
  const updateEngine = func => {
    return args => {
      const [diff, val] = func(args);
      karelEngine(diff);
      return val;
    };
  };
  // middleware (func)=>([diff, val, ...rest])=>[diff, val, ...rest]
  const middleware = [...options.middleware, updateEngine];
  const turns = { front: 0, left: -1, right: 1, around: 2 };
  const turnsInterface = Object.keys(turns)
    .map(key => ['turn' + capitalize(key), () => [{ turn: turns[key] }]])
    .reduce(toObject, {});

  const clearInterface = Object.keys(turns)
    .map(key => [
      (key === 'around' ? 'back' : key) + 'IsClear',
      () => {
        const funcName = (key === 'around' ? 'back' : key) + 'IsClear';
        const { checkCell, karel } = karelEngine();
        const adjunctCell = directionTranslator(karel.direction + turns[key])
          .move;
        return [
          {
            [funcName]: adjunctCell,
          },
          checkCell(adjunctCell),
        ];
      },
    ])
    .reduce(toObject, {});

  const notClearInterface = negateInterface(clearInterface);

  const facingInterface = directions
    .map(({ name }, i) => [
      'facing' + capitalize(name),
      () => [
        { ['facing' + capitalize(name)]: i },
        karelEngine().karel.direction === i,
      ],
    ])
    .reduce(toObject, {});

  const notFacingInterface = negateInterface(facingInterface);

  const karelInterface = {
    ...clearInterface,
    ...facingInterface,
    ...notFacingInterface,
    ...turnsInterface,
    move: () => {
      const { direction } = karelEngine().karel;
      return [
        {
          move: directionTranslator(direction).move,
        },
      ];
    },
    putBeeper: () => {
      return [{ beeper: { cell: karelEngine().karel.cell, count: 1 } }];
    },
    pickBeeper: () => {
      return [{ beeper: { cell: karelEngine().karel.cell, count: -1 } }];
    },
    beepersPresent: () => {
      const cell = karelEngine().karel.cell;
      return [{ beepersPresent: cell }, karelEngine().beepersAt(cell).count];
    },
    noBeepersPresent: () => {
      const cell = karelEngine().karel.cell;
      return [{ noBeepersPresent: cell }, !karelEngine().beepersAt(cell).count];
    },
  };

  return Object.entries(karelInterface)
    .map(([k, func]) => {
      Object.defineProperty(func, 'name', { value: k });
      const withMiddleware = flow(middleware)(func);
      return [k, withMiddleware];
    })
    .reduce(toObject, {});
}
