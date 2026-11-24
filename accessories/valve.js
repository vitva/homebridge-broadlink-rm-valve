const BroadlinkRMAccessory = require('./accessory');
const ServiceManagerTypes = require('../helpers/serviceManagerTypes');
const { getDevice } = require('../helpers/getDevice');

const isValidCommand = (command) => {
  if (typeof command === 'string') {
    return command.trim().length > 0;
  }

  return Array.isArray(command) &&
    command.length > 0 &&
    command.every((step) => step && typeof step.data === 'string' && step.data.trim().length > 0);
};

/**
 * A Broadlink-controlled HomeKit water valve.
 * State is virtual: Broadlink devices send commands but receive no feedback
 * from the physical valve. The displayed state therefore reflects the last
 * command dispatched to an available Broadlink device, not physical feedback.
 */
class ValveAccessory extends BroadlinkRMAccessory {

  setupServiceManager () {
    const { data, name, serviceManagerType, config } = this;
    this.testMode = config.testMode === true;
    // Keep multi-step open/close sequences atomic relative to other valve actions.
    this.commandQueue = Promise.resolve();
    this.closeTimer = null;
    this.remainingTimer = null;
    this.timerDeadline = null;
    const { open, close } = data || {};

    if (!this.testMode && (!isValidCommand(open) || !isValidCommand(close))) {
      throw new Error(`Valve "${name}" requires valid data.open and data.close commands (hex strings or command arrays).`);
    }

    this.serviceManager = new ServiceManagerTypes[serviceManagerType](name, Service.Valve, this.log);

    const valveType = (config.valveType === undefined)
      ? 3
      : config.valveType;
    if (!Number.isInteger(valveType) || valveType < 0 || valveType > 3) {
      throw new Error(`Valve "${name}" has invalid valveType. Use a HomeKit ValveType from 0 to 3.`);
    }
    this.serviceManager.setCharacteristic(Characteristic.ValveType, valveType);

    // HomeKit duration is expressed in seconds. Zero means no automatic close.
    this.serviceManager.setCharacteristic(Characteristic.SetDuration, 0);
    this.serviceManager.setCharacteristic(Characteristic.RemainingDuration, 0);

    this.serviceManager.addGetCharacteristic({
      name: 'active',
      type: Characteristic.Active,
      method: this.getCharacteristicValue,
      bind: this,
      props: { propertyName: 'active' }
    });
    this.serviceManager.addSetCharacteristic({
      name: 'active',
      type: Characteristic.Active,
      method: this.setActive,
      bind: this
    });
    this.serviceManager.addGetCharacteristic({
      name: 'inUse',
      type: Characteristic.InUse,
      method: this.getCharacteristicValue,
      bind: this,
      props: { propertyName: 'inUse' }
    });
    this.serviceManager.addGetCharacteristic({
      name: 'setDuration',
      type: Characteristic.SetDuration,
      method: this.getCharacteristicValue,
      bind: this,
      props: { propertyName: 'setDuration' }
    });
    this.serviceManager.addSetCharacteristic({
      name: 'setDuration',
      type: Characteristic.SetDuration,
      method: this.setDuration,
      bind: this
    });
    this.serviceManager.addGetCharacteristic({
      name: 'remainingDuration',
      type: Characteristic.RemainingDuration,
      method: this.getCharacteristicValue,
      bind: this,
      props: { propertyName: 'remainingDuration' }
    });
  }

  setDuration (value, callback) {
    if (!Number.isInteger(value) || value < 0) {
      callback(new Error(`Valve "${this.name}" received an invalid SetDuration value: ${value}.`));
      return;
    }

    this.state.setDuration = value;
    this.serviceManager.updateCharacteristic(Characteristic.SetDuration, value);

    if (this.state.active === Characteristic.Active.ACTIVE) {
      this.armCloseTimer(value);
    }

    callback(null);
  }

  armCloseTimer (duration) {
    this.clearCloseTimer();

    if (duration <= 0) {
      this.state.remainingDuration = 0;
      this.serviceManager.updateCharacteristic(Characteristic.RemainingDuration, 0);
      return;
    }

    this.timerDeadline = Date.now() + (duration * 1000);
    this.updateRemainingDuration();
    this.remainingTimer = setInterval(() => this.updateRemainingDuration(), 1000);
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      this.clearRemainingTimer();
      this.log(`Valve "${this.name}" timer expired; sending automatic close command.`);
      this.setActive(Characteristic.Active.INACTIVE, (error) => {
        if (error) {
          this.log(`Valve "${this.name}" automatic close failed: ${error.message}`);
        }
      });
    }, duration * 1000);
  }

  updateRemainingDuration () {
    if (!this.timerDeadline) {
      return;
    }

    const remaining = Math.max(0, Math.ceil((this.timerDeadline - Date.now()) / 1000));
    this.state.remainingDuration = remaining;
    this.serviceManager.updateCharacteristic(Characteristic.RemainingDuration, remaining);
  }

  clearRemainingTimer () {
    if (this.remainingTimer) {
      clearInterval(this.remainingTimer);
      this.remainingTimer = null;
    }
  }

  clearCloseTimer () {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }

    this.clearRemainingTimer();
    this.timerDeadline = null;
  }

  async setActive (value, callback) {
    if (value !== Characteristic.Active.ACTIVE && value !== Characteristic.Active.INACTIVE) {
      callback(new Error(`Valve "${this.name}" received an invalid Active value: ${value}.`));
      return;
    }

    const isActive = value === Characteristic.Active.ACTIVE;
    const command = isActive ? (this.data && this.data.open) : (this.data && this.data.close);

    const operation = this.commandQueue.then(async () => {
      if (this.testMode) {
        this.log(`Valve "${this.name}" test mode: simulated ${isActive ? 'open' : 'close'} action (no Broadlink command sent).`);
      } else {
        const device = getDevice({ host: this.host, log: this.log });
        if (!device || typeof device.sendData !== 'function') {
          throw new Error(`Valve "${this.name}" cannot send the command: no ready Broadlink RM device is available.`);
        }

        await this.performSend(command);
      }
      this.state.active = isActive ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE;
      this.state.inUse = isActive ? Characteristic.InUse.IN_USE : Characteristic.InUse.NOT_IN_USE;
      // Explicitly publish both Valve state characteristics to HomeKit.
      this.serviceManager.updateCharacteristic(Characteristic.Active, this.state.active);
      this.serviceManager.updateCharacteristic(Characteristic.InUse, this.state.inUse);

      if (isActive) {
        this.armCloseTimer(this.state.setDuration || 0);
      } else {
        this.clearCloseTimer();
        this.state.remainingDuration = 0;
        this.serviceManager.updateCharacteristic(Characteristic.RemainingDuration, 0);
      }
    });

    // Keep the queue usable after a failed command; report the failure only to this caller.
    this.commandQueue = operation.catch(() => {});

    try {
      await operation;
      callback(null);
    } catch (error) {
      callback(error);
    }
  }
}

module.exports = ValveAccessory;
