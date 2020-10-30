// worldsView.js;
import { html } from 'lit-element';

export function worldsView(worlds, onSelect, selected) {
  return html`
    <select name="world" @change=${e => onSelect(e.target.value)}>
      ${worlds.map(
        ({ name }) =>
          html`<option ?selected=${selected === name} value=${name}>
            ${name}
          </option>`
      )}
    </select>
  `;
}
