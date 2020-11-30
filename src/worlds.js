import { range, keyBy, values } from 'lodash-es';
import { vSub } from './utils';
const defaults = {
  dimensions: [8, 8],
  karel: { cell: [1, 1], direction: 'e' },
  beepers: [],
};
const worlds = range(1, 16)
  .map(i => ({
    name: `${i}x${i}`,
    world: {
      dimensions: [i, i],
    },
  }))
  .map(handleWorlds);
const toLesson = world => {
  return { id: world.name, options: [{ start: world }] };
};

const _lessons = [
  //newspaper
  {
    id: 'newspaper',
    options: [
      {
        start: {
          name: 'newspaper',
          world: {
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
        },
        solution: {
          name: 'newspaper',
          world: {
            beepers: [[4, 3]],
            karel: { cell: [4, 2], direction: 'e' },
          },
        },
      },
    ],
  },
  {
    id: 'columns',
    options: [[2, 5, 7], [3, 5, 8], [2]].map((columns, i) => ({
      start: {
        name: 'column ' + i,
        world: {
          dimensions: [8, 8],
          beepers: columns.map(x => [1, x]),
        },
      },
      solution: {
        name: 'column ' + i + ' Soln',
        world: {
          beepers: columns
            .map(x => [1, x])
            .map(([y, x]) => range(y, 8 + 1).map(y => [y, x]))
            .flat(),
          karel: { cell: [1, 8], direction: 'e' },
        },
      },
    })),
  },
  {
    id: 'midpoint',
    options: [worlds[5], worlds[6], worlds[14]].map(world => ({
      start: {
        name: world.name + ' Midpoint',
        world: world.world,
      },
      solution: {
        name: world.name + ' Midpoint ' + 'Soln',
        world: {
          beepers: [[1, Math.floor(world.world.dimensions[0] / 2)]],
        },
      },
    })),
  },
].map(handleLesson);

function fixWorldIndexing(world) {
  const pointKeys = ['karel.cell', 'beepers'];
  const transform = point => vSub([point[1], point[0]], [1, 1]);

  return {
    ...world,
    karel: {
      ...world.karel,
      cell: transform(world.karel.cell),
    },
    beepers: world.beepers?.map(transform).map(cell => ({ cell, count: 1 })),
    walls: world.walls?.map(transform),
  };
}

function handleLesson(lessonGroup) {
  const options = lessonGroup.options.map(({ start, solution }) => ({
    start: handleWorlds(start),
    solution: {
      ...solution,
      world: fixWorldIndexing({
        ...defaults,
        ...start.world,
        ...solution.world,
      }),
    },
  }));

  return { ...lessonGroup, options };
}

function handleWorlds(world) {
  return {
    ...world,
    world: fixWorldIndexing({ ...defaults, ...world.world }),
  };
}

const lessonContainsSolution = ({ options }) =>
  options
    .map(({ solution }) => solution)
    .reduce((agg, curr) => agg || curr, false);

export function worldsFactory(onChange, defaultId = '10x10') {
  const lessons = keyBy([..._lessons, ...worlds.map(toLesson)], 'id');
  let currentId = defaultId;
  let currentOption = 0;
  return {
    get currentId() {
      return currentId;
    },
    get currentWorld() {
      return lessons[currentId].options[currentOption].start.world;
    },
    /**
     * @returns {{id:string, options:{start, solution?}[]}}
     */
    get worlds() {
      return values(lessons).filter(lesson => !lessonContainsSolution(lesson));
    },
    /**
     * @returns {{id:string, options:{start, solution?}[]}}
     */
    get lessons() {
      return values(lessons).filter(lessonContainsSolution);
    },
    get lessonOptions() {
      return lessons[currentId].options.filter(({ solution }) => solution);
    },
    select: id => {
      currentId = id;
      onChange(lessons[id], id);
      return lessons[id];
    },
  };
}
