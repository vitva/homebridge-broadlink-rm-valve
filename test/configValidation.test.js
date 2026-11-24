const { expect } = require('chai');
const HomebridgeAccessory = require('../base/accessory');

describe('accessory configuration validation', () => {
  const accessory = Object.create(HomebridgeAccessory.prototype);
  accessory.name = 'Config test accessory';
  accessory.log = () => {};

  it('rejects boolean values supplied as strings without exiting Homebridge', () => {
    expect(() => accessory.checkConfig({ enabled: 'true' }))
      .to.throw('must be a boolean value');
    expect(() => accessory.checkConfig({ enabled: 'false' }))
      .to.throw('must be a boolean value');
  });

  it('rejects numeric values supplied as strings', () => {
    expect(() => accessory.checkConfig({ delay: '10' }))
      .to.throw('must be a number');
  });

  it('logs and skips an accessory with invalid config instead of rejecting platform startup', async () => {
    const { getAccessories } = require('./helpers/setup');
    const accessories = await getAccessories({
      isUnitTest: true,
      accessories: [{
        name: 'Invalid switch',
        type: 'switch',
        enabled: 'true',
        data: { on: 'ON', off: 'OFF' },
        persistState: false
      }]
    });

    // The invalid accessory is skipped; the built-in learning accessories remain available.
    expect(accessories).to.have.length(2);
  });

  it('safely ignores null values and accepts native JSON values', () => {
    expect(() => accessory.checkConfig({
      optional: null,
      enabled: true,
      delay: 10,
      nested: [{ active: false }]
    })).not.to.throw();
  });
});
