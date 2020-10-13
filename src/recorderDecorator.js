import { last } from './utils';
import { cloneDeep } from 'lodash-es';

/**
 * @template T, J
 * @param {<T,J>(diff:T)=>J} diffEngine
 * @returns {<T,J>{getDiffs:[T], engine:(diff:T, lineNumber?)=>j}}
 */
export const recorderDecorator = (diffEngine, options) => {
  let diffs = [];
  let states = [cloneDeep(diffEngine())];
  return {
    getStates: () => states,
    getDiffs: () => diffs,
    engine: diff => {
      if (!options.ignoreUndefined || diff) {
        diffs.push({ ...diff });
        const nextState = diffEngine(diff);
        console.log({ diff, karel: nextState });
        states.push(cloneDeep(nextState));
      }
      return last(states);
    },
  };
};
