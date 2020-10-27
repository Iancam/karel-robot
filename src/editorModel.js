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

    saveEdits: function (shouldSave) {
      const model = editor.getModel();
      model._languageIdentifier.language;
      const saveFx = () => {
        localStorage.setItem(
          window.location.href + '?lang=' + model._languageIdentifier.language,
          model.getValue()
        );
      };
      model.onDidChangeContent(shouldSave ? saveFx : () => {});
    },
  };
}
