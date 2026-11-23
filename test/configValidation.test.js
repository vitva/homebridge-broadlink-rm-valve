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

  it('safely ignores null values and accepts native JSON values', () => {
    expect(() => accessory.checkConfig({
      optional: null,
      enabled: true,
      delay: 10,
      nested: [{ active: false }]
    })).not.to.throw();
  });
});
