const { expect } = require('chai');
const { EventEmitter } = require('node:events');
const mqtt = require('mqtt');
const HomebridgeAccessory = require('../base/accessory');

describe('MQTT TLS certificate verification', () => {
  let originalConnect;
  let captured;

  beforeEach(() => {
    originalConnect = mqtt.connect;
    captured = null;
    mqtt.connect = (url, options) => {
      captured = { url, options };
      return new EventEmitter();
    };
  });

  afterEach(() => {
    mqtt.connect = originalConnect;
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
});
