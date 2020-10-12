import { last } from './utils';
import { cloneDeep } from 'lodash-es';

/**
 * @template T, J
 * @param {<T,J>(diff:T)=>J} diffEngine
 * @returns {<T,J>{getDiffs:[T], engine:(diff:T, lineNumber?)=>j}}
 */
export const recorderDecorator = (diffEngine, options) => {
  let diffs = [];
  let states = [diffEngine()];

  return {
    getStates: () => states,
    getDiffs: () => diffs,
    engine: (diff, lineNumber) => {
      if (!options.ignoreUndefined || diff) {
        diffs.push({ ...diff });
        const nextState = diffEngine(diff);
        states.push(cloneDeep(nextState));
      }
      return last(states);
    },
  };
};
