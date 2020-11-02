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
  get saveFileNameElement() {
    return this.shadowRoot.querySelector('#saveFileName');
  }

  onSave(e) {
    const modifier = window.navigator.platform.match('Mac')
      ? e.metaKey
      : e.ctrlKey;
    console.log(e);
    if (e.key === 's' && modifier) {
      e.preventDefault();
      this.sidebarExpanded = true;
      this.newFile = true;
      setTimeout(() => {
        this.whileSaving();
      }, 40);

      this.requestUpdate();
    }
  }
  saveCommitted(e) {
    if (e.key == 'Enter') {
      e.preventDefault();
      const filename = this.saveFileNameElement.textContent;
      this.editor.save(filename, {
        language: this.language,
        date: new Date(),
        world: this.world,
      });
      window.removeEventListener(
        'keydown',
        this.saveCommitted.bind(this),
        false
      );
      this.saveFileNameElement.blur();
      this.sidebarExpanded = false;
      this.newFile = false;
      this.toast('We saved your file: ' + filename + '!');

      this.requestUpdate();
    } else if (e.key === 'Escape') {
      this.sidebarExpanded = false;
      this.newFile = false;
    }
  }

  whileSaving() {
    this.saveFileNameElement.focus();

    window.addEventListener('keydown', this.saveCommitted.bind(this), false);
  }
  toast(msg) {
    this.toastmsg = msg;
    const closeToast = () => {
      this.toastmsg = undefined;
      this.requestUpdate();
    };
    setTimeout(closeToast, 3000);
  }
  async updateLanguage(value) {
    this.editor.setLanguage(value);
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
    this.reset();
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
        .left-50 {
          left: 50%;
        }
        .left-neg-50 {
          left: -50%;
        }
        .top-10 {
          top: 10vh;
        }
        .show {
          visibility: visible; /* Show the snackbar */
          /* Add animation: Take 0.5 seconds to fade in and out the snackbar.
  However, delay the fade out process for 2.5 seconds */
          -webkit-animation: fadein 0.5s, fadeout 0.5s 2.5s;
          animation: fadein 0.5s, fadeout 0.5s 2.5s;
        }

        /* Animations to fade the snackbar in and out */
        @-webkit-keyframes fadein {
          from {
            bottom: 0;
            opacity: 0;
          }
          to {
            bottom: 30px;
            opacity: 1;
          }
        }

        @keyframes fadein {
          from {
            bottom: 0;
            opacity: 0;
          }
          to {
            bottom: 30px;
            opacity: 1;
          }
        }

        @-webkit-keyframes fadeout {
          from {
            bottom: 30px;
            opacity: 1;
          }
          to {
            bottom: 0;
            opacity: 0;
          }
        }

        @keyframes fadeout {
          from {
            bottom: 30px;
            opacity: 1;
          }
          to {
            bottom: 0;
            opacity: 0;
          }
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
    window.removeventListener('keydown', this.onSave.bind(this), false);
    super.disconnectedCallback();
  }

  firstUpdated() {
    this.handleResize();
  }

  render() {
    if (this.saving) {
      this.whileSaving();
    }
    return html`
      <div class="absolute left-50 top-10 ${this.toastmsg ? 'show' : 'dn'}">
        <div class="orange pa2 br3 ba b--gray avenir left-neg-50 relative">
          ${this.toastmsg}
        </div>
      </div>

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

          <select
            name="language"
            @change=${e => this.updateLanguage(e.target.value)}
          >
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
          @input=${e => {
            this.animating = false;
            return this.updateState(e.target.value);
          }}
        />
      </div>
      ${sidebar(
        [...this.files].map(fileName => this.editor.load(fileName)),
        this.sidebarExpanded,
        () => {
          this.sidebarExpanded = !this.sidebarExpanded;
          this.requestUpdate();
        },
        fname => {
          const { language, world, code } = this.editor.load(fname);
          this.editor.setCode(code);
          this.updateLanguage(language);
          this.updateWorld(world);
          this.toast('tada!');
          this.requestUpdate();
          this.sidebarExpanded = false;
        },
        fname => {
          this.toast(
            'oh, goodbye then ' + (Math.random() > 0.5 ? 'mr.' : 'ms.' + fname)
          );
          console.log('goodbye', fname);
          this.editor.remove(fname);
          this.requestUpdate();
        },
        this.editor?.currentFile(),
        this.language,
        this.newFile
      )}
    `;
  }
}
