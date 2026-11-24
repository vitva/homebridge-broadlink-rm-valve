const { getDevice } = require('./getDevice');

let closeClient = null;
let timeout = null;
let getDataTimeout = null;

const stop = (log, device, logLevel) => {
  // Reset existing learn requests
  if (!closeClient) {return;}

  closeClient();
  closeClient = null;

  log(`\x1b[35m[INFO]\x1b[0m Learn Code (stopped)`);
  if(this.initalDebug !== undefined && device) {device.debug = this.initalDebug;}
}

const start = (host, callback, turnOffCallback, log, disableTimeout, logLevel) => {
  stop()

  // Get the Broadlink device
  const device = getDevice({ host, log, learnOnly: true });
  if (!device) {
    return log(`\x1b[31m[ERROR]\x1b[0m Learn Code (Couldn't learn code, device not found)`);
  }  

  this.initalDebug = device.debug;
  if (logLevel <=1) {device.debug = true;}

  if (!device.enterLearning) {return log(`\x1b[31m[ERROR]\x1b[0m Learn Code (IR learning not supported for device at ${host})`);}

  let onRawData

  closeClient = (err) => {
    if (timeout) {clearTimeout(timeout);}
    timeout = null;

    if (getDataTimeout) {clearTimeout(getDataTimeout);}
    getDataTimeout = null;

    device.removeListener('rawData', onRawData);
    try {
      device.cancelLearn();
    } catch (error) {
      if (log) {log(`Learn Code cancel error: ${error.message || error}`);}
    }
  };

  onRawData = (message) => {
    if (!closeClient) {return;}

    const hex = message.toString('hex');
    log(`\x1b[35m[RESULT]\x1b[0m Learn Code (learned hex code: ${hex})`);
    log(`\x1b[35m[INFO]\x1b[0m Learn Code (complete)`);

    closeClient();

    turnOffCallback();
  };

  device.on('rawData', onRawData);

  try {
    device.enterLearning();
  } catch (error) {
    log(`\x1b[31m[ERROR]\x1b[0m Learn Code (could not start learning: ${error.message || error})`);
    closeClient();
    closeClient = null;
    return;
  }
  log(`Learn Code (ready)`);

  if (callback) {callback();}

  getDataTimeout = setTimeout(() => {
    getData(device, log);
  }, 1000)

  if (disableTimeout) {return;}

  // Timeout the client after 10 seconds
  timeout = setTimeout(() => {
    log('\x1b[35m[INFO]\x1b[0m Learn Code (stopped - 10s timeout)');
    try {
      device.cancelLearn();
    } catch (error) {
      log(`Learn Code cancel error: ${error.message || error}`);
    }

    closeClient();

    turnOffCallback();
  }, 10000); // 10s
}

const getData = (device, log) => {
  if (getDataTimeout) {clearTimeout(getDataTimeout);}
  if (!closeClient) {return;}

  try {
    device.checkData();
  } catch (error) {
    log(`\x1b[31m[ERROR]\x1b[0m Learn Code (failed to request learned data: ${error.message || error})`);
    stop(log, device);
    return;
  }

  getDataTimeout = setTimeout(() => {
    getData(device, log);
  }, 1000);
}

module.exports = { start, stop }
