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

describe('Broadlink device routing', () => {
  it('selects a discovered device by either its IP address or normalized MAC address', () => {
    const { device } = setup();
    expect(getDevice({ host: device.host.address })).to.equal(device);
    expect(getDevice({ host: device.host.macAddress })).to.equal(device);
  });

  it('uses the first discovered device when no accessory host is configured', () => {
    const { device: first } = setup();
    const FakeDevice = require('./fakeDevice');
    const { addDevice } = require('../../helpers/getDevice');
    const second = new FakeDevice();
    addDevice(second);

    expect(getDevice({})).to.equal(first);
    expect(getDevice({ host: second.host.address })).to.equal(second);
    expect(getDevice({ host: second.host.macAddress })).to.equal(second);
  });
});
describe('RF and IR command transmission simulation', () => {
  it('passes a learned RF HEX command to the Broadlink device transport', async () => {
    const { device } = setup();

    await sendData({
      host: device.host.address,
      hexData: 'B2A1C3D4',
      log: () => {},
      name: 'RF test',
      logLevel: 6
    });

    expect(device.hasSentCode('B2A1C3D4')).to.equal(true);
  });

  it('converts an IR Pronto command and passes the Broadlink HEX packet to the device transport', async () => {
    const { device } = setup();

    await sendData({
      host: device.host.address,
      hexData: '0000 006D 0000 0001 0010 0020',
      log: () => {},
      name: 'IR test',
      logLevel: 6
    });

    expect(device.sentHexCodes).to.have.length(1);
    expect(device.sentHexCodes[0]).to.match(/^2600[0-9a-f]+$/i);
  });
});


describe('RF and IR transmission emulation', () => {
  const captureTransmission = async (hexData) => {
    const { device } = setup();
    const transmissions = [];
    device.sendData = (buffer, logLevel, originalHex) => {
      transmissions.push({ bytes: buffer.toString('hex'), originalHex });
    };
    await sendData({ host: device.host.address, hexData, name: 'Signal test', log: () => {}, logLevel: 6 });
    return transmissions;
  };

  it('passes a learned RF payload to the Broadlink transport unchanged', async () => {
    const rfCode = 'b2000000000000000000000000000000';
    expect(await captureTransmission(rfCode)).to.deep.equal([{ bytes: rfCode, originalHex: rfCode }]);
  });

  it('passes a Broadlink IR payload to the Broadlink transport unchanged', async () => {
    const irCode = '26005000000128941213121312131213';
    expect(await captureTransmission(irCode)).to.deep.equal([{ bytes: irCode, originalHex: irCode }]);
  });

  it('converts a Pronto IR code before handing it to the Broadlink transport', async () => {
    const prontoCode = '0000 006D 0000 0002 0157 00AC 0015 0016';
    const transmissions = await captureTransmission(prontoCode);
    expect(transmissions).to.have.length(1);
    expect(transmissions[0].originalHex).to.match(/^2600/);
    expect(transmissions[0].bytes).to.equal(transmissions[0].originalHex);
  });
});
