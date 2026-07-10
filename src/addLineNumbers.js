// addLineNumbers.js;

export const addLineNumbers = code => {
  return code
    .split('\n')
    .map((line, i) => {
      if (line.includes('function') || line.includes('=>')) {
        return line;
      }
      return line.replace(/[\w\d]+\(\)/g, match => {
        const functionName = match.slice(undefined, -2);
        return `${functionName}({lineNumber:${i + 1}})`;
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
    try {
      const [diff, val] = func(args);
      return [{ ...diff, lineNumber }, val];
    } catch (e) {
      throw e + ' at line ' + lineNumber;
    }
  };
};
