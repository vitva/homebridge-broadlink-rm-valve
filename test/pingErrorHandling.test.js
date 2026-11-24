const { expect } = require('chai');
const ping = require('ping');

const { startPing } = require('../helpers/getDevice');

describe('Broadlink ping error handling', () => {
  it('logs an asynchronous probe error without throwing or changing device state', async () => {
    const originalProbe = ping.sys.probe;
    const originalSetInterval = global.setInterval;
    const device = {
      host: { address: '192.0.2.10', macAddress: '00:11:22:33:44:55' },
      state: 'unknown',
      retryCount: 1
    };
    const messages = [];
    let callbackPromise;

    ping.sys.probe = (address, callback) => {
      callbackPromise = new Promise((resolve, reject) => {
        setImmediate(() => {
          try {
            callback(false, new Error('simulated ping failure'));
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    };
    global.setInterval = (callback) => {
      callback();
      return 0;
    };

    try {
      expect(() => startPing(device, message => messages.push(message))).not.to.throw();
      await callbackPromise;

      expect(messages).to.have.length(1);
      expect(messages[0]).to.include('simulated ping failure');
      expect(device.state).to.equal('unknown');
      expect(device.retryCount).to.equal(1);
    } finally {
      ping.sys.probe = originalProbe;
      global.setInterval = originalSetInterval;
    }
  });
});
