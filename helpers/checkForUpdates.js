const versionCheck = require('github-version-checker');
const pkg = require('../package.json');

const options = {
  repo: 'homebridge-broadlink-rm-valve',
  owner: 'vitva',
  currentVersion: pkg.version,
  // This fork uses valve prerelease tags (4.4.21-valve.N) for its releases.
  // Include prereleases so users can be notified when the next valve build is published.
  excludePrereleases: false
};

const checkForUpdates = (log) => {
  versionCheck(options, (error, update) => {
    if (error) {
      return;
    }
    if (update) {
      log(`\x1b[32m[UPDATE AVAILABLE] \x1b[0mVersion ${update.name} of Homebridge Broadlink RM Pro + Valve is available. The release notes can be found here: \x1b[4mhttps://github.com/${options.owner}/${options.repo}/releases/\x1b[0m`);
    }
  });
};

module.exports = checkForUpdates;
