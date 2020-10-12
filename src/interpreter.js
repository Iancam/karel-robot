// import interfaceFactory from './karelInterface';
// import karelModelFactory from './karelModel';

/**
 *
 * @param {string} code
 * @param {import('./karelModel').karelState} initialWorld
 */
function _runCode(code, karelInterface) {
  with ({ ...karelInterface, code }) {
    eval(code + '\nmain()');
  }
}

// const diffs = runCode(code);
// console.log(diffs);
