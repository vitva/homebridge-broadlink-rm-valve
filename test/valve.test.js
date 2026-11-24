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
    expect(valve.serviceManager.service.characteristics[Characteristic.Active].value).to.equal(Characteristic.Active.ACTIVE);
    expect(valve.serviceManager.service.characteristics[Characteristic.InUse].value).to.equal(Characteristic.InUse.IN_USE);

    await setActive(valve, Characteristic.Active.INACTIVE);

    expect(device.sentHexCodes).to.deep.equal(['AABB', 'AABB', 'CCDD', 'DDEE']);
    expect(valve.state.active).to.equal(Characteristic.Active.INACTIVE);
    expect(valve.state.inUse).to.equal(Characteristic.InUse.NOT_IN_USE);
    expect(valve.serviceManager.service.characteristics[Characteristic.Active].value).to.equal(Characteristic.Active.INACTIVE);
    expect(valve.serviceManager.service.characteristics[Characteristic.InUse].value).to.equal(Characteristic.InUse.NOT_IN_USE);
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


  it('automatically closes after the optional HomeKit SetDuration expires', async () => {
    const { device } = setup();
    const valve = new Valve(null, {
      name: 'Timed water valve',
      host: device.host.address,
      persistState: false,
      data: { open: 'AABB', close: 'DDEE' }
    }, 'FakeServiceManager');

    await new Promise((resolve, reject) => valve.setDuration(1, error => error ? reject(error) : resolve()));
    await setActive(valve, Characteristic.Active.ACTIVE);
    expect(valve.serviceManager.service.characteristics[Characteristic.RemainingDuration].value).to.equal(1);

    await new Promise(resolve => setTimeout(resolve, 1200));

    expect(device.sentHexCodes).to.deep.equal(['AABB', 'DDEE']);
    expect(valve.state.active).to.equal(Characteristic.Active.INACTIVE);
    expect(valve.serviceManager.service.characteristics[Characteristic.RemainingDuration].value).to.equal(0);
  });

  it('keeps the valve open without a timer and cancels a timer on manual close', async () => {
    const { device } = setup();
    const valve = new Valve(null, {
      name: 'Manual water valve',
      host: device.host.address,
      persistState: false,
      data: { open: 'AABB', close: 'DDEE' }
    }, 'FakeServiceManager');

    await setActive(valve, Characteristic.Active.ACTIVE);
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(device.sentHexCodes).to.deep.equal(['AABB']);
    expect(valve.state.active).to.equal(Characteristic.Active.ACTIVE);

    await new Promise((resolve, reject) => valve.setDuration(1, error => error ? reject(error) : resolve()));
    await setActive(valve, Characteristic.Active.INACTIVE);
    await new Promise(resolve => setTimeout(resolve, 1100));

    expect(device.sentHexCodes).to.deep.equal(['AABB', 'DDEE']);
    expect(valve.state.active).to.equal(Characteristic.Active.INACTIVE);
    expect(valve.closeTimer).to.equal(null);
  });
});
