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
    // Keep multi-step open/close sequences atomic relative to other valve actions.
    this.commandQueue = Promise.resolve();
    const { open, close } = data || {};

    if (!isValidCommand(open) || !isValidCommand(close)) {
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
  }

  async setActive (value, callback) {
    if (value !== Characteristic.Active.ACTIVE && value !== Characteristic.Active.INACTIVE) {
      callback(new Error(`Valve "${this.name}" received an invalid Active value: ${value}.`));
      return;
    }

    const isActive = value === Characteristic.Active.ACTIVE;
    const command = isActive ? this.data.open : this.data.close;

    const operation = this.commandQueue.then(async () => {
      const device = getDevice({ host: this.host, log: this.log });
      if (!device || typeof device.sendData !== 'function') {
        throw new Error(\`Valve "\${this.name}" cannot send the command: no ready Broadlink RM device is available.\`);
      }

      await this.performSend(command);
      this.state.active = isActive ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE;
      this.state.inUse = isActive ? Characteristic.InUse.IN_USE : Characteristic.InUse.NOT_IN_USE;
      this.serviceManager.updateCharacteristic(Characteristic.InUse, this.state.inUse);
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
