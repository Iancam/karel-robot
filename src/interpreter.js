// because this function uses a 'with' statement,
// this code cannot be imported in the usual way,
// and has to come from global scope
/**
 *
 * @param {string} code
 * @param {import('./karelModel').karelState} initialWorld
 */
function _runCode(code, karelInterface, globals) {
  with ({ ...karelInterface, ...globals, code }) {
    eval(code + '\nmain()');
  }
}
