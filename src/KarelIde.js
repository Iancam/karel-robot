import { LitElement, html, css } from 'lit-element';
import tachyons from './tachyons.min.css';
import karelInterface from './karelInterface';
import karelModel from './karelModel';
import draw from './karelView';
import { recorderDecorator } from './recorderDecorator';
import { javascriptify, pythonGlobals } from './pythonTranslator';
import { addLineIndexMiddleware, addLineNumbers } from './addLineNumbers';
import { sidebar } from './sidebar';
import { worldsView } from './worldsView';
import { worlds } from './worlds';
import { keyBy } from 'lodash-es';

export class KarelIde extends LitElement {
  static get properties() {
    return {
      interpret: { type: Function },
      editor: { type: Object },
      class: { type: String },
      states: { type: Array },
      stateIndex: { type: Number },
      files: { type: Array },
      sidebarExpanded: { type: Boolean },
      world: { type: String },
      speed: { type: String },
      // beforeRun: { type: Function },
    };
  }
  sidebarExpanded = false;

  get files() {
    return this.editor?.listFiles();
  }
  onSave(e) {
    const modifier = window.navigator.platform.match('Mac')
      ? e.metaKey
      : e.ctrlKey;
    if (e.key === 's' && modifier) {
      this.editor.save(window.prompt('What shall we call your file?'), {
        language: this.language,
        world: this.world,
        date: new Date(),
      });
      this.requestUpdate();
      e.preventDefault();
    }
  }

  async updateLanguage(e) {
    this.editor.setLanguage(e.target.value);
  }
  languages = [
    { index: 0, value: 'python', text: 'Python' },
    { index: 1, value: 'javascript', text: 'JavaScript' },
  ];

  get language() {
    return this.editor?.language();
  }

  worlds = keyBy(worlds, 'name');

  updateWorld(world) {
    this.world = world;
    this.requestUpdate();
    this.reset();
    this.handleResize();
  }
  world = '10x10';

  async runCode() {
    const code = this.editor.getCode();
    const languageMap = { python: javascriptify, javascript: code => code };
    const transpiledCode = languageMap[this.language](code);

    const lineNumberCode = addLineNumbers(transpiledCode);
    const { getDiffs, getStates, engine } = recorderDecorator(
      karelModel(this.worlds[this.world].world),
      { ignoreUndefined: true, max: 2500 }
    );
    const karel = karelInterface(engine, {
      middleware: [addLineIndexMiddleware],
    });
    this.interpret(lineNumberCode, karel, pythonGlobals);
    this.states = getStates();
    this.diffs = getDiffs();
  }

  speed = 500;
  animateDiffs() {
    this.index = 0;
    let last;
    this.animating = true;
    const animator = ts => {
      if (last === undefined) last = ts;
      const timeDiff = ts - last;
      if (timeDiff > this.speed && this.animating) {
        if (!this.updateState(this.index++)) return (this.animating = false);
        last = ts;
      }
      requestAnimationFrame(animator);
    };
    console.log('called');
    requestAnimationFrame(animator);
  }

  updateState(value) {
    if (!this.states?.[value]) return false;
    this.stateIndex = value;
    this.diffIndex = value - 1;
    this.editor.highlightLine(
      this.diffs[this.diffIndex]?.lineNumber,
      'bg-gold'
    );
    draw(this.canvas, this.states[this.stateIndex]);
    return true;
  }

  async reset() {
    this.updateState(0);
    this.states = this.diffs = undefined;
  }

  static get styles() {
    return [
      tachyons,
      css`
        .square {
          width: min(50vw, 90vh);
          height: min(50vw, 90vh);
        }
        .mr-25 {
          margin-right: 25vw;
        }
      `,
    ];
  }
  get canvas() {
    return this.shadowRoot.querySelector('#canvas');
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
    draw(
      this.canvas,
      this.states?.[this.stateIndex] || this.worlds[this.world].world
    );
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this.handleResize.bind(this));
    window.addEventListener('keydown', this.onSave.bind(this), false);
  }
  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize.bind(this));

    super.disconnectedCallback();
  }

  firstUpdated() {
    this.handleResize();
  }

  render() {
    return html`
      <div class=${this.class /*+ (this.sidebarExpanded ? ' mr-25' : ' mr2')*/}>
        <div class="vh-10 overflow-hidden">
          <input
            class=""
            type="range"
            min="0"
            value=${this.speed}
            max=${500}
            step="1"
            @input=${e => {
              this.speed = 500 - e.target.value;
            }}
          />

          <select name="language" @change=${this.updateLanguage}>
            ${this.languages.map(
              ({ value, text }) =>
                html`<option
                  ?selected=${this.language === value}
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
          <button class="" @click=${this.reset}>Reset</button>
          ${worldsView(worlds, this.updateWorld.bind(this), this.world)}
        </div>
        <canvas id="canvas" class="square"></canvas>
        <input
          class="db w-100 gold"
          type="range"
          min="0"
          value=${this.stateIndex}
          max=${this.states ? this.states.length - 1 : 0}
          step="1"
          @input=${e => this.updateState(e.target.value)}
        />
      </div>
      ${sidebar(
        this.files?.map(fileName => this.editor.load(fileName)),
        this.sidebarExpanded,
        () => {
          this.sidebarExpanded = !this.sidebarExpanded;
          this.requestUpdate();
        },
        fname => {
          this.editor.setCode(this.editor.load(fname).code);
          alert('loaded!');
        },
        fname => {
          console.log('goodbye', fname);
          this.editor.remove(fname);
          this.requestUpdate();
        },
        this.editor?.currentFile()
      )}
    `;
  }
}
