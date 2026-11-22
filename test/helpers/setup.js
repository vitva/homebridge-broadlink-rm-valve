const hap = require('hap-nodejs');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BroadlinkRMPlatform = require('../../platform');
const FakeDevice = require('./fakeDevice');
const fakegatoHistory = require('fakegato-history');
const { addDevice, resetDevices } = require('../../helpers/getDevice');

global.Service = hap.Service;
global.Characteristic = hap.Characteristic;

// Give each test isolated Homebridge storage and initialize the same
// fakegato HistoryService global that the plugin initializer provides.
const setTestHomebridge = () => {
  const testStoragePath = fs.mkdtempSync(path.join(os.tmpdir(), 'homebridge-broadlink-rm-test-'));
  const homebridge = {
    hap,
    user: {
      storagePath: () => testStoragePath
    }
  };

  global.HistoryService = fakegatoHistory(homebridge);
  BroadlinkRMPlatform.setHomebridge(homebridge);
};

const log = (message, more) => {
  if (more) {
    // console.log(message, more)
  } else {
    // console.log(message)
  }
};

const setup = (config) => {
  resetDevices();
  setTestHomebridge();
  const platformConfig = Object.assign({ isUnitTest: true }, config);
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
