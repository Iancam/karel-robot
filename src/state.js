function keyParser(func, arity) {
  let args = undefined;
}

/**
 * @param {{string:any}} state
 * state should be a denormalized object,
 * @param {{[k in state]:[(state, diff)=>state, ...string]}} handlers
 * keys in handlers denote the shape of the state,
 * keys in state will always match the keys of handler.
 * the list of strings after a handler are diff keys that it will respond to.
 * @param {{}} diff
 * an object who's keys index into the handlers,
 */

const genericStateHandler = handlers => (state, diff) => {
  const results = Object.keys(handlers)
    .map(handlerKey => {
      const [handler, ...diffKeys] = handlers[handlerKey];
      // only call handler if the keys match, and with the matching kv pairs
      const diffForHandler = diffKeys
        .filter(key => diff[key] != undefined)
        .reduce((obj, key) => {
          obj[key] = diff[key];
          return obj;
        }, {});
      return [
        key,
        diffForHandler ? handler(state, diffForHandler) : state[handlerKey],
      ];
    })
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
};

const handlers = {
  todosCount: [
    ({ add, subtract }, state) => state + (add ? 1 : subtract ? -1 : 0),
    'add',
    'subtract',
  ],
  todos: [({ newTodo }, state) => [newTodo, ...state], 'newTodo'],
};
