import { addLineIndexMiddleware, addLineNumbers } from './addLineNumbers';
import karelInterface from './karelInterface';
import karelModel from './karelModel';
import { javascriptify, pythonGlobals } from './pythonTranslator';
import { recorderDecorator } from './recorderDecorator';

export function codeToStates(code, language, world, interpret) {
  const languageMap = { python: javascriptify, javascript: code => code };
  if (typeof languageMap[language] !== 'function') {
    console.error(`Language ${language} not found`);
    throw new Error(`Language ${language} not found`);
  }
  const transpiledCode = languageMap[language](code);
  const lineNumberCode = addLineNumbers(transpiledCode);
  console.log(world);
  const { getDiffs, getStates, engine } = recorderDecorator(karelModel(world), {
    ignoreUndefined: true,
    max: 2500,
  });
  const karel = karelInterface(engine, {
    middleware: [addLineIndexMiddleware],
  });
  try {
    _runCode(lineNumberCode, karel, pythonGlobals);
  } catch (error) {
    console.log(error);
    if (error.name === 'SyntaxError') throw error;
  }

  return { states: getStates(), diffs: getDiffs() };
}
