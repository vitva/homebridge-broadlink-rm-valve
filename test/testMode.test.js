const { expect } = require('chai');

const { setup } = require('./helpers/setup');
const { Switch } = require('../accessories');
const { resetDevices } = require('../helpers/getDevice');

describe('accessory test mode', () => {
  it('is available to every accessory type in the config schema', async () => {
    const schema = require('../config.schema.json');
    const properties = schema.schema.properties.accessories.items.properties;
    expect(properties.testMode).to.exist;
    expect(properties.testMode.type).to.equal('boolean');
    expect(properties.testMode.condition.functionBody).to.equal('return true;');
  });

  it('simulates a switch action without a Broadlink device', () => {
    const { device } = setup();
    const accessory = new Switch(null, {
      name: 'Virtual test switch',
      testMode: true,
      isUnitTest: true,
      persistState: false,
      data: { on: 'ON', off: 'OFF' }
    }, 'FakeServiceManager');

    resetDevices();
    accessory.serviceManager.setCharacteristic(Characteristic.On, true);

    expect(accessory.state.switchState).to.equal(true);
    expect(device.sentHexCodes).to.deep.equal([]);
  });
});
