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
    console.log({ world, worlds: this.worlds });
    this.world = world;
    this.index = undefined;
    this.handleResize();
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
        state.error
          ? (this.toast = { msg: state.error, error: true })
          : draw(this.canvas, state);
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
          width: min(50vw, 80vh);
          height: min(50vw, 80vh);
        }
        .mr-25 {
          margin-right: 25vw;
        }
        .vw-100 {
          width: 100vw;
        }
        .ma-auto {
          margin: auto;
        }
        .a-ic {
          align-items: center;
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
    const world = this.worlds[this.world].world;
    this.index !== undefined
      ? this.index(this.index())
      : draw(this.canvas, world);
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
      <div
        id="header"
        class="bg-black-80 hover-bg-gold bg-animate w-100 dib fixed pa3 h3 left-0 flex v-mid near-white avenir"
      >
        <button
          class="br-100 dib h2 w2 pa2 bg-near-white tc a-ic mr2 pointer hover-bg-yellow bg-animate b--none"
          @click=${this.handleRun}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 17 17"
            focusable="false"
            aria-hidden="true"
          >
            <path d="M17 8.5L0 17V0z" fill="#000000" fill-rule="evenodd"></path>
          </svg>
        </button>
        <button
          class="mr2 pointer hover-bg-yellow bg-animate br2 b--none"
          @click=${this.reset}
        >
          Reset
        </button>
        <my-toaster .msg=${this.toast}></my-toaster>

        <select
          class="mr2"
          name="language"
          @change=${e => this.updateLanguage(e.target.value)}
        >
          ${this.languages.map(
            ({ value, text }) =>
              html`<option ?selected=${this.language === value} value=${value}>
                ${text}
              </option>`
          )}
        </select>
        <div class="order-2 mr2 ml-auto">
          <label class="mr2" htmlFor="">speed</label>
          <input
            class="mr2 mr2"
            type="range"
            min="0"
            step="1"
            value=${this.speed ? this.speed() : 0}
            max=${500}
            @input=${e => this.speed?.(500 - e.target.value)}
          />

          ${worldsView({
            worlds,
            onSelect: this.updateWorld.bind(this),
            selected: this.world,
            className: 'mr3',
          })}
        </div>
      </div>
      <div
        class=${this.class +
        ' mt5' /*+ (this.sidebarExpanded ? ' mr-25' : ' mr2')*/}
      >
        <div class="vh-10 overflow-hidden"></div>
        <canvas id="canvas" class="square"></canvas>
        <div class="db w-100">
          <input
            class="w-100"
            type="range"
            min="0"
            value=${this.index ? this.index() : 0}
            max=${this.indexes || 0}
            step="1"
            @input=${e => this.index?.(e.target.value)}
          />
        </div>
      </div>
      <file-sidebar
        .setToast=${toast => (this.toast = { msg: toast })}
        .editor=${this.editor}
        .updateWorld=${this.updateWorld.bind(this)}
        .world=${this.world}
      ></file-sidebar>
    `;
  }
}
