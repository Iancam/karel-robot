// worlds.js;
let worlds = [];
for (let i = 1; i <= 15; i++) {
  worlds.push({
    dimensions: [i, i],
    karel: { cell: [0, 0], direction: 'e' },
    beepers: [],
  });
}

// {
//   karel: { cell: [0, 0], direction: 'e' },
//   dimensions: [10, 10],
//   beepers: [],
// }
