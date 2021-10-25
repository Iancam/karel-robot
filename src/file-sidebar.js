import { css, html, LitElement } from 'lit-element';
import dayjs from 'dayjs/esm';
import tachyonsMinCss from './tachyons.min.css';

const file = ({
  name,
  language,
  world,
  date,
  getName,
  className,
  removeClicked,
  fileClicked,
}) => {
  return html` <div class=${className || ''}>
    <div
      @click=${() => removeClicked(name)}
      class="hover-bg-black bg-animate pointer fr mt0 bg-dark-red w2 h2 bt br"
    ></div>

    <div
      class="ba b--black bg-black-10 pa3 link avenir hover-orange pointer "
      @click=${() => fileClicked(name)}
    >
      <span
        ?contenteditable=${getName}
        id=${getName ? 'saveFileName' : ''}
        class="f3 mt0"
        >${name}</span
      >
      <br />
      <div class="f5 dib mt2">
        ${language}
        <span class="f7 fw1 italic"
          >${dayjs(date).format('dddd [the] D [of] MMM YYYY')}</span
        >
      </div>
    </div>
  </div>`;
};

export class FileSidebar extends LitElement {
  static get properties() {
    return { editor: { type: Object }, setToast: { type: Function } };
  }

  get editor() {
    return this._editor;
  }

  set editor(editor) {
    const old = this._editor;
    this._editor = editor;
    this.requestUpdate('editor', old);
  }

  sidebarExpanded = false;

  static get styles() {
    return [
      tachyonsMinCss,
      css`
        .marginFix {
          margin-bottom: -4px;
        }
      `,
    ];
  }

  get saveFileNameElement() {
    return this.shadowRoot.querySelector('#saveFileName');
  }

  onSave(e) {
    const modifier = window.navigator.platform.match('Mac')
      ? e.metaKey
      : e.ctrlKey;
    if (e.key === 's' && modifier) {
      e.preventDefault();
      this.openSave();
    }
  }

  openSave() {
    !this.sidebarExpanded && this.toggleSidebar();
    this.newFile = true;
    const filename = window.prompt('what should we save it as?');
    if (!filename) return;
    // wait for the saveFileNameElement to show
    this.editor.save(filename, {
      date: new Date(),
      world: this.world,
    });
    this.setToast('We saved your file: ' + filename + '!');
    this.requestUpdate();
  }

  handleExitClick(ev) {
    const container = this.shadowRoot.querySelector('#sidebarContainer');
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const clickedInSidebar =
      ev.clientX > 0 &&
      ev.clientX < width &&
      ev.clientY > 0 &&
      ev.clientY < height;
    if (!clickedInSidebar) {
      this.toggleSidebar();
    }
  }

  toggleSidebar = () => {
    this.sidebarExpanded = !this.sidebarExpanded;
    if (this.sidebarExpanded) {
      this._handler = this.handleExitClick.bind(this);
      window.addEventListener('click', this._handler, false);
    }
    if (!this.sidebarExpanded) {
      this.newFile = false;
      console.log('removing');
      window.removeEventListener('click', this._handler, false);
    }
    this.requestUpdate();
  };

  loadFile = fname => {
    const { world } = this.editor.load(fname);
    this.updateWorld(world);
    this.setToast('tada!');
    this.requestUpdate();
    this.toggleSidebar();
  };

  deleteFile = fname => {
    if (
      window.confirm(
        'This will delete your file, friend.\n Are you Sure you want to do that?'
      )
    ) {
      this.setToast(
        'Oh, goodbye then ' + ((Math.random() > 0.5 ? 'Mr. ' : 'Ms. ') + fname)
      );
      this.editor?.remove(fname);
      this.requestUpdate();
    }
  };

  render() {
    return html`
      <div
        id="sidebarContainer"
        class="vh-100 v overflow-scroll ba b-black bg-near-white fixed top-0 left-0 ${this
          .sidebarExpanded
          ? 'w-25'
          : 'w2'}"
      >
        <div class="dib marginFix">
          <div
            @click=${this.toggleSidebar}
            class="${this.sidebarExpanded
              ? 'bg-gold hover-bg-orange fl'
              : 'bg-orange hover-bg-gold'} bg-animate pointer w2 h2"
          ></div>
          <div
            @click=${this.openSave}
            class=${(this.sidebarExpanded ? 'fl ' : '') +
            'bg-green hover-bg-yellow bg-animate pointer w2 h2'}
          ></div>
        </div>
        ${this.sidebarExpanded
          ? this.editor
              ?.listFiles()
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map(f =>
                file({
                  ...f,
                  fileClicked: this.loadFile,
                  removeClicked: this.deleteFile,
                })
              )
          : ''}
      </div>
    `;
  }
}
customElements.define('file-sidebar', FileSidebar);
