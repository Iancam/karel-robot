import { html } from 'lit-element';
import dayjs from 'dayjs/esm';

export function sidebar(files, expanded, fileClicked, expandClicked) {
  return html`
    <div class="">
      <div
        class="vh-100 v overflow-scroll bg-black-05 fixed top-0 right-0 ${expanded
          ? 'w-25'
          : 'w2'}"
      >
        <div
          @click=${expandClicked}
          class="${expanded
            ? 'bg-orange hover-bg-gold'
            : 'bg-gold hover-bg-orange'} bg-animate pointer w2 h2"
        ></div>

        ${expanded
          ? files.map(({ name, language, world, date }) => {
              return html` <div
                class="ba b--black bg-black-10 pa3 link underline hover-orange pointer"
                @click=${() => fileClicked(name)}
              >
                <h3>${name}</h3>
                <div class="f4 dib">${language}</div>
                <div class="dib f6 fw1 fr italic hover-orange avenir">
                  ${dayjs(date).format('dddd [the] D[,] MMM YYYY')}
                </div>
              </div>`;
            })
          : ''}
      </div>
    </div>
  `;
}
