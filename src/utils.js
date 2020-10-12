export function mod(n, m) {
  return ((n % m) + m) % m;
}
export const toDegrees = angle => (angle * Math.PI) / 180;
export const vAdd = (vec1, vec2) => vec1.map((val, i) => val + vec2[i]);
export const vDiv = (vec1, vec2) => vec1.map((val, i) => val / vec2[i]);
export const vMul = (vec1, vec2) => vec1.map((val, i) => val * vec2[i]);
export const vSub = (vec1, vec2) => vec1.map((val, i) => val - vec2[i]);

export const getRegexMatches = (regex, str) => {
  let m;
  const matches = [];
  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      matches.push(match);
    });
  }
  return matches;
};

/**
 * @param {<T>{string: T}} obj
 * @param {<T>[k:string, v:T]} keyValuePair
 */
export const toObject = (obj, keyValuePair) => {
  const [k, v] = keyValuePair;
  obj[k] = v;
  return obj;
};

export const capitalize = string => string[0].toUpperCase() + string.slice(1);
export function last(list) {
  return list.length ? list[list.length - 1] : undefined;
}
