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
    beepers: world.beepers?.map(transform).map(cell => ({ cell, count: 1 })),
    walls: world.walls?.map(transform),
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
      console.log(lessons[currentId].world);
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
