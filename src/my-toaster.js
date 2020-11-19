import { LitElement, html, css } from 'lit-element';
import { show } from './show.css';
import tachyonsMinCss from './tachyons.min.css';

export class MyToaster extends LitElement {
  static get properties() {
    return {
      msg: { type: String },
      timeout: { type: Number },
    };
  }

  set msg(msg) {
    const oldVal = this._msg;
    this._msg = msg;
    this.requestUpdate('msg', oldVal);
    this.timeId && clearTimeout(this.timeId);
    this.timeId = setTimeout(() => {
      this._msg = undefined;
      this.requestUpdate();
    }, this.timeout);
  }

  get msg() {
    return this._msg;
  }

  static get styles() {
    return [
      css`
        .left-50 {
          left: 50%;
        }
        .left-neg-50 {
          left: -50%;
        }
        .top-10 {
          top: 10vh;
        }
      `,
      show,
      tachyonsMinCss,
    ];
  }

  timeout = 10000;
  render() {
    return html`<div
      class="absolute left-50 top-0 mt2 ${this.msg ? 'show' : 'dn'}"
    >
      <div class="orange pa2 br3 ba b--gray avenir left-neg-50 relative">
        ${this.msg}
      </div>
    </div> `;
  }
}
customElements.define('my-toaster', MyToaster);
