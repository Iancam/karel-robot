import { LitElement, html, css } from 'lit-element';
import tachyons from './tachyons.min.css';
import draw from './karelViewModel';
import './file-sidebar';
import { worldsFactory } from './worlds';
import { show } from './show.css';
import { header } from './header';
import { karelView } from './karelView';
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

  async handleRun() {
    try {
      this.reset && this.reset();
      const { states, diffs } = codeToStates(
        this.editor.getCode(),
        this.language,
        this.worlds.currentWorld
      );
      const handleTransition = (state, diff) => {
        this.editor.highlightLine(diff?.lineNumber, 'bg-gold');
        state.error
          ? (this.toast = { msg: state.error, error: true })
          : draw(this.canvas, state);
        this.requestUpdate();
      };
      const { updateState, indexes } = updateStatery(
        states,
        diffs,
        handleTransition
      );
      const { animate, reset, speed, index } = animatery(500, updateState);
      animate();
      this.reset = reset;
      this.indexes = indexes;
      console.log(this.speed?.());
      this.speed = makeUpdator(speed, 'speed', this.speed?.()).bind(this);
      this.index = makeUpdator(index, 'index', 0).bind(this);
      this.requestUpdate();
    } catch (error) {
      this.toast = { msg: error.name };
      console.error(error);
    }
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
    if (karelState) {
      this.handleResize(this.canvasAlt);
      draw(this.canvasAlt, karelState);

      this.displayAltCanvas = true;
    } else {
      this.displayAltCanvas = false;
    }
  }

  firstUpdated() {
    this.handleResize();
  }

  render() {
    return html`
      ${header({
        handleRun: this.handleRun,
        reset: this.reset,
        toast: this.toast,
        updateLanguage: this.updateLanguage,
        languages: this.languages,
        language: this.language,
        speed: this.speed,
        showingLessons: this.showingLessons,
        toggleShowingLessons: () =>
          (this.showingLessons = !this.showingLessons),
        worlds: this.worlds,
        overlay: this.overlay.bind(this),
      })}
      ${karelView({
        displayAltCanvas: this.displayAltCanvas,
        index: this.index,
        indexes: this.indexes,
      })}
      <file-sidebar
        .setToast=${toast => (this.toast = { msg: toast })}
        .editor=${this.editor}
        .updateWorld=${this.worlds.select.bind(this)}
        .world=${this.worlds.currentId}
      ></file-sidebar>
    `;
  }
}
