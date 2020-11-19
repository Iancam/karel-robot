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
    this.sidebarExpanded = true;
    this.newFile = true;
    // wait for the saveFileNameElement to show
    const saveCommitted = e => {
      if (e.key == 'Enter') {
        e.preventDefault();
        const filename = this.saveFileNameElement.textContent;
        this.editor.save(filename, {
          language: this.language,
          date: new Date(),
          world: this.world,
        });
        this.setToast('We saved your file: ' + filename + '!');
        this.endSave();
      } else if (e.key === 'Escape') {
        this.endSave();
      }
    };
    this.requestUpdate().then(() => {
      this.saveFileNameElement.focus();
      const bound = saveCommitted.bind(this);
      this._saveCommittedRef = bound;
      window.addEventListener('keydown', bound, false);
    });
  }

  endSave() {
    window.removeEventListener('keydown', this._saveCommittedRef, false);
    this.sidebarExpanded = false;
    this.newFile = false;
    this.saveFileNameElement.blur();
    this.saveFileNameElement.textContent = '';
    this.requestUpdate();
  }
  toggleSidebar = () => {
    this.sidebarExpanded = !this.sidebarExpanded;
    if (!this.sidebarExpanded) {
      this.newFile = false;
    }
    this.requestUpdate();
  };

  loadFile = fname => {
    const { language, world, code } = this.editor.load(fname);
    this.editor.setCode(code);
    this.editor.setLanguage(language);
    this.updateWorld(world);
    this.setToast('tada!');
    this.requestUpdate();
    this.sidebarExpanded = false;
  };

  deleteFile = fname => {
    console.log(fname);
    this.setToast(
      'Oh, goodbye then ' + ((Math.random() > 0.5 ? 'Mr. ' : 'Ms. ') + fname)
    );
    this.editor?.remove(fname);
    this.requestUpdate();
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this.onSave.bind(this), false);
  }
  disconnectedCallback() {
    window.removeventListener('keydown', this.onSave.bind(this), false);
    super.disconnectedCallback();
  }
  render() {
    return html`
      <div class="">
        <div
          class="vh-100 v overflow-scroll ba b-black bg-near-white fixed top-0 right-0 ${this
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
          ${file({
            name: '',
            getName: true,
            date: new Date(),
            language: this.editor?.language(),
            className: this.newFile ? 'db' : 'dn',
            removeClicked: this.endSave.bind(this),
            fileClicked: () => this.saveFileNameElement.focus(),
          })}
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
      </div>
    `;
  }
}
customElements.define('file-sidebar', FileSidebar);
