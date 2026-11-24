const { getDevice } = require('./getDevice');

let closeClient = null;
let isClosingClient = false;
let timeout = null;
let getDataTimeout = null;
let getDataTimeout2 = null;
let getDataTimeout3 = null;

let currentDevice

const stop = (log, device, logLevel) => {
  // Reset existing learn requests
  if (!closeClient || isClosingClient) {return;}

  isClosingClient = true;

  if (currentDevice) {
    try {
      currentDevice.cancelLearn();
    } catch (error) {
      if (log) {log(`Scan RF cancel error: ${error.message || error}`);}
    }
  }

  setTimeout(() => {
    closeClient();
    closeClient = null;
    isClosingClient = false;

    if (log) {log(`\x1b[35m[INFO]\x1b[0m Scan RF (stopped)`);}
  }, 500)

  if(this.initalDebug !== undefined && currentDevice) {currentDevice.debug = this.initalDebug;}
}

const start = (host, callback, turnOffCallback, log, disableTimeout, logLevel) => {
  stop()

  // Get the Broadlink device
  const device = getDevice({ host, log, learnOnly: true })
  if (!device) { 
    return log(`\x1b[35m[INFO]\x1b[0m Learn Code (Couldn't learn code, device not found)`);
  }

  this.initalDebug = device.debug;
  if (logLevel <=1) {device.debug = true;}

  if (!device.enterLearning) {return log(`\x1b[31m[ERROR]\x1b[0m Learn Code (IR/RF learning not supported for device at ${host})`);}
  if (!device.enterRFSweep) {return log(`\x1b[31m[ERROR]\x1b[0m Scan RF (RF learning not supported for device (${device.type}) at ${host})`);}

  currentDevice = device

  let onRawData
  let onRawData2
  let onRawData3

  closeClient = (err) => {
    if (timeout) {clearTimeout(timeout);}
    timeout = null;

    if (getDataTimeout) {clearTimeout(getDataTimeout);}
    getDataTimeout = null;

    if (getDataTimeout2) {clearTimeout(getDataTimeout2);}
    getDataTimeout2 = null;

    if (getDataTimeout3) {clearTimeout(getDataTimeout3);}
    getDataTimeout3 = null;


    device.removeListener('rawRFData', onRawData);
    device.removeListener('rawRFData2', onRawData2);
    device.removeListener('rawData', onRawData3);
  };

  onRawData = (message) => {
    if (!closeClient) {return;}

    if (getDataTimeout) {clearTimeout(getDataTimeout);}
    getDataTimeout = null;

    log(`\x1b[35m[INFO]\x1b[0m Scan RF (found frequency - 1 of 2)`);

    if (device.type === 0x279d || device.type === 0x27a9) {
      try {
        return device.enterLearning();
      } catch (error) {
        log(`\x1b[31m[ERROR]\x1b[0m Scan RF (could not restart learning: ${error.message || error})`);
        stop(log, device, logLevel);
        return;
      }
    }

    log(`\x1b[35m[ACTION]\x1b[0m Keep holding that button!`)

    getDataTimeout2 = setTimeout(() => {
      getData2(device, log, logLevel);
    }, 1000);
  };

  onRawData2 = (message) => {
    if (!closeClient) {return;}

    if (getDataTimeout2) {clearTimeout(getDataTimeout2);}
    getDataTimeout = null;

    log(`\x1b[35m[INFO]\x1b[0m Scan RF (found frequency - 2 of 2)`)
    log(`\x1b[35m[ACTION]\x1b[0m Press the RF button multiple times with a pause between them to get code.`);

    getDataTimeout3 = setTimeout(() => {
      getData3(device, log, logLevel);
    }, 1000);
  };

  onRawData3 = (message) => {
    if (!closeClient) {return;}

    const hex = message.toString('hex');
    log(`\x1b[35m[INFO]\x1b[0m Scan RF (complete)`);
    log(`\x1b[35m[RESULT]\x1b[0m Hex Code: ${hex}`);

    try {
      device.cancelLearn();
    } catch (error) {
      log(`Scan RF cancel error: ${error.message || error}`);
    }

    closeClient();

    turnOffCallback();
  };

  device.on('rawRFData', onRawData);
  device.on('rawRFData2', onRawData2);
  device.on('rawData', onRawData3);

  try {
    device.enterRFSweep();
  } catch (error) {
    log(`\x1b[31m[ERROR]\x1b[0m Scan RF (could not start scan: ${error.message || error})`);
    closeClient();
    closeClient = null;
    currentDevice = null;
    return;
  }
  log(`\x1b[35m[INFO]\x1b[0m Scan RF (scanning)`);
  log(`\x1b[35m[ACTION]\x1b[0m Hold down the button that sends the RF frequency.`);

  if (callback) {callback();}

  getDataTimeout = setTimeout(() => {
    getData(device, log, logLevel);
  }, 1000);

  if (disableTimeout) {return;}

  // Timeout the client after 60 seconds
  timeout = setTimeout(() => {
    try {
      device.cancelLearn();
    } catch (error) {
      log(`Scan RF cancel error: ${error.message || error}`);
    }

    setTimeout(() => {
      log('\x1b[35m[INFO]\x1b[0m Scan RF (stopped - 60s timeout)');
      closeClient();

      turnOffCallback();
    }, 1000);
  }, 60 * 1000); //60s
}

const getData = (device, log, logLevel) => {
  if (getDataTimeout) {clearTimeout(getDataTimeout);}
  if (!closeClient) {return;}

  try {
    device.checkRFData();
  } catch (error) {
    log(`\x1b[31m[ERROR]\x1b[0m Scan RF (failed to request frequency data: ${error.message || error})`);
    stop(log, device, logLevel);
    return;
  }

  getDataTimeout = setTimeout(() => {
    getData(device, log, logLevel);
  }, 1000);
}

const getData2 = (device, log, logLevel) => {
  if (getDataTimeout2) {clearTimeout(getDataTimeout2);}
  if (!closeClient) {return;}

  try {
    device.checkRFData2();
  } catch (error) {
    log(`\x1b[31m[ERROR]\x1b[0m Scan RF (failed to request second frequency data: ${error.message || error})`);
    stop(log, device, logLevel);
    return;
  }

  getDataTimeout2 = setTimeout(() => {
    getData2(device, log, logLevel);
  }, 1000);
}

const getData3 = (device, log, logLevel) => {
  if (getDataTimeout3) {clearTimeout(getDataTimeout3);}
  if (!closeClient) {return;}

  try {
    device.checkData();
  } catch (error) {
    log(`\x1b[31m[ERROR]\x1b[0m Scan RF (failed to request learned code: ${error.message || error})`);
    stop(log, device, logLevel);
    return;
  }

  getDataTimeout3 = setTimeout(() => {
    getData3(device, log, logLevel);
  }, 1000);
}

module.exports = { start, stop }
