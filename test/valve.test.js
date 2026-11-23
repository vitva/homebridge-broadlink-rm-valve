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
});
