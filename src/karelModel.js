import directionTransforms from './directionUtils';
import { getRegexMatches, mod, vAdd } from './utils';
import { cloneDeep } from 'lodash-es';
/**
 * functions in this file are inspired by the reducer pattern from Redux
 * each function has a shape like this:
 *    initializer(state) => updater(diff) => getter(?)=>substate
 */
/**
 * @typedef {{
 *  move: coord,
 *  turn: number,
 *  beeper:{ cell:coord, count: number}}} diff
 * @typedef {1|2|3|0} dir
 * @typedef {[number, number]} coord
 * @typedef {{cell:coord, direction: dir}} karel
 * @typedef {[{ cell:coord, count:number}]} beepers
 * @typedef {{
 *  dimension:coord,
 *  walls:[coord],
 *  beepers:[{
 *    cell:coord,
 *    count:number
 *  }],
 *  karel: {
 *    cell:coord,
 *    direction: dir}
 *  }} karelState
 *  @typedef {(diff:diff)=>{karel:karelState, validateCell: (coord: coord)=>{value:boolean, msg:string}, beepersAt}} karelEngine
 */

/**
 *
 * @param {karelState}
 * @param {coord}
 * @returns {{value:boolean, msg: string?}} validation
 */
const validCell = ({ dimension: [xDim, yDim], walls }) => (
  [destX, destY],
  move
) => {
  if (walls && move) {
    const [dx, dy] = move;
    for (let {
      cell: [wx, wy],
      side,
    } of walls) {
      let blocked = false;
      if (side === 'west' && dx === 1 && destX === wx && destY === wy)
        blocked = true;
      if (side === 'west' && dx === -1 && destX === wx - 1 && destY === wy)
        blocked = true;
      if (side === 'south' && dy === -1 && destX === wx && destY === wy - 1)
        blocked = true;
      if (side === 'south' && dy === 1 && destX === wx && destY === wy)
        blocked = true;
      if (blocked)
        return { value: false, msg: 'karel cannot walk through walls' };
    }
  }
  if (destX >= xDim || destX < 0 || destY >= yDim || destY < 0)
    return { value: false, msg: 'karel cannot breath in space' };

  return { value: true };
};

/**
 *
 * @param {karelState} param0
 */
const beepers = ({ beepers }) => {
  const beeperLookup = {};
  if (beepers) {
    beepers.forEach(({ cell: [x, y], count }) => {
      const xs = beeperLookup[x] || (beeperLookup[x] = {});
      console.log(xs);
      xs[y] = (xs[y] || 0) + count;
    });
    beepers.forEach(diffHandler);
  }

  function toList(beeperLookup) {
    return Object.keys(beeperLookup)
      .map(x =>
        Object.keys(beeperLookup[x]).map(y => {
          return {
            cell: [parseInt(x), parseInt(y)],
            count: beeperLookup[x][y],
          };
        })
      )
      .flat()
      .filter(({ count }) => count > 0);
  }

  function checkCell(cell) {
    const [x, y] = cell;
    const count = beeperLookup[x] && beeperLookup[x][y];
    return { cell, count: count || 0 };
  }

  /**
   * @param {diff} Unknown
   */
  function diffHandler(diff) {
    if (!diff.beeper) {
      return toList(beeperLookup);
    }
    const {
      cell: [x, y],
      count,
    } = diff.beeper;
    if (count) {
      let xs = beeperLookup[x] || (beeperLookup[x] = {});
      xs[y] = (xs[y] || 0) + count;
      if (xs[y] < 0) throw 'karel cannot create anti-beepers (yet)';
    }
    return toList(beeperLookup);
  }

  return { diffHandler, checkCell };
};

/**
 *
 * @param {{karel:karel}}
 */
const karel = ({ karel }, validateCell) => {
  let karelState = cloneDeep(karel);
  karelState.direction = directionTransforms(karelState.direction).index;
  /**
   * @param {diff} param0
   */
  const diffHandler = ({ move, turn }) => {
    const newDirection = mod(karelState.direction + turn, 4);
    turn && (karelState.direction = newDirection);

    if (move) {
      const newCell = vAdd(karelState.cell, move);
      const validation = validateCell(newCell, move);
      if (validation.value) karelState.cell = newCell;
      else throw validation.msg;
    }
    return karelState;
  };
  return diffHandler;
};

/**
 * @typedef {(karelState)=>(diff:diff)=>karelState} karelModelFactory
 *  @param {karelState} initialState
 */
export default initialState => {
  const validateCell = validCell(initialState);
  const { diffHandler: changeBeepers, checkCell: beepersAt } = beepers(
    initialState
  );
  const changeKarel = karel(initialState, validateCell);
  /**
   
   * @param {diff} diff
   * note, values are diffs, and will be added to the state
   * this means a list of diffs it'll be easy to do time travel!
   */
  const returnValue = diff => {
    const karel = changeKarel(diff || {});
    const retval = {
      ...initialState,
      validateCell,
      beepersAt,
      beepers: changeBeepers(diff || {}),
      karel,
    };
    return retval;
  };
  return returnValue;
};
