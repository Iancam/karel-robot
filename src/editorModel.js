export async function EditorModel(monacoEditor, options) {
  let editor = await monacoEditor;
  let openFile = undefined;
  let language = undefined;
  let decorations = [];
  const starterCode = `function main(){
    // your code goes here!
  }`;

  const that = {
    setLanguage: function (lang) {
      let model = editor.getModel();
      language = lang;
      monaco.editor.setModelLanguage(model, lang);
      this.updateSession();
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
    updateSession() {
      localStorage.setItem(
        'sessionCode',
        JSON.stringify({ code: this.getCode(), language })
      );
    },
    saveEdits: function () {
      const model = editor.getModel();
      model.onDidChangeContent(() => {
        this.updateSession();
      });
    },

    loadSession: function () {
      const { code, language: lang } = JSON.parse(
        localStorage.getItem('sessionCode')
      ) || {
        code: starterCode,
        language,
      };
      this.setCode(code || starterCode);
      this.setLanguage(lang);
    },

    save: function (fileName, options) {
      const code = this.getCode();
      localStorage.setItem(
        'file::' + fileName,
        JSON.stringify({ code, name: fileName, ...options })
      );
    },

    load: function (fileName) {
      const results = JSON.parse(localStorage.getItem('file::' + fileName));
      openFile = fileName;
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
    language() {
      return language;
    },
    currentFile() {
      return openFile;
    },
  };

  that.loadSession();
  that.saveEdits();
  return that;
}
