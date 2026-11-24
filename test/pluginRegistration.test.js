const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');
const hap = require('@homebridge/hap-nodejs');

const initializePlugin = require('../index');

describe('Homebridge plugin runtime registration', () => {
  it('registers the platform through the Homebridge API and initializes configured accessories', async () => {
    const storagePath = fs.mkdtempSync(path.join(os.tmpdir(), 'homebridge-plugin-runtime-'));
    const registrations = [];
    const homebridge = {
      hap,
      user: {
        storagePath: () => storagePath
      },
      registerPlatform: (...args) => registrations.push(args)
    };

    initializePlugin(homebridge);

    expect(registrations).to.have.length(1);
    expect(registrations[0][0]).to.equal('homebridge-broadlink-rm-valve');
    expect(registrations[0][1]).to.equal('BroadlinkRM');
    expect(registrations[0][2]).to.be.a('function');

    const Platform = registrations[0][2];
    const platform = new Platform(() => {}, {
      isUnitTest: true,
      hideLearnButton: true,
      hideScanFrequencyButton: true,
      accessories: [{
        name: 'Runtime smoke switch',
        type: 'switch',
        testMode: true,
        persistState: false,
        data: { on: 'ON', off: 'OFF' }
      }, {
        name: 'Runtime smoke valve',
        type: 'valve',
        testMode: true,
        persistState: false,
        data: { open: 'OPEN', close: 'CLOSE' }
      }]
    });

    const accessories = await new Promise((resolve, reject) => {
      platform.accessories(resolve).catch(reject);
    });

    expect(accessories).to.have.length(2);
    const switchAccessory = accessories.find(accessory => accessory.name === 'Runtime smoke switch');
    const valveAccessory = accessories.find(accessory => accessory.name === 'Runtime smoke valve');

    expect(switchAccessory.getServices().some(service => service.UUID === hap.Service.Switch.UUID)).to.equal(true);
    expect(valveAccessory.getServices().some(service => service.UUID === hap.Service.Valve.UUID)).to.equal(true);

    const active = valveAccessory.serviceManager.getCharacteristic(hap.Characteristic.Active);
    await new Promise((resolve, reject) => {
      active.setValue(hap.Characteristic.Active.ACTIVE, error => error ? reject(error) : resolve());
    });
    expect(active.value).to.equal(hap.Characteristic.Active.ACTIVE);
    expect(valveAccessory.serviceManager.getCharacteristic(hap.Characteristic.InUse).value)
      .to.equal(hap.Characteristic.InUse.IN_USE);
  });
});
