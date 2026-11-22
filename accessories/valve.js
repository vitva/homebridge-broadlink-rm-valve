const BroadlinkRMAccessory = require('./accessory');
const ServiceManagerTypes = require('../helpers/serviceManagerTypes');

/**
 * A Broadlink-controlled HomeKit water valve.
 * State is virtual: Broadlink devices send commands but receive no feedback
 * from the physical valve. The displayed state therefore reflects the last
 * command successfully handed to the Broadlink send routine.
 */
class ValveAccessory extends BroadlinkRMAccessory {

  setupServiceManager () {
    const { data, name, serviceManagerType, config } = this;
    const { open, close } = data || {};

    if (open === undefined || close === undefined) {
      throw new Error(`Valve "${name}" requires data.open and data.close commands.`);
    }

    this.serviceManager = new ServiceManagerTypes[serviceManagerType](name, Service.Valve, this.log);

    const valveType = (config.valveType === undefined)
      ? 3
      : config.valveType;
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
    const isActive = value === Characteristic.Active.ACTIVE;
    const command = isActive ? this.data.open : this.data.close;

    try {
      await this.performSend(command);
      this.state.active = isActive ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE;
      this.state.inUse = isActive ? Characteristic.InUse.IN_USE : Characteristic.InUse.NOT_IN_USE;
      this.serviceManager.updateCharacteristic(Characteristic.InUse, this.state.inUse);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }
}

module.exports = ValveAccessory;
