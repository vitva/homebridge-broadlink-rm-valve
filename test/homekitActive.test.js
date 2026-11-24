const { expect } = require('chai');

const { log, setup } = require('./helpers/setup');
const delayForDuration = require('../helpers/delayForDuration');
const { AirPurifier, Fan, Fanv1, TV } = require('../accessories');

const baseConfig = {
  name: 'HomeKit Active compatibility test',
  isUnitTest: true,
  persistState: false,
  data: {
    on: 'ON',
    off: 'OFF'
  }
};

describe('HomeKit Active characteristic value compatibility', () => {
  it('keeps Air Purifier state in sync with numeric Active values', async () => {
    const { device } = setup();
    const purifier = new AirPurifier(log, {
      ...baseConfig,
      host: device.host.address,
      data: {
        ...baseConfig.data,
        targetStateManual: 'MANUAL',
        targetStateAuto: 'AUTO',
        lockControls: 'LOCK',
        unlockControls: 'UNLOCK',
        swingToggle: 'SWING',
        fanSpeed20: 'SPEED20'
      }
    }, 'ServiceManager');

    const active = purifier.serviceManager.getCharacteristic(Characteristic.Active);
    purifier.serviceManager.setCharacteristic(Characteristic.Active, Characteristic.Active.ACTIVE);
    await delayForDuration(0.05);
    expect(active.value).to.equal(Characteristic.Active.ACTIVE);
    expect(purifier.state.currentState).to.equal(Characteristic.CurrentAirPurifierState.PURIFYING_AIR);

    purifier.serviceManager.setCharacteristic(Characteristic.Active, Characteristic.Active.INACTIVE);
    await delayForDuration(0.05);
    expect(purifier.state.currentState).to.equal(Characteristic.CurrentAirPurifierState.INACTIVE);
  });

  it('uses numeric Active values for Fan v2', () => {
    const { device } = setup();
    const fan = new Fan(log, {
      ...baseConfig,
      host: device.host.address
    }, 'ServiceManager');

    const active = fan.serviceManager.getCharacteristic(Characteristic.Active);
    expect(active.props.format).to.equal('uint8');

    fan.serviceManager.setCharacteristic(Characteristic.Active, Characteristic.Active.ACTIVE);
    expect(active.value).to.equal(Characteristic.Active.ACTIVE);

    fan.serviceManager.setCharacteristic(Characteristic.Active, Characteristic.Active.INACTIVE);
    expect(active.value).to.equal(Characteristic.Active.INACTIVE);
  });

  it('keeps Boolean On values for legacy Fan v1', () => {
    const { device } = setup();
    const fan = new Fanv1(log, {
      ...baseConfig,
      host: device.host.address
    }, 'ServiceManager');

    const power = fan.serviceManager.getCharacteristic(Characteristic.On);
    expect(power.props.format).to.equal('bool');

    fan.serviceManager.setCharacteristic(Characteristic.On, true);
    expect(power.value).to.equal(true);

    fan.serviceManager.setCharacteristic(Characteristic.On, false);
    expect(power.value).to.equal(false);
  });

  it('uses numeric Active values for Television', () => {
    const { device } = setup();
    const tv = new TV(log, {
      ...baseConfig,
      host: device.host.address
    }, 'ServiceManager');

    const active = tv.serviceManager.getCharacteristic(Characteristic.Active);
    expect(active.props.format).to.equal('uint8');

    tv.serviceManager.setCharacteristic(Characteristic.Active, Characteristic.Active.ACTIVE);
    expect(active.value).to.equal(Characteristic.Active.ACTIVE);

    tv.serviceManager.setCharacteristic(Characteristic.Active, Characteristic.Active.INACTIVE);
    expect(active.value).to.equal(Characteristic.Active.INACTIVE);
  });
});
