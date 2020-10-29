export async function EditorModel(monacoEditor) {
  let editor = await monacoEditor;
  let decorations = [];
  return {
    setLanguage: function (language) {
      let model = editor.getModel();
      monaco.editor.setModelLanguage(model, language);
    },

    focus: function () {
      editor.focus();
    },

    getCode: function () {
      return editor.getModel().getValue();
    },

    setCode: function (code) {
      return editor.getModel().setValue(code);
    },

    highlightLine: function (lineNumber, className) {
      // if (!lineNumber) return;
      const newDecorations = lineNumber
        ? [
            {
              range: new monaco.Range(lineNumber, 1, lineNumber, 1),
              options: {
                isWholeLine: true,
                linesDecorationsClassName: className,
              },
            },
          ]
        : [];
      decorations = editor.deltaDecorations(decorations, newDecorations);
    },

    insertCode: function (text) {
      var selection = editor.getSelection();
      var id = { major: 1, minor: 1 };
      var op = {
        identifier: id,
        range: selection,
        text,
        forceMoveMarkers: true,
      };
      return editor.executeEdits('my-source', [op]);
    },

    save: function (fileName, options) {
      const model = editor.getModel();
      localStorage.setItem(
        'file::' + fileName,
        JSON.stringify({ code: model.getValue(), name: fileName, ...options })
      );
    },

    load: function (fileName) {
      const results = JSON.parse(localStorage.getItem('file::' + fileName));
      return results;
    },

    listFiles: function () {
      return Object.keys(localStorage)
        .filter(k => k.startsWith('file::'))
        .map(k => k.slice(6));
    },
    remove: function (fname) {
      localStorage.removeItem('file::' + fname);
    },
  };
}
