// addLineNumbers.js;

export const addLineNumbers = code => {
  return code
    .split('\n')
    .map((line, i) => {
      if (line.includes('function') || line.includes('=>')) {
        return line;
      }
      return line.replace(/[\w\d]+\(\)/, match => {
        return `${match.slice(undefined, -2)}({lineNumber:${i + 1}})`;
      });
    })
    .join('\n');
};

/**
 *
 * @param {Function} func
 */
export const addLineIndexMiddleware = func => {
  return args => {
    const { lineNumber } = args;
    const [diff, val] = func(args);
    return [{ ...diff, lineNumber }, val];
  };
};
