import { LitElement, html, css } from 'lit-element';
import tachyons from '../css/tachyons.min.css';
import karelInterface from './karelInterface';
import karelModel from './karelModel';
import draw from './karelView';
import { recorderDecorator } from './recorderDecorator';

export class KarelIde extends LitElement {
  static get properties() {
    return {
      class: { type: String },
    };
  }
  get canvas() {
    return this.shadowRoot.querySelector('#canvas');
  }

  get starterWorld() {
    return {
      karel: { cell: [0, 0], direction: 'e' },
      dimensions: [10, 10],
      beepers: [],
    };
  }

  starterCode = `function main(){
      turnLeft()
      move()
      move()
      turnRight()
      putBeeper()
      move()
      move()
    }`;

  runCode() {
    const { getDiffs, getStates, engine } = recorderDecorator(
      karelModel(this.starterWorld),
      { ignoreUndefined: true, max: 2500 }
    );
    const karel = karelInterface(engine);
    // because this function uses a 'with' statement,
    // this code cannot be imported in the usual way,
    // and has to come from global scope
    _runCode(this.starterCode, karel);

    this.states = getStates();
    console.log(this.states.map(state => state.karel.direction));
    console.log(getDiffs());
    this.stateIndex = 0;
    const intervalID = setInterval(() => {
      draw(this.canvas, this.states[this.stateIndex++]);
      !this.states[this.stateIndex] && clearInterval(intervalID);
    }, 500);
  }

  updateState(e) {
    if (!this.states) return;
    const percent = e.target.value * 0.01;
    this.stateIndex = Math.floor((this.states.length - 1) * percent);
    draw(this.canvas, this.states[this.stateIndex]);
  }

  static get styles() {
    return [
      tachyons,
      css`
        .square {
          width: min(50vw, 100vh);
          height: min(50vw, 100vh);
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
    draw(this.canvas, (this.states && this.states[0]) || this.starterWorld);
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

  render() {
    return html`
      <div class="w-100">
        <textarea name="ide" cols="30" rows="10" class="w-40 ma2 h-50 fl">
          ${this.starterCode}
        </textarea
        >
        <input
          type="range"
          min="0"
          max="100"
          @input=${this.updateState}
          @change=${() => console.log(this.states[this.stateIndex])}
        />
        <button @click=${this.runCode}>do the thing</button>
        <canvas id="canvas" class="square fr"></canvas>
      </div>
    `;
  }
}
