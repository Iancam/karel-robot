import { LitElement, html, css } from 'lit-element';
import { show } from './show.css';
import tachyonsMinCss from './tachyons.min.css';

export class MyToaster extends LitElement {
  static get properties() {
    return {
      msg: { type: Object },
      timeout: { type: Number },
    };
  }

  set msg(msg) {
    const oldVal = this._msg;
    this._msg = msg;
    this.requestUpdate('msg', oldVal);
    this.timeId && clearTimeout(this.timeId);
    if (this._msg) {
      this.timeId = setTimeout(() => {
        this._msg = undefined;
        this.requestUpdate();
      }, this.timeout);
    }
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

  timeout = 3000;
  render() {
    return html`<div
      class="absolute left-50 top-0 mt2 ${this.msg ? 'show' : 'dn'} "
    >
      <div
        class="${this.msg?.error
          ? 'red b ttu'
          : 'orange'} pa2 br3 ba b--gray avenir left-neg-50 relative"
      >
        ${this.msg?.msg}
      </div>
    </div> `;
  }
}
customElements.define('my-toaster', MyToaster);
