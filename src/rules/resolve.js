// Merges the Subway Surfers baseline with personal tweaks.
// A tweak may only change a value the baseline already has, so typos fail loudly.

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

function merge(target, tweaks, path) {
  for (const [key, value] of Object.entries(tweaks)) {
    const where = path ? `${path}.${key}` : key;
    if (!Object.hasOwn(target, key)) throw new Error(`Unknown tweak: ${where}`);
    if (typeof value !== typeof target[key] || isPlainObject(value) !== isPlainObject(target[key])) {
      throw new Error(`Tweak ${where} must be a ${typeof target[key]}`);
    }
    if (isPlainObject(value)) merge(target[key], value, where);
    else target[key] = value;
  }
}

function deepFreeze(obj) {
  for (const value of Object.values(obj)) if (isPlainObject(value)) deepFreeze(value);
  return Object.freeze(obj);
}

// Returns a frozen copy; neither input is changed.
export function resolveRules(baseline, tweaks) {
  const rules = structuredClone(baseline);
  merge(rules, tweaks, '');
  return deepFreeze(rules);
}
