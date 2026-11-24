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
      }]
    });

    const accessories = await new Promise((resolve, reject) => {
      platform.accessories(resolve).catch(reject);
    });

    expect(accessories).to.have.length(1);
    const services = accessories[0].getServices();
    expect(services).to.have.length.greaterThan(0);
    expect(services.some(service => service.UUID === hap.Service.Switch.UUID)).to.equal(true);
  });
});
