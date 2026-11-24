const { getDevice } = require('./getDevice');

let currentSession = null;

const closeSession = (session) => {
  if (!session || !session.active) {return;}

  session.active = false;

  ['stopTimer', 'timeout', 'timeoutStopTimer', 'getDataTimeout', 'getDataTimeout2', 'getDataTimeout3']
    .forEach((key) => {
      if (session[key]) {clearTimeout(session[key]);}
      session[key] = null;
    });

  const { device, onRawData, onRawData2, onRawData3 } = session;
  if (device) {
    if (onRawData) {device.removeListener('rawRFData', onRawData);}
    if (onRawData2) {device.removeListener('rawRFData2', onRawData2);}
    if (onRawData3) {device.removeListener('rawData', onRawData3);}
  }
};

const stop = (log) => {
  const session = currentSession;
  if (!session || !session.active || session.stopping) {return;}

  // Mark this session as stopping immediately. Its callbacks must not affect
  // a new scan while Broadlink is given time to leave RF sweep mode.
  session.stopping = true;

  if (session.device) {
    try {
      session.device.cancelLearn();
    } catch (error) {
      if (log) {log(`Scan RF cancel error: ${error.message || error}`);}
    }
  }

  session.stopTimer = setTimeout(() => {
    closeSession(session);
    if (currentSession === session) {currentSession = null;}
    if (log) {log(`\x1b[35m[INFO]\x1b[0m Scan RF (stopped)`);}
  }, 500);

  if (session.initialDebug !== undefined && session.device) {
    session.device.debug = session.initialDebug;
  }
};

const start = (host, callback, turnOffCallback, log, disableTimeout, logLevel) => {
  stop(log);

  const session = {
    active: true,
    stopping: false,
    device: null,
    initialDebug: undefined,
    stopTimer: null,
    timeout: null,
    timeoutStopTimer: null,
    getDataTimeout: null,
    getDataTimeout2: null,
    getDataTimeout3: null,
    onRawData: null,
    onRawData2: null,
    onRawData3: null
  };
  currentSession = session;

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
  const isSessionActive = () => session.active && !session.stopping && currentSession === session;
  const failSession = (error) => {
    if (!isSessionActive()) {return;}
    if (log) {log(`\x1b[31m[ERROR]\x1b[0m Scan RF (${error.message || error})`);}
    if (session.device) {
      try {
        session.device.cancelLearn();
      } catch (cancelError) {
        if (log) {log(`Scan RF cancel error: ${cancelError.message || cancelError}`);}
      }
    }
    closeSession(session);
    if (currentSession === session) {currentSession = null;}
    completeStart(error);
    turnOffOnce();
  };

  // Get the Broadlink device.
  const device = getDevice({ host, log, learnOnly: true });
  if (!device) {
    failSession(new Error('Broadlink device not found'));
    return;
  }

  session.device = device;
  session.initialDebug = device.debug;
  if (logLevel <= 1) {device.debug = true;}

  if (!device.enterLearning) {
    failSession(new Error(`IR/RF learning not supported for device at ${host}`));
    return;
  }
  if (!device.enterRFSweep) {
    failSession(new Error(`RF learning not supported for device (${device.type}) at ${host}`));
    return;
  }

  const getData = () => {
    if (session.getDataTimeout) {clearTimeout(session.getDataTimeout);}
    session.getDataTimeout = null;
    if (!isSessionActive()) {return;}

    try {
      device.checkRFData();
    } catch (error) {
      failSession(error);
      return;
    }

    session.getDataTimeout = setTimeout(getData, 1000);
  };

  const getData2 = () => {
    if (session.getDataTimeout2) {clearTimeout(session.getDataTimeout2);}
    session.getDataTimeout2 = null;
    if (!isSessionActive()) {return;}

    try {
      device.checkRFData2();
    } catch (error) {
      failSession(error);
      return;
    }

    session.getDataTimeout2 = setTimeout(getData2, 1000);
  };

  const getData3 = () => {
    if (session.getDataTimeout3) {clearTimeout(session.getDataTimeout3);}
    session.getDataTimeout3 = null;
    if (!isSessionActive()) {return;}

    try {
      device.checkData();
    } catch (error) {
      failSession(error);
      return;
    }

    session.getDataTimeout3 = setTimeout(getData3, 1000);
  };

  session.onRawData = () => {
    if (!isSessionActive()) {return;}

    if (session.getDataTimeout) {clearTimeout(session.getDataTimeout);}
    session.getDataTimeout = null;

    log(`\x1b[35m[INFO]\x1b[0m Scan RF (found frequency - 1 of 2)`);

    if (device.type === 0x279d || device.type === 0x27a9) {
      try {
        device.enterLearning();
      } catch (error) {
        failSession(error);
      }
      return;
    }

    log(`\x1b[35m[ACTION]\x1b[0m Keep holding that button!`);
    session.getDataTimeout2 = setTimeout(getData2, 1000);
  };

  session.onRawData2 = () => {
    if (!isSessionActive()) {return;}

    if (session.getDataTimeout2) {clearTimeout(session.getDataTimeout2);}
    session.getDataTimeout2 = null;

    log(`\x1b[35m[INFO]\x1b[0m Scan RF (found frequency - 2 of 2)`);
    log(`\x1b[35m[ACTION]\x1b[0m Press the RF button multiple times with a pause between them to get code.`);
    session.getDataTimeout3 = setTimeout(getData3, 1000);
  };

  session.onRawData3 = (message) => {
    if (!isSessionActive()) {return;}

    const hex = message.toString('hex');
    log(`\x1b[35m[INFO]\x1b[0m Scan RF (complete)`);
    log(`\x1b[35m[RESULT]\x1b[0m Hex Code: ${hex}`);

    try {
      device.cancelLearn();
    } catch (error) {
      log(`Scan RF cancel error: ${error.message || error}`);
    }

    closeSession(session);
    if (currentSession === session) {currentSession = null;}
    turnOffOnce();
  };

  device.on('rawRFData', session.onRawData);
  device.on('rawRFData2', session.onRawData2);
  device.on('rawData', session.onRawData3);

  try {
    device.enterRFSweep();
  } catch (error) {
    failSession(error);
    return;
  }

  log(`\x1b[35m[INFO]\x1b[0m Scan RF (scanning)`);
  log(`\x1b[35m[ACTION]\x1b[0m Hold down the button that sends the RF frequency.`);
  completeStart();

  session.getDataTimeout = setTimeout(getData, 1000);

  if (disableTimeout) {return;}

  // Timeout the client after 60 seconds.
  session.timeout = setTimeout(() => {
    if (!isSessionActive()) {return;}

    try {
      device.cancelLearn();
    } catch (error) {
      log(`Scan RF cancel error: ${error.message || error}`);
    }

    session.stopping = true;
    session.timeoutStopTimer = setTimeout(() => {
      if (!session.active) {return;}
      log(`\x1b[35m[INFO]\x1b[0m Scan RF (stopped - 60s timeout)`);
      closeSession(session);
      if (currentSession === session) {currentSession = null;}
      turnOffOnce();
    }, 1000);
  }, 60 * 1000);
};

module.exports = { start, stop };
