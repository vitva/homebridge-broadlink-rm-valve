const { expect } = require('chai');

const { setup } = require('./setup');
const sendData = require('../../helpers/sendData');
const { getDevice } = require('../../helpers/getDevice');
const Switch = require('../../accessories/switch');

describe('test device wiring', () => {
  it('registers the fake device and sends a HEX command through the production helper', async () => {
    const { device } = setup();

    expect(getDevice({ host: device.host.address })).to.equal(device);
    expect(device.mutex).to.have.property('use').that.is.a('function');

    await sendData({
      host: device.host.address,
      hexData: 'AABB',
      log: () => {}
    });

    expect(device.hasSentCode('AABB')).to.equal(true);
  });
});

describe('fake service manager wiring', () => {
  it('invokes a switch set handler and updates state synchronously', () => {
    const { device } = setup();
    const accessory = new Switch(null, {
      name: 'Test switch',
      host: device.host.address,
      data: { on: 'ON', off: 'OFF' },
      persistState: false
    }, 'FakeServiceManager');

    const characteristic = accessory.serviceManager.getCharacteristic(Characteristic.On);
    expect(characteristic.setMethod).to.be.a('function');

    accessory.serviceManager.setCharacteristic(Characteristic.On, true);
    expect(accessory.state.switchState).to.equal(true);
  });
});
