const { expect } = require('chai');

const { setup, log } = require('./helpers/setup');
const Valve = require('../accessories/valve');

const setActive = (valve, value) => new Promise((resolve, reject) => {
  valve.setActive(value, (error) => {
    if (error) {return reject(error);}
    resolve();
  });
});

describe('valveAccessory', () => {
  it('sends independent open and close commands, including repeat/pause command arrays', async () => {
    const { device } = setup();
    const valve = new Valve(null, {
      name: 'Test water valve',
      host: device.host.address,
      persistState: false,
      data: {
        open: [
          { data: 'AABB', sendCount: 2, interval: 0.01 },
          { data: 'CCDD', pause: 0.01 }
        ],
        close: 'DDEE'
      }
    }, 'FakeServiceManager');

    await setActive(valve, Characteristic.Active.ACTIVE);

    expect(device.sentHexCodes).to.deep.equal(['AABB', 'AABB', 'CCDD']);
    expect(valve.state.active).to.equal(Characteristic.Active.ACTIVE);
    expect(valve.state.inUse).to.equal(Characteristic.InUse.IN_USE);

    await setActive(valve, Characteristic.Active.INACTIVE);

    expect(device.sentHexCodes).to.deep.equal(['AABB', 'AABB', 'CCDD', 'DDEE']);
    expect(valve.state.active).to.equal(Characteristic.Active.INACTIVE);
    expect(valve.state.inUse).to.equal(Characteristic.InUse.NOT_IN_USE);
  });
  it('serializes concurrent multi-step open and close actions', async () => {
    const { device } = setup();
    const valve = new Valve(null, {
      name: 'Queued water valve',
      host: device.host.address,
      persistState: false,
      data: {
        open: [
          { data: 'AABB' },
          { data: 'CCDD' }
        ],
        close: 'DDEE'
      }
    }, 'FakeServiceManager');

    await Promise.all([
      setActive(valve, Characteristic.Active.ACTIVE),
      setActive(valve, Characteristic.Active.INACTIVE)
    ]);

    expect(device.sentHexCodes).to.deep.equal(['AABB', 'CCDD', 'DDEE']);
    expect(valve.state.active).to.equal(Characteristic.Active.INACTIVE);
  });

  it('creates a HomeKit Valve and simulates open/close without a Broadlink device or HEX commands', async () => {
    const { platform } = setup({
      hideLearnButton: true,
      hideScanFrequencyButton: true,
      accessories: [{ type: 'valve', name: 'Virtual test valve', testMode: true, persistState: false }]
    });
    const accessories = await new Promise((resolve, reject) => platform.accessories(resolve).catch(reject));
    expect(accessories).to.have.length(1);
    const valve = accessories[0];
    const valveService = valve.getServices().find(service => service.UUID === Service.Valve.UUID);
    expect(valveService).to.exist;
    require('../helpers/getDevice').resetDevices();
    await setActive(valve, Characteristic.Active.ACTIVE);
    expect(valve.state.active).to.equal(Characteristic.Active.ACTIVE);
    expect(valve.state.inUse).to.equal(Characteristic.InUse.IN_USE);
    await setActive(valve, Characteristic.Active.INACTIVE);
    expect(valve.state.active).to.equal(Characteristic.Active.INACTIVE);
    expect(valve.state.inUse).to.equal(Characteristic.InUse.NOT_IN_USE);
  });

});
