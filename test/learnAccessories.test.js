const { expect } = require('chai');

const { getAccessories } = require('./helpers/setup');

const configuredSwitch = {
  name: 'Test switch',
  type: 'switch',
  data: { on: 'ON', off: 'OFF' },
  persistState: false
};

describe('learnAccessories', () => {
  it('does not publish learning accessories when the platform has no configured accessories', async () => {
    const accessories = await getAccessories({ disableLogs: true, isUnitTest: true });

    expect(accessories).to.have.length(0);
  });

  it('adds the built-in learning accessories when a real accessory is configured', async () => {
    const accessories = await getAccessories({
      disableLogs: true,
      isUnitTest: true,
      accessories: [configuredSwitch]
    });

    expect(accessories).to.have.length(3);
  });

  it('respects hideScanFrequencyButton when accessories are configured', async () => {
    const accessories = await getAccessories({
      disableLogs: true,
      hideScanFrequencyButton: true,
      isUnitTest: true,
      accessories: [configuredSwitch]
    });

    expect(accessories).to.have.length(2);
  });

  it('respects hideLearnButton when accessories are configured', async () => {
    const accessories = await getAccessories({
      disableLogs: true,
      hideLearnButton: true,
      isUnitTest: true,
      accessories: [configuredSwitch]
    });

    expect(accessories).to.have.length(2);
  });
});
