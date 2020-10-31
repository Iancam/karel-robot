import { html } from 'lit-element';
import dayjs from 'dayjs/esm';

export function sidebar(
  files,
  expanded,
  expandClicked,
  fileClicked,
  removeClicked,
  currentFileName
) {
  console.log(currentFileName);
  return html`
    <div class="">
      <div
        class="vh-100 v overflow-scroll ba b-black bg-near-white fixed top-0 right-0 ${expanded
          ? 'w-25'
          : 'w2'}"
      >
        <div
          @click=${expandClicked}
          class="${expanded
            ? 'bg-gold hover-bg-orange'
            : 'bg-orange hover-bg-gold'} bg-animate pointer w2 h2"
        ></div>

        ${expanded
          ? files?.map(({ name, language, world, date }) => {
              return html` <div
                  @click=${() => removeClicked(name)}
                  class="hover-bg-black bg-animate pointer fr mt0 bg-dark-red w2 h2 bt br"
                ></div>

                <div
                  class="ba b--black bg-black-10 pa3 link avenir hover-orange pointer "
                  @click=${() => fileClicked(name)}
                >
                  <span class="f3 mt0">${name}</span>
                  <br />
                  <div class="f5 dib mt2">
                    ${language}
                    <span class="f7 fw1 italic"
                      >${dayjs(date).format('dddd [the] D [of] MMM YYYY')}</span
                    >
                  </div>
                </div>`;
            })
          : ''}
      </div>
    </div>
  `;
}
