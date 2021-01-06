import { html } from 'lit-element';
export const karelView = ({ displayAltCanvas, index, indexes, className }) => {
  return html`<div class=${className + ' mt5'}>
    <canvas
      id="canvasAlt"
      class="square ${displayAltCanvas ? 'bg-light-yellow' : 'absolute o-0'}"
    ></canvas>
    <canvas id="canvas" class="square ${displayAltCanvas ? 'dn' : ''}"></canvas>
    <div class="db w-100">
      <input
        class="w-100"
        type="range"
        min="0"
        value=${index ? index() : 0}
        max=${indexes || 0}
        step="1"
        @input=${e => index?.(e.target.value)}
      />
    </div>
  </div>`;
};
