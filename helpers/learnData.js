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
  let callbackCalled = false;
  let turnOffCalled = false;
  const completeStart = (error) => {
    if (callbackCalled) {return;}
    callbackCalled = true;
    if (callback) {callback(error || null);}
  };
  const turnOffOnce = () => {
    if (turnOffCalled) {return;}
    turnOffCalled = true;
    if (turnOffCallback) {turnOffCallback();}
  };

  const device = getDevice({ host, log, learnOnly: true });
  if (!device) {
    const error = new Error('Broadlink device not found');
    log(`\x1b[31m[ERROR]\x1b[0m Learn Code (${error.message})`);
    completeStart(error);
    turnOffOnce();
    return;
  }  

  this.initalDebug = device.debug;
  if (logLevel <=1) {device.debug = true;}

  if (!device.enterLearning) {
    const error = new Error(`IR learning not supported for device at ${host}`);
    log(`\x1b[31m[ERROR]\x1b[0m Learn Code (${error.message})`);
    completeStart(error);
    turnOffOnce();
    return;
  }

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
    closeClient = null;

    turnOffOnce();
  };

  device.on('rawData', onRawData);

  try {
    device.enterLearning();
  } catch (error) {
    log(`\x1b[31m[ERROR]\x1b[0m Learn Code (could not start learning: ${error.message || error})`);
    closeClient();
    closeClient = null;
    completeStart(error);
    turnOffOnce();
    return;
  }
  log(`Learn Code (ready)`);

  completeStart();

  getDataTimeout = setTimeout(() => {
    getData(device, log, turnOffOnce);
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
    closeClient = null;

    turnOffOnce();
  }, 10000); // 10s
}

const getData = (device, log, turnOffOnce) => {
  if (getDataTimeout) {clearTimeout(getDataTimeout);}
  if (!closeClient) {return;}

  try {
    device.checkData();
  } catch (error) {
    log(`\x1b[31m[ERROR]\x1b[0m Learn Code (failed to request learned data: ${error.message || error})`);
    stop(log, device);
    if (turnOffOnce) {turnOffOnce();}
    return;
  }

  getDataTimeout = setTimeout(() => {
    getData(device, log, turnOffOnce);
  }, 1000);
}

module.exports = { start, stop }
