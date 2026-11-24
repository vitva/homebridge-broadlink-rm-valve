const { expect } = require('chai');
const { log, setup } = require('./helpers/setup');
const { AirPurifier } = require('../accessories');

describe('air purifier HomeKit characteristics', () => {
  it('exposes CurrentAirPurifierState as read-only', () => {
    const { device } = setup();
    const purifier = new AirPurifier(null, {
      name: 'Unit Test Air Purifier',
      host: device.host.address,
      isUnitTest: true,
      persistState: false,
      data: {
        on: 'ON',
        off: 'OFF',
        targetStateManual: 'MANUAL',
        targetStateAuto: 'AUTO',
        lockControls: 'LOCK',
        unlockControls: 'UNLOCK',
        swingToggle: 'SWING',
        fanSpeed20: 'SPEED20'
      }
    }, 'FakeServiceManager');

    const currentState = purifier.serviceManager.getCharacteristic(Characteristic.CurrentAirPurifierState);
    expect(currentState.getMethod).to.be.a('function');
    expect(currentState.setMethod).to.equal(undefined);
  });

  it('updates current state after the power command completes', async () => {
    const { device } = setup();
    const purifier = new AirPurifier(null, {
      name: 'Unit Test Air Purifier State',
      host: device.host.address,
      isUnitTest: true,
      persistState: false,
      data: {
        on: 'ON',
        off: 'OFF',
        targetStateManual: 'MANUAL',
        targetStateAuto: 'AUTO',
        fanSpeed20: 'SPEED20'
      }
    }, 'FakeServiceManager');

    await purifier.serviceManager.setCharacteristic(Characteristic.Active, true);
    expect(device.hasSentCode('ON')).to.equal(true);
    expect(purifier.state.currentState).to.equal(Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
  });
});
