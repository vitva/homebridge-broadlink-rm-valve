const filterConfiguredAccessories = (accessories, log = () => {}, logLevel = 2) => {
  if (!Array.isArray(accessories)) {
    throw new Error('[CONFIG ERROR] accessories should be an array of objects.');
  }

  return accessories.filter((accessory) => {
    if (!accessory || typeof accessory !== 'object' || Array.isArray(accessory)) {
      if (logLevel <= 3) {log('[CONFIG WARNING] Ignoring an empty or invalid accessory row.');}
      return false;
    }

    if (!accessory.type && !accessory.name && !accessory.data && !accessory.host) {
      if (logLevel <= 3) {log('[CONFIG WARNING] Ignoring an empty accessory placeholder from the Homebridge Config UI.');}
      return false;
    }

    return true;
  });
};

const filterConfiguredHosts = (hosts, log = () => {}, logLevel = 2) => {
  if (hosts !== undefined && !Array.isArray(hosts)) {
    throw new Error('[CONFIG ERROR] hosts should be an array of objects.');
  }

  const configuredHosts = (hosts || []).filter((host) =>
    host && typeof host === 'object' && !Array.isArray(host) && (host.address || host.mac)
  );

  if (hosts && hosts.length > configuredHosts.length && logLevel <= 3) {
    log(`[CONFIG WARNING] Ignoring ${hosts.length - configuredHosts.length} empty or invalid Broadlink host row(s).`);
  }

  return configuredHosts;
};

module.exports = { filterConfiguredAccessories, filterConfiguredHosts };
