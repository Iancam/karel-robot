import directionTransforms from './directionUtils';
import { getRegexMatches, vAdd } from './utils';
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
 *  dimensions:coord,
 *  walls:[coord],
 *  beepers:[{
 *    cell:coord,
 *    count:number
 *  }],
 *  karel: {
 *    cell:coord,
 *    direction: dir}
 *  }} karelState
 *  @typedef {(diff:diff)=> {karelState:karelState, checkCell, beepersAt}} karelEngine
 */

/**
 *
 * @param {karelState}
 * @param {coord}
 */
const validSquare = ({ dimensions: [xDim, yDim], walls }) => ([cx, cy]) => {
  if (walls)
    for (let [wx, wy] of walls) {
      if (wx === cx && wy == cy) throw 'karel cannot walk through walls';
    }
  if (cx > xDim || cx < 0 || cy > yDim || cy < 0)
    throw 'karel cannot breath in space';
  return true;
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
      .map(x => {
        Object.keys(beeperLookup[x]).map(y => {
          return { cell: { x, y }, count: beeperLookup[x][y] };
        });
      })
      .flat();
  }

  function checkCell(cell) {
    const [x, y] = cell;
    const beeper = beeperLookup[x] && beeperLookup[x][y];
    return { cell, count: beeper.count || 0 };
  }

  /**
   * @param {diff} param0
   */
  function diffHandler({ beeper }) {
    if (beeper) {
      const { cell, count } = beeper;
      let xs = beeperLookup[cell[0]] || (beeperLookup[cell[0]] = {});
      xs[cell[1]] = (xs[cell[1]] || 0) + count;
      if (xs[cell[1]] < 0) throw 'karel cannot create anti-beepers (yet)';
    }
    return toList(beeperLookup);
  }

  return { diffHandler, checkCell };
};

/**
 *
 * @param {{karel:karel}}
 */
const karel = ({ karel }, validateSquare) => {
  let karelState = karel;

  /**
   * @param {diff} param0
   */
  const diffHandler = ({ move, turn }) => {
    karelState.direction = turn || karelState.direction;
    if (move) {
      const newCell = vAdd(karel.cell, move);
      validateSquare(newCell) && (karel.cell = newCell);
      karelState.cell = newCell;
    }
    return karelState;
  };
  return diffHandler;
};

/**
 * @typedef {(karelState)=>(diff)=>karelState} karelModelFactory
 *  @param {karelState} initialState
 */
export default initialState => {
  // let state = initialState;
  const checkCell = validSquare(initialState);
  const { diffHandler: changeBeepers, checkCell: beepersAt } = beepers(
    initialState
  );
  const changeKarel = karel(initialState, checkCell);
  /**
   
   * @param {diff} diff
   * note, values are diffs, and will be added to the state
   * this means a list of diffs it'll be easy to do time travel!
   */
  const returnValue = diff => {
    return {
      ...initialState,
      checkCell,
      beepersAt,
      beepers: changeBeepers(diff || {}),
      karel: changeKarel(diff || {}),
    };
  };
  return returnValue;
};
