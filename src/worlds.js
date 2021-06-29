import { range, keyBy, values } from 'lodash-es';
import { vSub } from './utils';
const defaults = {
  dimensions: [8, 8],
  karel: { cell: [1, 1], direction: 'e' },
  beepers: [],
};
const _worlds = range(1, 16).map(i => ({
  id: `${i}x${i}`,
  world: {
    dimensions: [i, i],
  },
}));

const _groups = [
  //newspaper
  {
    id: 'newspaper',
    options: [
      {
        id: 'newspaper',
        start: {
          dimensions: [5, 5],
          walls: [
            [2, 2],
            [2, 2],
            [2, 3],
            [2, 4],
            [2, 5],
            [3, 2],
            [3, 5],
            [4, 2],
            [4, 5],
            [5, 2],
            [5, 4],
          ],
          beepers: [[3, 5]],
          karel: { cell: [4, 2], direction: 'e' },
        },
        solution: {
          beepers: [[4, 3]],
          karel: { cell: [4, 2], direction: 'e' },
        },
      },
    ],
  },
  {
    id: 'columns',
    options: [[2, 5, 7], [3, 5, 8], [2]].map((columns, i) => ({
      id: 'column ' + i,
      start: {
        dimensions: [8, 8],
        beepers: columns.map(x => [1, x]),
      },
      solution: {
        beepers: columns
          .map(x => [1, x])
          .map(([y, x]) => range(y, 8 + 1).map(y => [y, x]))
          .flat(),
        karel: { cell: [1, 8], direction: 'e' },
      },
    })),
  },
  {
    id: 'midpoint',
    options: [_worlds[5], _worlds[6], _worlds[14]].map(world => ({
      id: world.id + ' Midpoint',
      start: world.world,
      solution: {
        beepers: [[1, Math.floor(world.world.dimensions[0] / 2)]],
      },
    })),
  },
].reduce(
  ({ starts, solutions }, group) => {
    group.options.forEach(({ id, start, solution }) => {
      starts.push({ group_id: group.id, id, world: fixWorldIndexing(start) });
      solutions.push({
        group_id: group.id,
        id,
        world: fixWorldIndexing({ ...start, ...solution }),
      });
    });
    return { starts, solutions };
  },
  { starts: [], solutions: [] }
);

function fixWorldIndexing(world) {
  const pointKeys = ['karel.cell', 'beepers'];
  const transform = point => vSub([point[1], point[0]], [1, 1]);

  return {
    ...defaults,
    karel: {
      ...defaults.karel,
      ...world.karel,
      cell: transform(world.karel?.cell ?? defaults.karel.cell),
    },
    beepers:
      world.beepers?.map(transform).map(cell => ({ cell, count: 1 })) || [],
    walls: world.walls?.map(transform) || [],
  };
}

/**
 *
 * @typedef {{id:string, group_id:string, world:import('./karelModel').karelState}} lesson
 */

export function worldsFactory(onChange, defaultId = '10x10') {
  const lessons = keyBy(
    [
      ..._worlds.map(world => ({
        id: world.id,
        world: fixWorldIndexing(world.world),
      })),
      ..._groups.starts,
    ],
    'id'
  );
  const solutions = keyBy(_groups.solutions, 'id');
  const groups = keyBy(lessons, 'group_id');
  /**
   *
   * @param {lesson} lesson
   */
  const lessonHasSolution = lesson => solutions[lesson.id];

  let currentId = defaultId;
  let currentOption = 0;
  return {
    get currentId() {
      return currentId;
    },
    get currentWorld() {
      return lessons[currentId].world;
    },
    /**
     * @returns {{id:string, options:{start, solution?}[]}}
     */
    get worlds() {
      return values(lessons).filter(lesson => !lessonHasSolution(lesson));
    },
    /**
     * @returns {{id:string, options:{start, solution?}[]}}
     */
    get lessons() {
      return values(lessons).filter(lessonHasSolution);
    },
    get lessonOptions() {
      return values(groups[lessons[currentId].group_id]);
    },
    select: id => {
      currentId = id;
      onChange(lessons[id], id);
      return lessons[id];
    },
  };
}

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

function loadDoc(url) {
  return new Promise((resolve, reject) => {
    var request;

    if (window.XMLHttpRequest) {
      request = new XMLHttpRequest(); // Firefox, Safari, ...
    } else if (window.ActiveXObject) {
      request = new ActiveXObject('Microsoft.XMLHTTP'); // Internet Explorer
    }
    request.open('GET', url, false);
    request.send(null);
    if (request.status == 404) {
      reject('file not found');
    }
    resolve(request.responseText);
  });
}

export async function loadWorld(fname) {
  const lines = (await loadDoc('worlds/' + fname + '.w')).split('\n');
  let defs = {
    dimensions: [8, 8],
    karel: { cell: [1, 1], direction: 'e' },
    beepers: [],
  };

  const commands = {
    dimension: (w, h) => (defs.dimensions = [parseInt(w), parseInt(h)]),
    karel: (x, y) => (defs.karel.cell = [parseInt(x), parseInt(y)]),
    beeper: (x, y) => defs.beepers.push([parseInt(x), parseInt(y)]),
  };

  lines.forEach(l => {
    const [command, argsString] = l.split(':');
    if (!command || !argsString) return;
    const args = argsString
      .replace(/[\(\)]/gm, '')
      .split(',')
      .map(x => x.trim());
    commands[command.toLowerCase()]?.(...args);
  });

  return fixWorldIndexing(defs);
}
