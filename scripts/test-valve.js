/*
 * Dependency-free smoke tests for the Valve accessory.
 * Run with: npm run test:valve
 * This isolates the accessory logic; it does not replace Homebridge/HAP integration tests.
 */
const assert = require('assert');
const Module = require('module');
const originalLoad = Module._load;
const sentCommands = [];
let shouldFailSend = false;
let deviceAvailable = true;

class FakeBroadlinkAccessory {
  constructor (log, config = {}, serviceManagerType = 'ServiceManager') {
    this.log = log || function () {};
    this.config = config;
    this.data = config.data;
    this.name = config.name;
    this.serviceManagerType = serviceManagerType;
    this.state = {};
    this.setupServiceManager();
  }

  async performSend (command) {
    if (shouldFailSend) {throw new Error('Simulated Broadlink send failure');}
    sentCommands.push(command);
  }

  getCharacteristicValue (props, callback) {
    callback(null, this.state[props.propertyName] === undefined ? 0 : this.state[props.propertyName]);
  }
}

class FakeServiceManager {
  constructor (name, serviceType) {
    this.name = name;
    this.serviceType = serviceType;
    this.handlers = {};
    this.values = {};
  }

  setCharacteristic (type, value) {this.values[type.name || type] = value;}
  addGetCharacteristic (options) {this.handlers[options.name] = options.method.bind(options.bind, options.props);}
  addSetCharacteristic (options) {this.handlers[options.name] = options.method.bind(options.bind);}
  updateCharacteristic (type, value) {this.values[type.name || type] = value;}
}

Module._load = function (request, parent, isMain) {
  if (request === './accessory' && parent && /accessories[\\/]valve\.js$/.test(parent.filename)) {
    return FakeBroadlinkAccessory;
  }
  if (request === '../helpers/serviceManagerTypes' && parent && /accessories[\\/]valve\.js$/.test(parent.filename)) {
    return { ServiceManager: FakeServiceManager, FakeServiceManager: FakeServiceManager };
  }
  if (request === '../helpers/getDevice' && parent && /accessories[\\/]valve\.js$/.test(parent.filename)) {
    return { getDevice: () => deviceAvailable ? { sendData: function () {} } : undefined };
  }
  return originalLoad.call(this, request, parent, isMain);
};

global.Service = { Valve: function Valve () {} };
global.Characteristic = {
  ValveType: { name: 'ValveType' },
  Active: { name: 'Active', ACTIVE: 1, INACTIVE: 0 },
  InUse: { name: 'InUse', IN_USE: 1, NOT_IN_USE: 0 }
};

const Valve = require('../accessories/valve');
const createValve = function (data) {
  return new Valve(function () {}, { name: 'Test water valve', data: data || { open: 'OPEN_COMMAND', close: 'CLOSE_COMMAND' } });
};
const setActive = function (valve, value) {
  return new Promise(function (resolve, reject) {
    valve.setActive(value, function (error) {if (error) {reject(error);} else {resolve();}});
  });
};

(async function () {
  const valve = createValve();
  assert.strictEqual(valve.serviceManager.values.ValveType, 3, 'default ValveType should be water faucet');

  await setActive(valve, global.Characteristic.Active.ACTIVE);
  assert.deepStrictEqual(sentCommands, ['OPEN_COMMAND']);
  assert.strictEqual(valve.state.active, global.Characteristic.Active.ACTIVE);
  assert.strictEqual(valve.state.inUse, global.Characteristic.InUse.IN_USE);

  await setActive(valve, global.Characteristic.Active.INACTIVE);
  assert.deepStrictEqual(sentCommands, ['OPEN_COMMAND', 'CLOSE_COMMAND']);
  assert.strictEqual(valve.state.active, global.Characteristic.Active.INACTIVE);
  assert.strictEqual(valve.state.inUse, global.Characteristic.InUse.NOT_IN_USE);

  const previousState = Object.assign({}, valve.state);
  deviceAvailable = false;
  await assert.rejects(setActive(valve, global.Characteristic.Active.ACTIVE), /no ready Broadlink RM device is available/);
  assert.deepStrictEqual(valve.state, previousState, 'missing Broadlink device must not update the virtual state');
  deviceAvailable = true;

  await assert.rejects(setActive(valve, 99), /invalid Active value/);
  assert.deepStrictEqual(valve.state, previousState, 'invalid HomeKit state must not update the virtual state');

  shouldFailSend = true;
  await assert.rejects(setActive(valve, global.Characteristic.Active.ACTIVE), /Simulated Broadlink send failure/);
  shouldFailSend = false;
  assert.deepStrictEqual(valve.state, previousState, 'failed send must not update the virtual state');

  assert.throws(function () {
    createValve({ open: 'OPEN_ONLY', close: '' });
  }, /requires data\.open and data\.close commands/);

  console.log('PASS: default HomeKit ValveType is water faucet (3)');
  console.log('PASS: opening sends only the configured open command');
  console.log('PASS: closing sends only the configured close command');
  console.log('PASS: failed transmission leaves the virtual state unchanged');
  console.log('PASS: incomplete valve configuration is rejected');
  console.log('PASS: missing Broadlink device leaves the virtual state unchanged');
  console.log('PASS: invalid HomeKit Active values are rejected');
  Module._load = originalLoad;
})().catch(function (error) {
  Module._load = originalLoad;
  console.error(error);
  process.exitCode = 1;
});
