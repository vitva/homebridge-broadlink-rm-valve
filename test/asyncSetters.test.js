const { expect } = require('chai');

const HomebridgeAccessory = require('../base/accessory');
const { TV } = require('../accessories');
const HumidifierDehumidifierAccessory = require('../accessories/humidifier-dehumidifier');
const { log, setup } = require('./helpers/setup');

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

  it('restores the previous humidifier state when a Broadlink mode command fails', async () => {
    const accessory = Object.create(HumidifierDehumidifierAccessory.prototype);
    const previousState = Characteristic.CurrentHumidifierDehumidifierState.IDLE;
    const requestedState = Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING;
    const failure = new Error('simulated humidifier mode send failure');
    accessory.log = () => {};
    accessory.logLevel = 2;
    accessory.name = 'Async humidifier test';
    accessory.state = { currentState: requestedState, switchState: true };
    accessory.serviceManager = { updateCharacteristic: () => {} };
    accessory.performSend = async () => { throw failure; };

    let result;
    try {
      await accessory.setCurrentState('DEHUMIDIFY', previousState);
    } catch (error) {
      result = error;
    }

    expect(result).to.equal(failure);
    expect(accessory.state.currentState).to.equal(previousState);
  });

  it('waits for dehumidifier state transitions before completing the HomeKit setter action', async () => {
    const accessory = Object.create(HumidifierDehumidifierAccessory.prototype);
    accessory.config = { preventResendHex: false };
    accessory.name = 'Async humidifier test';
    accessory.log = () => {};
    accessory.logLevel = 2;
    accessory.state = {
      HumidifierThreshold: 40,
      DehumidifierThreshold: 60,
      currentState: Characteristic.CurrentHumidifierDehumidifierState.IDLE
    };
    accessory.getDesiredState = () => Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING;

    let resolveTransition;
    accessory.setCurrentState = () => new Promise(resolve => { resolveTransition = resolve; });
    let settled = false;
    const action = Promise.resolve(accessory.setDehumidifierThreshold('DEHUMIDIFY', 55))
      .then(() => { settled = true; });

    await Promise.resolve();
    await Promise.resolve();
    expect(resolveTransition).to.be.a('function');
    expect(settled).to.equal(false);

    resolveTransition();
    await action;
    expect(settled).to.equal(true);
  });

  it('waits for TV input commands before acknowledging the HomeKit write', async () => {
    const { device } = setup();
    const tv = new TV(log, {
      host: device.host.address,
      isUnitTest: true,
      persistState: false,
      data: {
        on: 'ON',
        off: 'OFF',
        inputs: [{ name: 'HDMI', data: 'HDMI' }]
      }
    }, 'FakeServiceManager');
    let resolveSend;
    let callbackCalled = false;
    tv.performSend = () => new Promise(resolve => { resolveSend = resolve; });

    const input = tv.serviceManager.getCharacteristic(Characteristic.ActiveIdentifier);
    const callbackPromise = new Promise(resolve => {
      input.setMethod(0, error => {
        callbackCalled = true;
        resolve(error || null);
      });
    });

    await Promise.resolve();
    expect(resolveSend).to.be.a('function');
    expect(callbackCalled).to.equal(false);

    resolveSend();
    expect(await callbackPromise).to.equal(null);
    expect(tv.state.input).to.equal(0);
  });

  it('returns TV command failures through HomeKit and rolls back the selected input', async () => {
    const { device } = setup();
    const tv = new TV(log, {
      host: device.host.address,
      isUnitTest: true,
      persistState: false,
      data: {
        on: 'ON',
        off: 'OFF',
        inputs: [{ name: 'HDMI', data: 'HDMI' }]
      }
    }, 'FakeServiceManager');
    const failure = new Error('simulated TV command failure');
    tv.state.input = 2;
    tv.performSend = async () => { throw failure; };

    const input = tv.serviceManager.getCharacteristic(Characteristic.ActiveIdentifier);
    const result = await new Promise(resolve => input.setMethod(0, resolve));

    expect(result).to.equal(failure);
    expect(tv.state.input).to.equal(2);
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
