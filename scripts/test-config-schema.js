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
const expectedTypes = [
  'air-conditioner',
  'air-purifier',
  'humidifier-dehumidifier',
  'learn-ir',
  'learn-code',
  'switch',
  'garage-door-opener',
  'lock',
  'switch-multi',
  'switch-multi-repeat',
  'switch-repeat',
  'fan',
  'fanv1',
  'outlet',
  'light',
  'window',
  'window-covering',
  'tv',
  'temperatureSensor',
  'humiditySensor',
  'heater-cooler',
  'valve'
];
expectedTypes.forEach(type => assert.ok(supportedTypes.includes(type), `Missing UI accessory type: ${type}`));

assert.ok(accessoryProperties.data.properties.open);
assert.ok(accessoryProperties.data.properties.close);
assert.ok(accessoryProperties.valveType);
assert.ok(accessoryProperties.valveType.condition);
assert.ok(accessoryProperties.data.condition);
assert.ok(accessoryProperties.data.properties.open.condition);
assert.ok(accessoryProperties.data.properties.close.condition);
assert.ok(accessoryProperties.data.properties.lock);
assert.ok(accessoryProperties.data.properties.unlock);
assert.ok(accessoryProperties.data.properties.lock.condition);
assert.ok(accessoryProperties.data.properties.unlock.condition);
assert.ok(accessoryProperties.data.properties.on.condition);
assert.ok(accessoryProperties.data.properties.off.condition);
assert.ok(accessoryProperties.data.properties.stop.condition);
const openCondition = accessoryProperties.data.properties.open.condition.functionBody;
assert.ok(openCondition.includes('valve'));
assert.ok(openCondition.includes('garage-door-opener'));
assert.ok(openCondition.includes('window-covering'));
const stopCondition = accessoryProperties.data.properties.stop.condition.functionBody;
assert.ok(stopCondition.includes('window-covering'));
assert.ok(accessoryProperties.subType.condition);
assert.deepEqual(accessoryProperties.subType.oneOf.map(option => option.enum[0]), ['stb', 'receiver', 'stick']);
assert.ok(accessoryProperties.debug);
assert.ok(accessoryProperties.resendHexAfterReload);
assert.ok(accessoryProperties.valveType.condition);
assert.ok(accessoryProperties.data.condition);
assert.ok(accessoryProperties.data.properties.open.condition);
assert.ok(accessoryProperties.data.properties.close.condition);
assert.ok(accessoryProperties.subType.condition);
assert.ok(accessoryProperties.debug);
assert.ok(accessoryProperties.resendHexAfterReload);

console.log('PASS: Homebridge Config UI schema exposes all legacy accessory types and type-specific commands');
