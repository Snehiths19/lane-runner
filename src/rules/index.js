// The game's rules: the Subway Surfers baseline with Snehith's tweaks applied (frozen).

import { BASELINE } from './baseline.js';
import { TWEAKS } from './tweaks.js';
import { resolveRules } from './resolve.js';

export { BASELINE, TWEAKS };
export const RULES = resolveRules(BASELINE, TWEAKS);
