const { expect } = require('chai');

const HomebridgeAccessory = require('../base/accessory');

const makeAccessory = () => {
  const accessory = Object.create(HomebridgeAccessory.prototype);
  accessory.config = {};
  accessory.log = () => {};
  accessory.logLevel = 2;
  accessory.name = 'Async setter test';
  accessory.state = {};
  accessory.isReloadingState = false;
  return accessory;
};

describe('asynchronous HomeKit setters', () => {
  it('waits for a custom accessory action before acknowledging the HomeKit write', async () => {
    const accessory = makeAccessory();
    let resolveAction;
    let callbackResult = 'not-called';
    const callbackPromise = new Promise(resolve => {
      accessory.setCharacteristicValue({
        propertyName: 'switchState',
        onData: 'ON',
        offData: 'OFF',
        setValuePromise: () => new Promise(resolveActionNow => { resolveAction = resolveActionNow; })
      }, true, error => {
        callbackResult = error || null;
        resolve(error || null);
      });
    });

    await Promise.resolve();
    expect(resolveAction).to.be.a('function');
    expect(callbackResult).to.equal('not-called');

    resolveAction();
    expect(await callbackPromise).to.equal(null);
    expect(callbackResult).to.equal(null);
  });

  it('passes asynchronous action failures back through the HomeKit callback', async () => {
    const accessory = makeAccessory();
    accessory.state.switchState = false;
    const failure = new Error('simulated Broadlink send failure');
    const result = await new Promise(resolve => {
      accessory.setCharacteristicValue({
        propertyName: 'switchState',
        onData: 'ON',
        offData: 'OFF',
        setValuePromise: async () => { throw failure; }
      }, true, resolve);
    });

    expect(result).to.equal(failure);
    expect(accessory.state.switchState).to.equal(false);
  });

  it('waits for the default Broadlink send action before acknowledging the HomeKit write', async () => {
    const accessory = makeAccessory();
    let resolveAction;
    let callbackCalled = false;
    accessory.performSetValueAction = () => new Promise(resolve => { resolveAction = resolve; });

    const callbackPromise = new Promise(resolve => {
      accessory.setCharacteristicValue({
        propertyName: 'switchState',
        onData: 'ON',
        offData: 'OFF'
      }, true, error => {
        callbackCalled = true;
        resolve(error || null);
      });
    });

    await Promise.resolve();
    expect(resolveAction).to.be.a('function');
    expect(callbackCalled).to.equal(false);

    resolveAction();
    expect(await callbackPromise).to.equal(null);
    expect(callbackCalled).to.equal(true);
  });
});
