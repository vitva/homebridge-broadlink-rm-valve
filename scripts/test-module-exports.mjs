import esmInitializer from 'homebridge-broadlink-rm-valve';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const commonJsInitializer = require('homebridge-broadlink-rm-valve');

if (typeof esmInitializer !== 'function') {
  throw new TypeError('The package import export must provide a Homebridge initializer function.');
}

if (typeof commonJsInitializer !== 'function') {
  throw new TypeError('The package require export must provide a Homebridge initializer function.');
}

console.log('PASS: package import resolves the Homebridge 2 ESM initializer');
console.log('PASS: package require preserves the CommonJS initializer');
