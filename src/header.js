import { worldsView } from './worldsView';
import { html } from 'lit-element';
export const header = async ({
  handleRun,
  reset,
  toast,
  updateLanguage,
  languages,
  language,
  worlds,
  speed,
  // showingLessons,
  // toggleShowingLessons,
  overlay,
}) => {
  // const lessonsToggle = html`<div
  //   @click=${toggleShowingLessons}
  //   class="dark-gray bg-orange hover-bg-light-orange dib pa2 mr2 ttc"
  // >
  //   ${showingLessons ? 'worlds' : 'lessons'}
  // </div>`;
  // const showSolution = solution => html`<div
  //   @mouseover=${() => overlay(solution?.world)}
  //   @mouseout=${() => overlay()}
  //   @click=${() => worlds.select(solution.id)}
  //   class="dark-gray bg-yellow hover-bg-light-yellow dib pa2 mr2"
  // >
  //   ${solution.id}
  // </div>`;

  const languagesSelector = html`<select
    class="mr2"
    name="language"
    @change=${e => updateLanguage(e.target.value)}
  >
    ${languages.map(
      ({ value, text }) => html`<option
        ?selected=${language === value}
        value=${value}
      >
        ${text}
      </option>`
    )}
  </select>`;
  return html`<div
    id="header"
    class="bg-black-80 bg-animate w-100 dib fixed pa3 h3 left-1 ml1 flex v-mid near-white avenir"
  >
    <button
      class="br-100 dib h2 w2 pa2 bg-near-white tc a-ic mr2 pointer hover-bg-yellow bg-animate b--none"
      @click=${handleRun}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 17 17"
        focusable="false"
        aria-hidden="true"
      >
        <path d="M17 8.5L0 17V0z" fill="#000000" fill-rule="evenodd"></path>
      </svg>
    </button>
    <button
      class="mr2 pointer hover-bg-yellow bg-animate br0 b--none"
      @click=${reset}
    >
      Reset
    </button>
    ${languagesSelector}
    <my-toaster .msg=${toast}></my-toaster>

    <!-- right hand side -->
    <div class="order-2 mr2 ml-auto">
      <label class="mr2" htmlFor="">speed</label>
      <input
        class="mr2"
        type="range"
        min="0"
        step="1"
        value=${speed ? speed() : 0}
        max=${500}
        @input=${e => speed?.(500 - e.target.value)}
      />

      ${worldsView({
        worlds: worlds.worlds.map(lesson => lesson.id),
        onSelect: worlds.select,
        selected: worlds.currentId,
        className: 'mr3 pa1 br0',
      })}
    </div>
  </div>`;
};
