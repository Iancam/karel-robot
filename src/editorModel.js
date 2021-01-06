export async function EditorModel(monacoEditor, options) {
  let editor = await monacoEditor;
  let openFile = undefined;
  let language = 'javascript';
  let decorations = [];
  const starterCode = {
    javascript: `function main(){
    // your code goes here!
  }`,
    python: `def main():
    \t#your code goes here!`,
  };

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
      editor.getModel().setValue(code);
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
      editor.executeEdits('my-source', [op]);
    },

    saveEdits: function () {
      const model = editor.getModel();
      model.onDidChangeContent(this.updateSession.bind(this));
    },

    updateSession: function () {
      localStorage.setItem(
        'sessionCode',
        JSON.stringify({ code: this.getCode(), language })
      );
    },

    loadSession: function () {
      const { code, language: lang } = JSON.parse(
        localStorage.getItem('sessionCode')
      ) ?? {
        code: starterCode[lang],
        language,
      };
      this.setCode(code);
      this.setLanguage(lang);
    },
    /**
     *
     * @param {string} fileName
     * @param {{language, world, date}} options
     */
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
        .map(k => JSON.parse(localStorage.getItem(k)));
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
