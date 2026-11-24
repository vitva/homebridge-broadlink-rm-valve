const path = require('path');
const nodePersist = require('node-persist');

const init = ({ homebridge }) => {
  // Homebridge Verified requires plugin data to remain inside Homebridge storage.
  // Do not allow a config override to redirect persistent state elsewhere.
  const storagePath = homebridge.user.storagePath();

  nodePersist.initSync({
    dir: path.join(storagePath, 'plugin-persist', 'homebridge-broadlink-rm'),
    forgiveParseErrors: true
  });
};

const clear = ({ host, name }) => {
  if (!host) {host = 'default';}

  return nodePersist.removeItemSync(`${host}-${name}`);
};

const load = ({ host, name }) => {
  if (!host) {host = 'default';}

  return nodePersist.getItemSync(`${host}-${name}`);
};

const save = ({ host, name, state }) => {
  if (!host) {host = 'default';}

  return nodePersist.setItemSync(`${host}-${name}`, state);
};

module.exports = {
  init,
  clear,
  load,
  save
};
