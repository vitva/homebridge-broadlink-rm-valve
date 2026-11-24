const uuid = require('uuid')
const EventEmitter = require('events')

class FakeDevice extends EventEmitter {

  constructor () {
    super()
    const identifier = uuid.v4()

    this.host = {
      address: identifier,
      macAddress: identifier
    };

    this.callbacks = {};

    // Fake transport keeps sends synchronous for deterministic legacy tests.
    // Production devices still receive the real async mutex in getDevice().
    this.mutex = {
      use: (callback) => callback()
    };

    this.isUnitTestDevice = true;

    this.resetSentHexCodes();
  }

  resetSentHexCodes () {
    this.sentHexCodes = []
  }

  getSentHexCodeCount () {
    return this.sentHexCodes.length
  }

  hasSentCode (hexCode) {
    return (this.sentHexCodes.indexOf(hexCode) > -1);
  }

  hasSentCodes (hexCodes) {
    let hasSentCodes = true
    
    hexCodes.forEach((hexCode) => {
      if (this.sentHexCodes.indexOf(hexCode) === -1) {hasSentCodes = false}
    })
  
    return hasSentCodes
  }

  sendData (hexBufferData, debug, originalHexString) {
    if (!hexBufferData) {throw new Error('Missing HEX Data')}

    this.sentHexCodes.push(originalHexString)
  }

  on (type, callback) {
    this.callbacks[type] = callback;
    return super.on(type, callback);
  }

  enterLearning () {
    if (this.learningError) {throw this.learningError;}
  }

  enterRFSweep () {
    if (this.rfSweepError) {throw this.rfSweepError;}
  }

  checkData () {
    if (this.checkDataError) {throw this.checkDataError;}
  }

  checkRFData () {
    if (this.checkRFDataError) {throw this.checkRFDataError;}
  }

  checkRFData2 () {
    if (this.checkRFData2Error) {throw this.checkRFData2Error;}
  }

  cancelLearn () {
    if (this.cancelLearnError) {throw this.cancelLearnError;}
  }

  sendFakeOnCallback (type, value) {
    const callback = this.callbacks[type];

    if(callback) {callback(value);}
  }

  checkTemperature () {
    
  }
}

module.exports = FakeDevice