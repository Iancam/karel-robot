import { LitElement, html, css } from 'lit-element';
import tachyons from '../css/tachyons.min.css';
import karelInterface from './karelInterface';
import karelModel from './karelModel';
import draw from './karelView';
import { recorderDecorator } from './recorderDecorator';
import { javascriptify, pythonGlobals } from './pythonTranslator';
import { addLineIndexMiddleware, addLineNumbers } from './addLineNumbers';
export class KarelIde extends LitElement {
  static get properties() {
    return {
      interpret: { type: Function },
      editor: { type: Object },
      class: { type: String },
      states: { type: Array },
      stateIndex: { type: Number },
      // beforeRun: { type: Function },
    };
  }
  get canvas() {
    return this.shadowRoot.querySelector('#canvas');
  }

  languages = [
    { index: 0, value: 'python', text: 'Python' },
    { index: 1, value: 'javascript', text: 'JavaScript' },
  ];
  language = 'python';

  starterWorld() {
    return {
      karel: { cell: [0, 0], direction: 'e' },
      dimensions: [10, 10],
      beepers: [],
    };
  }

  async runCode() {
    const code = (await this.editor).getCode();
    const languageMap = { python: javascriptify, javascript: code => code };
    const transpiledCode = languageMap[this.language](code);
    const lineNumberCode = addLineNumbers(transpiledCode);
    const { getDiffs, getStates, engine } = recorderDecorator(
      karelModel(this.starterWorld()),
      { ignoreUndefined: true, max: 2500 }
    );
    const karel = karelInterface(engine, {
      middleware: [addLineIndexMiddleware],
    });
    this.interpret(lineNumberCode, karel, pythonGlobals);
    this.states = getStates();
    this.diffs = getDiffs();
  }

  animateDiffs() {
    this.index = 0;
    const intervalID = setInterval(async () => {
      if (!(await this.updateState(this.index++))) {
        return clearInterval(intervalID);
      }
    }, 500);
  }

  async updateState(value) {
    if (!this.states?.[value]) return false;
    this.stateIndex = value;
    this.diffIndex = value - 1;
    (await this.editor).highlightLine(
      this.diffs[this.diffIndex]?.lineNumber,
      'bg-gold'
    );
    draw(this.canvas, this.states[this.stateIndex]);
    return true;
  }

  async reset() {
    this.updateState(0);
  }

  static get styles() {
    return [
      tachyons,
      css`
        .square {
          width: min(50vw, 90vh);
          height: min(50vw, 90vh);
        }
        .vh-10 {
          height: 10vh;
        }
        .overflow-hidden {
          overflow-x: hidden;
          overflow-y: hidden;
        }
        .fr {
          float: right;
        }
      `,
    ];
  }

  // allows canvas sizing to be determined by css
  handleResize() {
    let canvas = this.canvas;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // If it's resolution does not match change it
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    draw(this.canvas, (this.states && this.states[0]) || this.starterWorld());
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize.bind(this));
    super.disconnectedCallback();
  }

  firstUpdated() {
    this.handleResize();
  }

  updateLanguage(e) {
    this.language = e.target.value;
  }

  render() {
    return html`
      <div class=${this.class}>
        <div class="vh-10 overflow-hidden">
          <input
            type="range"
            min="0"
            value=${this.stateIndex}
            max=${this.states ? this.states.length - 1 : 0}
            step="1"
            @input=${e => this.updateState(e.target.value)}
            @change=${() => console.log(this.states[this.stateIndex])}
          />
          <select name="language" @change=${this.updateLanguage}>
            ${this.languages.map(
              ({ value, text }) =>
                html`<option
                  ?selected=${this.languageId === value}
                  value=${value}
                >
                  ${text}
                </option>`
            )}
          </select>
          <button
            @click=${async () => {
              await this.runCode();
              this.animateDiffs();
            }}
          >
            Run
          </button>
          <button class="fr" @click=${this.reset}>Reset</button>
        </div>
        <canvas id="canvas" class="square fr"></canvas>
      </div>
    `;
  }
}
