// data.js;

const ignoreMe = {
  save: function (options) {
    const model = editor.getModel();
    localStorage.setItem(
      fileName,
      JSON.stringify({ code: model.getValue(), ...options })
    );
  },

  load: function (fileName) {
    const results = JSON.parse(localStorage.getItem(fileName));
    this.setCode(results.code);
    return results;
  },
};
