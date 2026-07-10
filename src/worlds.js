import { range, keyBy, values } from 'lodash-es';
import { vSub } from './utils';
const defaults = {
  dimension: [8, 8],
  karel: { cell: [1, 1], direction: 'e' },
  beepers: [],
};

function fixWorldIndexing(world) {
  const transform = point => vSub([point[1], point[0]], [1, 1]);
  const transformWall = point => vSub(point, [1, 1]);
  return {
    ...defaults,
    karel: {
      ...defaults.karel,
      ...world.karel,
      cell: transform(world.karel?.cell ?? defaults.karel.cell),
    },
    dimension: world.dimension || [8, 8],
    beepers:
      world.beepers?.map(beeper => {
        const { cell, count } = beeper;

        return cell
          ? {
              cell: transform(cell),
              count,
            }
          : {
              cell: transform(beeper),
              count: 1,
            };
      }) || [],
    walls:
      world.walls?.map(w =>
        Array.isArray(w)
          ? { cell: transformWall(w), side: 'west' }
          : { cell: transformWall(w.cell), side: w.side }
      ) || [],
  };
}

/*
 World factory, file based.
 */

export async function worldsFactoryFB(onChange, defaultId = '8x8') {
  const worlds = [
    '15x15',
    '7x7',
    '7x12',
    '5x5',
    '4x4',
    '3x3',
    'collectWood',
    'safePickup',
    'clean1',
    'clean2',
    'windstorm1',
    'windstorm2',
    'column1',
    'column2',
    'collectNewspaper',
  ].map(id => ({ id }));
  let currentId = defaultId;
  let currentOption = 0;
  // let currentWorld = {};
  let currentWorld = await loadWorld(currentId);
  return {
    get currentId() {
      return currentId;
    },
    get currentWorld() {
      return currentWorld;
    },
    /**
     * @returns {{id:string, options:{start, solution?}[]}}
     */
    get worlds() {
      return worlds;
    },
    /**
     * @returns {{id:string, options:{start, solution?}[]}}
     */
    select: async id => {
      currentId = id;
      currentWorld = await loadWorld(id);
      onChange(currentWorld, id);
      return currentWorld;
    },
  };
}

export async function loadWorld(fname) {
  try {
    const response = await fetch('public/worlds/' + fname + '.w');
    const text = await response.text();
    const lines = text.split('\n');

    let defs = {
      dimension: [8, 8],
      karel: { cell: [1, 1], direction: 'e' },
      beepers: [],
      walls: [],
    };

    const beepersCount = {};

    const commands = {
      dimension: (w, h) => (defs.dimension = [parseInt(w), parseInt(h)]),
      karel: (x, y) => (defs.karel.cell = [parseInt(x), parseInt(y)]),
      wall: (x, y, side) => {
        defs.walls.push({
          cell: [parseInt(x), parseInt(y)],
          side: side?.trim().toLowerCase(),
        });
      },
      beeper: (x, y) => {
        let found = false;
        defs.beepers.forEach(({ cell: [x1, y1] }, i) => {
          if (x1 === x && y1 === y) {
            defs.beepers[i].count++;
            found = true;
          }
        });
        if (!found) {
          defs.beepers.push({ cell: [x, y], count: 1 });
        }
      },
    };

    lines.forEach(l => {
      const [command, argsString] = l.split(':');
      if (!command || !argsString) return;
      const parenContent = argsString.match(/\(([^)]+)\)/);
      const coordArgs = parenContent
        ? parenContent[1].split(',').map(x => x.trim())
        : argsString
            .replace(/[\(\)]/gm, '')
            .split(',')
            .map(x => x.trim());
      const afterParens = parenContent
        ? argsString.slice(argsString.indexOf(')') + 1).trim()
        : '';
      const args = afterParens ? [...coordArgs, afterParens] : coordArgs;
      commands[command.toLowerCase()]?.(...args);
    });
    Object.entries(beepersCount);
    return fixWorldIndexing(defs);
  } catch (e) {
    console.log(e);
  }
}
