const hap = require('hap-nodejs');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BroadlinkRMPlatform = require('../../platform');
const FakeDevice = require('./fakeDevice');
const { addDevice } = require('../../helpers/getDevice');

global.Service = hap.Service;
global.Characteristic = hap.Characteristic;

// The platform helper expects Homebridge's storage API. Supply an isolated
// temporary storage directory so the legacy accessory tests exercise the
// same initialization path as a real Homebridge installation.
const testStoragePath = fs.mkdtempSync(path.join(os.tmpdir(), 'homebridge-broadlink-rm-test-'));
const testHomebridge = {
  hap,
  user: {
    storagePath: () => testStoragePath
  }
};
BroadlinkRMPlatform.setHomebridge(testHomebridge);

const log = (message, more) => {
  if (more) {
    // console.log(message, more)
  } else {
    // console.log(message)
  }
};

const setup = (config) => {
  const platform = new BroadlinkRMPlatform(log, config);

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
