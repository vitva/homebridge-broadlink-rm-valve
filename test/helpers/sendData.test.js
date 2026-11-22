const { expect } = require('chai');

const { setup } = require('./setup');
const sendData = require('../../helpers/sendData');
const { getDevice } = require('../../helpers/getDevice');

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
