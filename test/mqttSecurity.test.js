const { expect } = require('chai');
const { EventEmitter } = require('node:events');

const mqttModulePath = require.resolve('mqtt');
require(mqttModulePath);
const accessoryModulePath = require.resolve('../base/accessory');

describe('MQTT TLS certificate verification', () => {
  let captured;
  let originalMqttExports;
  let originalAccessoryModule;
  let HomebridgeAccessory;

  beforeEach(() => {
    captured = null;
    originalMqttExports = require.cache[mqttModulePath].exports;
    originalAccessoryModule = require.cache[accessoryModulePath];

    // MQTT.js exposes connect through a read-only export getter. Replace the
    // module export before loading the accessory instead of assigning to it.
    require.cache[mqttModulePath].exports = {
      connect: (url, options) => {
        captured = { url, options };
        return new EventEmitter();
      }
    };

    delete require.cache[accessoryModulePath];
    HomebridgeAccessory = require('../base/accessory');
  });

  afterEach(() => {
    require.cache[mqttModulePath].exports = originalMqttExports;

    if (originalAccessoryModule) {
      require.cache[accessoryModulePath] = originalAccessoryModule;
    } else {
      delete require.cache[accessoryModulePath];
    }
  });

  const connectWithConfig = (extraConfig = {}) => {
    const accessory = Object.create(HomebridgeAccessory.prototype);
    Object.assign(accessory, {
      config: {
        mqttURL: 'mqtts://broker.example.test',
        mqttTopic: 'home/test',
        ...extraConfig
      },
      log: () => {},
      logLevel: 2,
      name: 'MQTT TLS test',
      client_Id: 'test-client'
    });
    accessory.subscribeToMQTT();
  };

  it('verifies TLS certificates by default', () => {
    connectWithConfig();
    expect(captured).to.not.equal(null);
    expect(captured.url).to.equal('mqtts://broker.example.test');
    expect(captured.options.rejectUnauthorized).to.equal(true);
  });

  it('allows an explicit opt-in for self-signed MQTT certificates', () => {
    connectWithConfig({ mqttAllowInsecureTLS: true });
    expect(captured.options.rejectUnauthorized).to.equal(false);
  });

  it('does not allow false-like values to disable certificate verification', () => {
    connectWithConfig({ mqttAllowInsecureTLS: false });
    expect(captured.options.rejectUnauthorized).to.equal(true);
  });

  it('ignores malformed MQTT topic array entries without throwing', () => {
    connectWithConfig({ mqttTopic: [null] });
    expect(captured).to.equal(null);
  });
});
