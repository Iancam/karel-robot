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

  return ({ indentLevel, transform, isTerminal }) => {
    const dropStack = indentLevel => {
      while (indentLevel < last(indentStack)) {
        indentStack.pop();
        transform = '}' + transform;
      }
    };

    if (isTerminal) {
      dropStack(0);
    }
    const isComment =
      transform.includes('#') && !transform.split('#')[0].trim().length;
    const isBlank = transform.length == 0;
    if (isComment || isBlank) return transform;
    // ignore whitespace in empty lines
    if (indentLevel > last(indentStack) && transform.trim().length) {
      indentStack.push(indentLevel);
      transform = '{' + transform;
    }
    dropStack(indentLevel);
    return transform;
  };
}

export function javascriptify(input) {
  const rawLines = input.split('\n');
  const addBrackets = addBracketsFactory();
  const lines = rawLines.reduce((lines, line, i) => {
    const prevLine = last(lines);
    const indentLevel = indents(line);

    const bracketed = addBrackets({
      indentLevel,
      transform: line,
      isTerminal: i == rawLines.length - 1,
    });
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
      .replace('True', 'true')
      .replace('False', 'false')
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
