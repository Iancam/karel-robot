import { LitElement, html, css } from 'lit-element';
import tachyons from './tachyons.min.css';
import draw from './karelView';
import './file-sidebar';
import { worldsView } from './worldsView';
import { worldsFactory } from './worlds';
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
      displayAltCanvas: { type: Boolean },
      showingLessons: { type: Boolean },
    };
  }

  worlds = worldsFactory(() => {
    this.index = undefined;
    this.handleResize.bind(this)();
  });

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

  async handleRun() {
    const { states, diffs } = codeToStates(
      this.editor.getCode(),
      this.language,
      this.worlds.currentWorld
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

  get canvasAlt() {
    return this.shadowRoot.querySelector('#canvasAlt');
  }

  // allows canvas sizing to be determined by css
  handleResize(canvas) {
    canvas ??= this.canvas;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    // If it's resolution does not match change it
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const world = this.worlds.currentWorld;
    this.index !== undefined
      ? this.index(this.index())
      : draw(this.canvas, world);
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', () => {
      this.handleResize(this.canvas);
      this.handleResize(this.canvasAlt);
    });
  }
  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize.bind(this));
    window.removeventListener('keydown', this.onSave.bind(this), false);
    super.disconnectedCallback();
  }

  overlay(karelState) {
    this.handleResize(this.canvasAlt);
    draw(this.canvasAlt, karelState);

    this.displayAltCanvas = true;
  }

  hideOverlay() {
    console.log('da di la');
    this.displayAltCanvas = false;
  }

  firstUpdated() {
    this.handleResize();
  }

  render() {
    const showSolution = ({ start, solution }) => html`<div
      @mouseover=${() => this.overlay(solution?.world)}
      @mouseout=${() => this.hideOverlay()}
      @click=${() => this.worlds.select(start.name)}
      class="dark-gray bg-yellow hover-bg-light-yellow dib pa2 mr2"
    >
      ${start.name}
    </div>`;

    const lessonsToggle = html`<div
      @click=${() => (this.showingLessons = !this.showingLessons)}
      class="dark-gray bg-orange hover-bg-light-orange dib pa2 mr2 ttc"
    >
      ${this.showingLessons ? 'worlds' : 'lessons'}
    </div>`;

    const header = html`<div
      id="header"
      class="bg-black-80 bg-animate w-100 dib fixed pa3 h3 left-1 ml1 flex v-mid near-white avenir"
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
        class="mr2 pointer hover-bg-yellow bg-animate br0 b--none"
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

      <!-- right hand side -->
      <div class="order-2 mr2 ml-auto">
        ${this.worlds.lessonOptions.map(option => showSolution(option))}
        <label class="mr2" htmlFor="">speed</label>
        <input
          class="mr2"
          type="range"
          min="0"
          step="1"
          value=${this.speed ? this.speed() : 0}
          max=${500}
          @input=${e => this.speed?.(500 - e.target.value)}
        />

        ${worldsView({
          worlds: (this.showingLessons
            ? this.worlds.lessons
            : this.worlds.worlds
          ).map(lesson => lesson.id),
          onSelect: this.worlds.select.bind(this),
          selected: this.worlds.currentId,
          className: 'mr3 pa1 br0',
        })}
        ${lessonsToggle}
      </div>
    </div>`;

    return html`
      ${header}
      <div class=${this.class + ' mt5'}>
        <canvas
          id="canvasAlt"
          class="square ${this.displayAltCanvas
            ? 'bg-light-yellow'
            : 'absolute o-0'}"
        ></canvas>
        <canvas
          id="canvas"
          class="square ${this.displayAltCanvas ? 'dn' : ''}"
        ></canvas>
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
        .updateWorld=${this.worlds.select.bind(this)}
        .world=${this.worlds.currentId}
      ></file-sidebar>
    `;
  }
}
