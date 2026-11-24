const { expect } = require('chai');

const AirConAccessory = require('../accessories/aircon');
const HumidifierDehumidifierAccessory = require('../accessories/humidifier-dehumidifier');

describe('file-backed sensor error handling', () => {
  it('uses the last temperature and humidity when a configured temperature file is missing', async () => {
    const accessory = Object.create(AirConAccessory.prototype);
    accessory.config = {
      temperatureFilePath: '/path/that/does/not/exist/homebridge-broadlink-temperature',
      noHumidity: false,
      batteryAlerts: true
    };
    accessory.logLevel = 2;
    accessory.log = () => {};
    accessory.name = 'Missing temperature file';
    accessory.state = { currentTemperature: 21.5, currentHumidity: 44 };

    const values = await new Promise((resolve) => {
      accessory.onTemperature = (temperature, humidity) => resolve({ temperature, humidity });
      accessory.updateTemperatureFromFile();
    });

    expect(values).to.deep.equal({ temperature: 21.5, humidity: 44 });
    expect(accessory.state.batteryLevel).to.equal(100);
  });

  it('uses the last temperature when a 1-Wire sensor file is missing', async () => {
    const accessory = Object.create(AirConAccessory.prototype);
    accessory.config = { w1DeviceID: 'homebridge-broadlink-missing-w1-device' };
    accessory.logLevel = 2;
    accessory.log = () => {};
    accessory.name = 'Missing W1 sensor';
    accessory.state = { currentTemperature: 18.75 };

    const temperature = await new Promise((resolve) => {
      accessory.onTemperature = value => resolve(value);
      accessory.updateTemperatureFromW1();
    });

    expect(temperature).to.equal(18.75);
    expect(accessory.state.batteryLevel).to.equal(100);
  });

  it('uses the last humidity when a configured humidity file is missing', async () => {
    const accessory = Object.create(HumidifierDehumidifierAccessory.prototype);
    accessory.config = {
      humidityFilePath: '/path/that/does/not/exist/homebridge-broadlink-humidity',
      batteryAlerts: true
    };
    accessory.logLevel = 2;
    accessory.log = () => {};
    accessory.name = 'Missing humidity file';
    accessory.state = { currentHumidity: 52 };

    const humidity = await new Promise((resolve) => {
      accessory.onHumidity = (temperature, value) => resolve(value);
      accessory.updateHumidityFromFile();
    });

    expect(humidity).to.equal(52);
  });
});
