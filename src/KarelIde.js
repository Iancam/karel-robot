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
      title: { type: String },
      page: { type: String },
    };
  }
  constructor() {
    super();
  }
  get canvas() {
    return this.shadowRoot.querySelector('#canvas');
  }
  get context() {
    return this.canvas.getContext('2d');
  }
  get speed() {
    return 0.4;
  }
  get maxSpeed() {
    return 500;
  }
  get starterWorld() {
    return {
      karel: { cell: [0, 0], direction: 'north' },
      dimensions: [10, 10],
      beepers: [],
    };
  }
  get starterCode() {
    return `function main(){
      move()
      move()
      turnLeft()
      putBeeper()
      move()
      if(frontIsClear()){
        move()
      } else if(facingEast()){
        putBeeper()
      }

    }`;
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

  theThing() {
    const { getDiffs, getStates, engine } = recorderDecorator(
      karelModel(this.starterWorld),
      { ignoreUndefined: true, max: 2500 }
    );

    const karel = karelInterface(engine);
    _runCode(this.starterCode, karel);
    const diffs = getDiffs();
    const state = getStates();
    let i = 0;
    const intervalID = setInterval(() => {
      console.log(!(state[i]);

      draw(this.canvas, state[i++]);
      !state[i] && clearInterval(intervalID);
    }, 500);
  }

  render() {
    return html`
      <div class="w-100">
        <textarea name="ide" cols="30" rows="10" class="w-40 ma2 h-50 fl">
          this is *like* an ide
        </textarea
        >
        <button @click=${this.theThing}>do the thing</button>
        <canvas id="canvas" class="square fr"></canvas>
      </div>
    `;
  }
}
