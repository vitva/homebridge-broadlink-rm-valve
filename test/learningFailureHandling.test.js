const { expect } = require('chai');
const { setup, log } = require('./helpers/setup');
const learnData = require('../helpers/learnData');
const learnRFData = require('../helpers/learnRFData');

const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

describe('learning failure handling', () => {
  it('completes the HomeKit callback and turns off IR learning when startup fails', () => {
    const { device } = setup();
    const error = new Error('IR startup failed');
    device.learningError = error;
    let callbackError;
    let turnOffCount = 0;

    learnData.start(undefined, (err) => { callbackError = err; }, () => { turnOffCount += 1; }, log, true, 2);

    expect(callbackError).to.equal(error);
    expect(turnOffCount).to.equal(1);
    expect(device.listenerCount('rawData')).to.equal(0);
  });

  it('turns off IR learning when polling fails after startup', async () => {
    const { device } = setup();
    device.checkDataError = new Error('IR polling failed');
    let callbackCount = 0;
    let turnOffCount = 0;

    learnData.start(undefined, () => { callbackCount += 1; }, () => { turnOffCount += 1; }, log, true, 2);
    await wait(1100);

    expect(callbackCount).to.equal(1);
    expect(turnOffCount).to.equal(1);
    expect(device.listenerCount('rawData')).to.equal(0);
  });

  it('completes the HomeKit callback and turns off RF scanning when startup fails', () => {
    const { device } = setup();
    const error = new Error('RF startup failed');
    device.rfSweepError = error;
    let callbackError;
    let turnOffCount = 0;

    learnRFData.start(undefined, (err) => { callbackError = err; }, () => { turnOffCount += 1; }, log, true, 2);

    expect(callbackError).to.equal(error);
    expect(turnOffCount).to.equal(1);
    expect(device.listenerCount('rawRFData')).to.equal(0);
    expect(device.listenerCount('rawRFData2')).to.equal(0);
    expect(device.listenerCount('rawData')).to.equal(0);
  });

  it('turns off RF scanning when the first polling stage fails', async () => {
    const { device } = setup();
    device.checkRFDataError = new Error('RF frequency polling failed');
    let callbackCount = 0;
    let turnOffCount = 0;

    learnRFData.start(undefined, () => { callbackCount += 1; }, () => { turnOffCount += 1; }, log, true, 2);
    await wait(1100);

    expect(callbackCount).to.equal(1);
    expect(turnOffCount).to.equal(1);
    expect(device.listenerCount('rawRFData')).to.equal(0);
  });

  it('turns off RF scanning when the second polling stage fails', async () => {
    const { device } = setup();
    device.checkRFData2Error = new Error('RF second frequency polling failed');
    let turnOffCount = 0;

    learnRFData.start(undefined, () => {}, () => { turnOffCount += 1; }, log, true, 2);
    device.emit('rawRFData', Buffer.from('frequency'));
    await wait(1100);

    expect(turnOffCount).to.equal(1);
    expect(device.listenerCount('rawRFData')).to.equal(0);
    expect(device.listenerCount('rawRFData2')).to.equal(0);
  });

  it('turns off RF scanning when learned-code polling fails', async () => {
    const { device } = setup();
    device.checkDataError = new Error('RF code polling failed');
    let turnOffCount = 0;

    learnRFData.start(undefined, () => {}, () => { turnOffCount += 1; }, log, true, 2);
    device.emit('rawRFData', Buffer.from('frequency'));
    await wait(1100);
    device.emit('rawRFData2', Buffer.from('frequency'));
    await wait(1100);

    expect(turnOffCount).to.equal(1);
    expect(device.listenerCount('rawRFData')).to.equal(0);
    expect(device.listenerCount('rawRFData2')).to.equal(0);
    expect(device.listenerCount('rawData')).to.equal(0);
  });
});
