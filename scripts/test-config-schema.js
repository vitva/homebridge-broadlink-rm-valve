const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const schemaPath = path.join(__dirname, '..', 'config.schema.json');
const configSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

assert.equal(configSchema.pluginAlias, 'BroadlinkRM');
assert.equal(configSchema.pluginType, 'platform');
assert.equal(configSchema.singular, true);
assert.equal(Object.hasOwn(configSchema, 'form'), false, 'Use the current Config UI schema-driven layout; legacy form layout hid the accessory array');

const platformProperties = configSchema.schema.properties;
assert.ok(platformProperties.name);
assert.ok(platformProperties.accessories);
assert.ok(platformProperties.hosts);

const accessoryArray = platformProperties.accessories;
assert.equal(accessoryArray.type, 'array');
assert.equal(accessoryArray.items.type, 'object');
assert.equal(accessoryArray.items.additionalProperties, true, 'Accessory items must allow legacy config keys');
assert.equal(Object.hasOwn(accessoryArray.items.properties, 'additionalProperties'), false, 'additionalProperties must not be declared as an accessory field');
assert.equal(Object.hasOwn(accessoryArray.items.properties.data.properties, 'additionalProperties'), false, 'additionalProperties must not be declared as a Broadlink command field');
assert.equal(accessoryArray.title, 'Аксессуары HomeKit', 'The generated schema form must label the accessory array');
const accessoryProperties = accessoryArray.items.properties;
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
assert.deepEqual(supportedTypes, expectedTypes, 'The original accessory type order must be preserved and Valve appended');

assert.ok(accessoryProperties.data.properties.open);
assert.ok(accessoryProperties.data.properties.close);
assert.ok(accessoryProperties.valveType);
assert.ok(accessoryProperties.testMode);
assert.equal(accessoryProperties.testMode.type, 'boolean');
assert.ok(accessoryProperties.testMode.condition);
assert.ok(accessoryProperties.data.condition.functionBody.includes('testMode'));
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
assert.ok(accessoryProperties.mqttAllowInsecureTLS);
assert.equal(accessoryProperties.mqttAllowInsecureTLS.type, 'boolean');
assert.equal(accessoryProperties.mqttAllowInsecureTLS.default, false);
assert.ok(accessoryProperties.debug);
assert.ok(accessoryProperties.resendHexAfterReload);
assert.ok(accessoryProperties.valveType.condition);
assert.ok(accessoryProperties.data.condition);
assert.ok(accessoryProperties.data.properties.open.condition);
assert.ok(accessoryProperties.data.properties.close.condition);
assert.ok(accessoryProperties.subType.condition);
assert.ok(accessoryProperties.debug);
assert.ok(accessoryProperties.resendHexAfterReload);

const expectedAccessorySettings = [
  'delay', 'allowResend', 'persistState', 'enableAutoOff', 'onDuration',
  'enableAutoOn', 'offDuration', 'defaultBrightness', 'useLastKnownBrightness',
  'defaultFanSpeed', 'speedSteps', 'showSwingMode', 'totalDurationOpen',
  'totalDurationClose', 'openCloseDuration', 'lockDuration', 'unlockDuration',
  'autoLockDelay', 'pingIPAddress', 'mqttURL', 'mqttTopic', 'temperatureAdjustment',
  'humidityAdjustment', 'minTemperature', 'maxTemperature', 'tempStepSize',
  'heatOnly', 'coolOnly', 'defaultCoolTemperature', 'defaultHeatTemperature',
  'humidifierOnly', 'deHumidifierOnly', 'batteryAlerts', 'w1Device',
  'defaultMode', 'coolingThresholdTemperature', 'heatingThresholdTemperature',
  'autoCoolTemperature', 'autoHeatTemperature', 'autoMinimumDuration',
  'sendOnWhenOff', 'autoSwitchName', 'lockUnlockDuration'
];
expectedAccessorySettings.forEach(key => assert.ok(accessoryProperties[key], `Missing accessory setting: ${key}`));

const expectedCommandSettings = [
  'swingToggle', 'fanSpeed10', 'fanSpeed100', 'brightness10', 'brightness100',
  'hue0', 'hue99', 'hue199', 'hue299', 'hue359', 'white',
  'targetStateHumidifier', 'targetStateDehumidifier', 'fanOnly',
  'lockControls', 'unlockControls', 'remote', 'volume', 'inputs', 'powerMode'
];
expectedCommandSettings.forEach(key => assert.ok(accessoryProperties.data.properties[key], `Missing command setting: data.${key}`));
assert.equal(accessoryProperties.data.additionalProperties, true);
assert.equal(accessoryArray.items.additionalProperties, true);
assert.ok(accessoryProperties.data.properties.remote.properties.arrowUp);
assert.ok(accessoryProperties.data.properties.inputs.items.properties.data);
assert.ok(accessoryProperties.data.properties.cool.properties.temperatureCodes);
assert.ok(accessoryProperties.data.properties.heat.properties.temperatureCodes);

console.log('PASS: Homebridge Config UI schema exposes all legacy accessory types and type-specific commands');
