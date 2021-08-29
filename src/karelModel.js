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
const validCell = ({ dimension: [xDim, yDim], walls }) => ([cx, cy]) => {
  if (walls)
    for (let [wx, wy] of walls) {
      if (wx === cx && wy == cy)
        return { value: false, msg: 'karel cannot walk through walls' };
    }
  if (cx >= xDim || cx < 0 || cy >= yDim || cy < 0)
    return { value: false, msg: 'karel cannot breath in space' };

  return { value: true };
};

/**
 *
 * @param {karelState} param0
 */
const beepers = ({ beepers }) => {
  const beeperLookup = {};

  beepers && beepers.forEach(diffHandler);

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
      .flat();
  }

  function checkCell(cell) {
    const [x, y] = cell;
    const beeper = beeperLookup[x] && beeperLookup[x][y];
    return { cell, count: beeper?.count || 0 };
  }

  /**
   * @param {diff} param0
   */
  function diffHandler(beeper) {
    const { cell, count } = beeper;
    console.log(beeper);
    if (cell) {
      let xs = beeperLookup[cell[0]] || (beeperLookup[cell[0]] = {});
      xs[cell[1]] = (xs[cell[1]] || 0) + count;
      if (xs[cell[1]] < 0) throw 'karel cannot create anti-beepers (yet)';
    }
    console.log(beeper);
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
      const validation = validateCell(newCell);
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
  console.log(initialState);
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
    return {
      ...initialState,
      validateCell,
      beepersAt,
      beepers: changeBeepers(diff || {}),
      karel,
    };
  };
  return returnValue;
};
