import { range } from 'lodash-es';
import { vSub } from './utils';
const defaults = {
  dimensions: [8, 8],
  karel: { cell: [1, 1], direction: 'e' },
  beepers: [],
};
export const worlds = range(1, 16)
  .map(i => ({
    name: `${i}x${i}`,
    world: {
      dimensions: [i, i],
    },
  }))
  .map(handleWorlds);

export const lessons = [
  //newspaper
  [
    [
      {
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
          karel: { cell: [4, 2] },
        },
      },
      {
        name: 'newspaperSoln',
        world: {
          beepers: [[4, 3]],
          karel: { cell: [4, 2] },
        },
      },
    ],
  ],
  //columns
  [[2, 5, 7], [3, 5, 8], [2]].map((columns, i) => [
    {
      name: 'column' + i,
      world: {
        dimensions: [8, 8],
        beepers: columns.map(x => [1, x]),
      },
    },
    {
      name: 'column' + i + 'Soln',
      world: {
        beepers: columns
          .map(x => [1, x])
          .map(([y, x]) => range(y, 8 + 1).map(y => [y, x]))
          .flat(),
        karel: { cell: [1, 8] },
      },
    },
  ]),
  //midpoints
  [worlds[5], worlds[6], worlds[14]].map(world => [
    {
      name: world.name + 'Midpoint',
      world: world.world,
    },
    {
      name: world.name + 'Midpoint' + 'Soln',
      world: {
        beepers: [[1, Math.floor(world.world.dimensions[0] / 2)]],
      },
    },
  ]),
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
    beepers: world.beepers?.map(transform),
    walls: world.walls?.map(transform),
  };
}

function handleLesson(lessonGroup) {
  return lessonGroup.map(([start, ...solns]) => [
    { ...start, world: { ...defaults, ...start.world } },
    solns.map(soln => ({
      ...soln,
      world: fixWorldIndexing({ ...defaults, ...start.world, ...soln.world }),
    })),
  ]);
}

function handleWorlds(world) {
  return {
    ...world,
    world: fixWorldIndexing({ ...defaults, ...world.world }),
  };
}
