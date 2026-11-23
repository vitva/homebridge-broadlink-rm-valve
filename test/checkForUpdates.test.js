const { expect } = require('chai');
const checkerModulePath = require.resolve('github-version-checker');
const helperModulePath = require.resolve('../helpers/checkForUpdates');

describe('update checker', () => {
  let originalChecker, originalHelper, checkerOptions, checkerCallback, checkForUpdates;
  beforeEach(() => {
    originalChecker = require.cache[checkerModulePath].exports;
    originalHelper = require.cache[helperModulePath];
    checkerOptions = null;
    checkerCallback = null;
    require.cache[checkerModulePath].exports = (options, callback) => { checkerOptions = options; checkerCallback = callback; };
    delete require.cache[helperModulePath];
    checkForUpdates = require('../helpers/checkForUpdates');
  });
  afterEach(() => {
    require.cache[checkerModulePath].exports = originalChecker;
    if (originalHelper) {
      require.cache[helperModulePath] = originalHelper;
    } else {
      delete require.cache[helperModulePath];
    }

  });
  it('includes valve prereleases when checking for updates', () => {
    checkForUpdates(() => {});
    expect(checkerOptions.excludePrereleases).to.equal(false);
  });
  it('links update notices to this fork release page', () => {
    const messages = [];
    checkForUpdates((message) => messages.push(message));
    checkerCallback(null, { name: '4.4.21-valve.6' });
    expect(messages).to.have.length(1);
    expect(messages[0]).to.include('https://github.com/vitva/homebridge-broadlink-rm-valve/releases/');
    expect(messages[0]).to.not.include('kiwi-cam/homebridge-broadlink-rm');
  });
  it('silently ignores version-check errors', () => {
    const messages = [];
    checkForUpdates((message) => messages.push(message));
    checkerCallback(new Error('network unavailable'), null);
    expect(messages).to.have.length(0);
  });
});
