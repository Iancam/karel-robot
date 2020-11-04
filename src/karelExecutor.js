import { addLineNumbers } from './addLineNumbers';
import karelInterface from './karelInterface';
import karelModel from './karelModel';
import { javascriptify, pythonGlobals } from './pythonTranslator';
import { recorderDecorator } from './recorderDecorator';

export function codeToStates(code, language, world, interpret) {
  const languageMap = { python: javascriptify, javascript: code => code };
  const transpiledCode = languageMap[language](code);

  const lineNumberCode = addLineNumbers(transpiledCode);
  const { getDiffs, getStates, engine } = recorderDecorator(karelModel(world), {
    ignoreUndefined: true,
    max: 2500,
  });
  const karel = karelInterface(engine, {
    middleware: [addLineIndexMiddleware],
  });
  interpret(lineNumberCode, karel, pythonGlobals);

  return { states: getStates(), diffs: getDiffs() };
}