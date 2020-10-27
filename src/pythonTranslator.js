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

export function linesBinSearch({ charIndex }, stack) {
  const mid = Math.floor(stack.length / 2);
  const { charIndex: charIndex2 } = stack[mid];
  const top = stack[mid + 1];
  const charIndexTop = top ? top.charIndex : Number.MAX_VALUE;
  if (charIndex < charIndexTop && charIndex > charIndex2) {
    return stack[mid];
  }
  if (charIndex > charIndexTop) {
    return linesBinSearch({ charIndex }, stack.slice(mid));
  } else return linesBinSearch({ charIndex }, stack.slice(undefined, mid));
}

function addBracketsFactory() {
  let indentStack = [0];
  return ({ indentLevel, transform }) => {
    if (indentLevel > last(indentStack)) {
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

  const lines = input.split('\n').reduce((lines, line, i) => {
    const prevLine = last(lines);
    const indentLevel = indents(line);

    const bracketed = addBrackets({ indentLevel, transform: line });
    const transform = bracketed
      .replace(/def (.*):/, (__, body) => 'function ' + body)
      .replace(/(if|for|while|def) (.*):/, (__, key, body) => {
        return `${key}(${body})`;
      })
      .replace(' and ', ' && ')
      .replace(' or ', ' || ')
      .replace(' not ', ' ! ')
      .replace(' in ', ' of ')
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

  return lines.map(({ transform }) => transform).join('\n');
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
