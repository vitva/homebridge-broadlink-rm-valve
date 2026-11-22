const hap = require('hap-nodejs');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BroadlinkRMPlatform = require('../../platform');
const FakeDevice = require('./fakeDevice');
const { addDevice } = require('../../helpers/getDevice');

global.Service = hap.Service;
global.Characteristic = hap.Characteristic;

// The platform helper expects Homebridge's storage API. Give every test setup
// its own temporary directory to prevent persisted accessory state leaking
// between otherwise independent tests.
const setTestHomebridge = () => {
  const testStoragePath = fs.mkdtempSync(path.join(os.tmpdir(), 'homebridge-broadlink-rm-test-'));
  BroadlinkRMPlatform.setHomebridge({
    hap,
    user: {
      storagePath: () => testStoragePath
    }
  });
};

const log = (message, more) => {
  if (more) {
    // console.log(message, more)
  } else {
    // console.log(message)
  }
};

const setup = (config) => {
  setTestHomebridge();
  const platformConfig = Object.assign({
    hosts: [{ address: '127.0.0.1', mac: '00:00:00:00:00:01' }]
  }, config);
  const platform = new BroadlinkRMPlatform(log, platformConfig);

  const device = new FakeDevice();
  addDevice(device);

  return { platform, device };
};

const getAccessories = (config, replacementLog) => {
  const { platform } = setup(config);

  return new Promise((resolve, reject) => {
    try {
      platform.accessories(resolve).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { log, setup, getAccessories };
