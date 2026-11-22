const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const schemaPath = path.join(__dirname, '..', 'config.schema.json');
const configSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

assert.equal(configSchema.pluginAlias, 'BroadlinkRM');
assert.equal(configSchema.pluginType, 'platform');
assert.equal(configSchema.singular, true);

const platformProperties = configSchema.schema.properties;
assert.ok(platformProperties.name);
assert.ok(platformProperties.accessories);
assert.ok(platformProperties.hosts);

const accessoryProperties = platformProperties.accessories.items.properties;
const supportedTypes = accessoryProperties.type.oneOf.map(option => option.enum[0]);
assert.ok(supportedTypes.includes('valve'));
assert.ok(supportedTypes.includes('switch'));
assert.ok(supportedTypes.includes('learn-ir'));

assert.ok(accessoryProperties.data.properties.open);
assert.ok(accessoryProperties.data.properties.close);
assert.ok(accessoryProperties.valveType);

console.log('PASS: Homebridge Config UI schema is valid and includes valve open/close settings');
