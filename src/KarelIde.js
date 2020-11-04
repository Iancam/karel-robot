import { LitElement, html, css } from 'lit-element';
import tachyons from './tachyons.min.css';
import draw from './karelView';
import './file-sidebar';
import { worldsView } from './worldsView';
import { worlds } from './worlds';
import { keyBy } from 'lodash-es';
import { show } from './show.css';
import './my-toaster';
import { animatery, makeUpdator, updateStatery } from './animationUtils';
import { codeToStates } from './karelExecutor';

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
      toast: { type: String },
    };
  }

  get files() {
    return this.editor?.listFiles();
  }

  async updateLanguage(value) {
    this.editor?.setLanguage(value);
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
    this.handleResize();
    this.reset?.();
  }
  world = '10x10';

  async handleRun() {
    const { states, diffs } = codeToStates(
      this.editor.getCode(),
      this.language,
      this.worlds[this.world].world
    );
    const { updateState, indexes } = updateStatery(
      states,
      diffs,
      (state, diff) => {
        this.editor.highlightLine(diff?.lineNumber, 'bg-gold');
        draw(this.canvas, state);
        this.requestUpdate();
      }
    );
    const { animate, reset, speed, index } = animatery(500, updateState);
    animate();
    this.reset = reset;
    this.indexes = indexes;
    this.speed = makeUpdator(speed, 'speed', 0).bind(this);
    this.index = makeUpdator(index, 'index', 0).bind(this);
    this.requestUpdate();
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
        .vw-100 {
          width: 100vw;
        }
      `,
      show,
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
    return html`
      <div class=${this.class /*+ (this.sidebarExpanded ? ' mr-25' : ' mr2')*/}>
        <div class="vh-10 overflow-hidden">
          <my-toaster msg=${this.toast ?? ''}></my-toaster>
          <input
            class=""
            type="range"
            min="0"
            value=${this.speed ? this.speed() : 0}
            max=${500}
            step="1"
            @input=${e => this.speed?.(500 - e.target.value)}
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
          <button @click=${this.handleRun}>Run</button>
          <button class="" @click=${this.reset}>Reset</button>
          ${worldsView(worlds, this.updateWorld.bind(this), this.world)}
        </div>
        <canvas id="canvas" class="square"></canvas>
        <input
          class="db w-100 gold"
          type="range"
          min="0"
          value=${this.index ? this.index() : 0}
          max=${this.indexes || 0}
          step="1"
          @input=${e => this.index?.(e.target.value)}
        />
      </div>
      <file-sidebar
        .setToast=${toast => (this.toast = toast)}
        .editor=${this.editor}
      ></file-sidebar>
    `;
  }
}
