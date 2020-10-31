// pythonTranslator.js
import { last } from './utils';

function indents(line) {
  let count = 0;
  for (const char of line) {
    if (char === ' ' || char === '\t') count++;
    else break;
  }

  return count;
}

function addBracketsFactory() {
  let indentStack = [0];
  return ({ indentLevel, transform }) => {
    // ignore commented lines
    if (transform.includes('#') && !transform.split('#')[0].trim().length)
      return transform;
    // ignore whitespace in empty lines
    if (indentLevel > last(indentStack) && transform.trim().length) {
      indentStack.push(indentLevel);
      transform = '{' + transform;
    }

    while (indentLevel < last(indentStack)) {
      indentStack.pop();
      transform = '}' + transform;
    }
    return transform;
  };
}

export function javascriptify(input) {
  const addBrackets = addBracketsFactory();

  const lines = [...input.split('\n'), ''].reduce((lines, line, i) => {
    const prevLine = last(lines);
    const indentLevel = indents(line);

    const bracketed = addBrackets({ indentLevel, transform: line });
    const transform = bracketed
      .replace(/def (.*):/, (__, body) => 'function ' + body)
      .replace(/(if|for|while|def) (.*):/, (__, key, body) => {
        return `${key}(${body})`;
      })
      .replace('else:', 'else')
      .replace('elif', 'else if')
      .replace(' and ', ' && ')
      .replace(' or ', ' || ')
      .replace(' not ', ' ! ')
      .replace(' in ', ' of ')
      .replace('#', '//')
      .replace(/\bpass\b/, '');

    lines.push({
      line,
      length: line.length,
      index: i,
      charIndex: prevLine ? prevLine.length + prevLine.charIndex + 1 : 0,
      transform,
    });
    return lines;
  }, []);

  const final = lines.map(({ transform }) => transform).join('\n');
  console.log(final);
  return final;
}

export const pythonGlobals = {
  range: (start, end, step) => {
    if (end === undefined) {
      end = start;
      start = 0;
    }
    step = step || 1;
    let ret = [];
    for (let i = start; i < end; i += step) {
      ret.push(i);
    }
    return ret;
  },
};
