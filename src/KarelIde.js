import { LitElement, html, css } from 'lit-element';
import tachyons from './tachyons.min.css';
import draw from './karelViewModel';
import './file-sidebar';
import { worldsFactory, worldsFactoryFB } from './worlds';
import { show } from './show.css';
import { header } from './header';
import { karelView } from './karelView';
import './my-toaster';
import { animatery, makeUpdator, updateStatery } from './animationUtils';
import { codeToStates } from './karelExecutor';
import { until } from 'lit-html/directives/until.js';
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
      _toast: { type: String },
      displayAltCanvas: { type: Boolean },
      showingLessons: { type: Boolean },
      index: { type: Number },
    };
  }

  worlds = worldsFactoryFB(() => {
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
    {
      index: 0,
      value: 'python',
      text: 'Python',
    },
    {
      index: 1,
      value: 'javascript',
      text: 'JavaScript',
    },
  ];

  get language() {
    return this.editor?.language();
  }
  set toast(val) {
    this._toast = val;
    setTimeout(() => {
      this._toast = undefined;
    }, 3000);
  }

  get toast() {
    return this._toast;
  }

  async handleRun() {
    try {
      this.reset && this.reset();
      const { states, diffs } = codeToStates(
        this.editor.getCode(),
        this.language,
        (await this.worlds).currentWorld
      );
      const handleTransition = (state, diff) => {
        this.editor.highlightLine(diff?.lineNumber, 'bg-gold');
        state.error
          ? (this.toast = { msg: state.error, error: true })
          : draw(this.canvas, state);
        this.state = state;
        this.requestUpdate();
      };
      const { updateState, indexes } = updateStatery(
        states,
        diffs,
        handleTransition
      );
      const { animate, reset, speed, index } = animatery(
        this.speed?.() || 300,
        updateState
      );
      animate();
      this.reset = reset;
      this.indexes = indexes;
      this.speed = makeUpdator(speed, 'speed', this.speed?.()).bind(this);
      this.index = makeUpdator(index, 'index', 0).bind(this);
      this.requestUpdate();
    } catch (error) {
      this.toast = { msg: error.name, error: true };
      console.log(error.stack, Object.keys(error));
    }
  }

  static get styles() {
    return [
      tachyons,
      css`
        .square {
          width: min(50vw, 75vh);
          height: min(50vw, 75vh);
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

  get canvasAlt() {
    return this.shadowRoot.querySelector('#canvasAlt');
  }

  overlay(karelState) {
    if (karelState) {
      this.handleResize(this.canvasAlt);
      draw(this.canvasAlt, karelState);

      this.displayAltCanvas = true;
    } else {
      this.displayAltCanvas = false;
    }
  }

  get canvas() {
    return this.shadowRoot.querySelector('#canvas');
  }

  // allows canvas sizing to be determined by css
  async handleResize(canvas) {
    canvas ??= this.canvas;
    if (canvas === null) {
      console.warn('null canvas');
      return;
    }
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    // If it's resolution does not match change it
    const resolutionMatch = canvas.width === width && canvas.height === height;
    if (!resolutionMatch) {
      canvas.width = width;
      canvas.height = height;
    }
    const world = this.state || (await this.worlds).currentWorld;
    // this.index !== undefined && this.index(this.index());
    draw(this.canvas, world);
  }

  connectedCallback() {
    super.connectedCallback();
    this._resizers = (() => {
      this.handleResize(this.canvas);
      this.handleResize(this.canvasAlt);
    }).bind(this);
    window.addEventListener('resize', this._resizers);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this._resizers);
    super.disconnectedCallback();
  }

  firstUpdated() {
    this.handleResize(this.canvas);
  }

  render() {
    const headerr = async () =>
      header({
        handleRun: this.handleRun,
        reset: this.reset,
        toast: this.toast,
        updateLanguage: this.updateLanguage.bind(this),
        languages: this.languages,
        language: this.language,
        speed: this.speed,
        showingLessons: this.showingLessons,
        toggleShowingLessons: () =>
          (this.showingLessons = !this.showingLessons),
        worlds: await this.worlds,
        overlay: this.overlay.bind(this),
      });
    const sidebarr = async () =>
      html`<file-sidebar
        .setToast=${toast => (this.toast = { msg: toast })}
        .editor=${this.editor}
        .updateWorld=${(await this.worlds).select.bind(this)}
        .world=${(await this.worlds).currentId}
      ></file-sidebar>`;

    return html`${until(headerr(), 'loading')}
    ${karelView({
      displayAltCanvas: this.displayAltCanvas,
      index: this.index,
      indexes: this.indexes,
    })}
    ${until(sidebarr(), 'loading')}`;
  }
}
