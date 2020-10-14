import { Karel } from './karelInterface';
function createKarelProposals(language, range) {
  // returning a static list of proposals, not even looking at the prefix (filtering is done by the Monaco editor),
  // here you could do a server side lookup
  const instructions = Object.keys(Karel.instructions).map(instruction => {
    return {
      label: instruction,
      kind: monaco.languages.CompletionItemKind.Function,
      documententation: '',
      insertText: instruction + '()' + (language === 'python' ? '' : ';'),
      range,
    };
  });
  const predicates = Object.keys(Karel.predicates).map(predicate => {
    return {
      label: predicate,
      kind: monaco.languages.CompletionItemKind.Function,
      documententation: '',
      insertText: predicate + '()',
      range,
    };
  });
  const controlFlow = {
    label: 'repeat',
    kind: monaco.languages.CompletionItemKind.Function,
    documententation: '',
    insertText: `repeat(num, ()=>{

  })`,
    range,
  };

  return [...instructions, ...predicates];
}

export async function addEditor(id, options) {
  require.config({ paths: { vs: './node_modules/monaco-editor/min/vs' } });
  return new Promise((res, rej) => {
    require(['vs/editor/editor.main'], function () {
      if (!window._editor) {
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
          lib: ['es6'],
          allowNonTsExtensions: true,
        });
        const options = {
          provideCompletionItems: function (model, position) {
            var word = model.getWordUntilPosition(position);
            var range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };
            return {
              suggestions: createKarelProposals(
                model._languageIdentifier.language,
                range
              ),
            };
          },
        };
        monaco.languages.registerCompletionItemProvider('javascript', options);
        monaco.languages.registerCompletionItemProvider('python', options);
        monaco.languages.registerCompletionItemProvider('java', options);
      }
      var editor = monaco.editor.create(document.getElementById(id), {
        value: options.code,
        language: options.language,
        automaticLayout: true,
        noLib: true,
      });

      if (options.saveEdits) {
        const model = editor.getModel();
        model.onDidChangeContent(() => {
          localStorage.setItem(window.location.href, model.getValue());
        });
      }
      res(editor);
    });
  });
}

async function importEditor(parent, id, options) {
  options = { type: 'monaco', code: '', ...options };
  var codeEl = document.createElement('div');
  codeEl.id = id;
  parent.appendChild(codeEl);
  return await importMonaco(id, options);
}
