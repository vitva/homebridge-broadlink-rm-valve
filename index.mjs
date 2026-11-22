// Homebridge 2 loads plugins as ES modules; preserve the CommonJS initializer.
import initializer from './index.js';
export default function homebridgePlugin(api) { return initializer(api); }
