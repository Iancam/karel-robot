export const updateStatery = (states, diffs, onUpdate, diffOffset = -1) => {
  return {
    indexes: states.length,
    updateState: index => {
      if (!states[index]) return false;
      onUpdate(
        states[index],
        diffs[index + diffOffset],
        index,
        index + diffOffset
      );
      return true;
    },
  };
};

export const animatery = (speed, update) => {
  let index = 0;
  let last;
  let animating = true;
  return {
    reset: () => {
      update(0);
      animating = false;
    },
    speed: newSpeed => (newSpeed ? (speed = newSpeed) : speed),
    index: newIndex => {
      if (newIndex) {
        animating = false;
        update(newIndex);
      }
      return newIndex ? (speed = newIndex) : index;
    },

    animate: () => {
      const animator = ts => {
        if (!animating) return false;
        if (last === undefined) last = ts;
        const timeDiff = ts - last;
        if (timeDiff > speed) {
          if (!update(index++)) return;
          last = ts;
        }
        requestAnimationFrame(animator);
      };
      requestAnimationFrame(animator);
    },
  };
};

export const makeUpdator = (func, name, initValue) => {
  let oldVal = initValue;
  return function (arg) {
    if (!arg) return func();

    func(arg);
    this.requestUpdate(name, oldVal);
    oldVal = arg;
  };
};
