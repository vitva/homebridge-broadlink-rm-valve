const { expect } = require('chai');
const {
  filterConfiguredAccessories,
  filterConfiguredHosts
} = require('../helpers/filterConfiguration');

describe('Homebridge Config UI placeholder filtering', () => {
  it('ignores a blank accessory row but keeps a partially configured row for validation', () => {
    const logs = [];
    const accessories = filterConfiguredAccessories([
      {
        disabled: false,
        mqttAllowInsecureTLS: false,
        valveType: 3,
        debug: false,
        resendHexAfterReload: false
      },
      { name: 'Incomplete accessory' },
      { name: 'Working accessory', type: 'switch' }
    ], message => logs.push(message), 2);

    expect(accessories).to.deep.equal([
      { name: 'Incomplete accessory' },
      { name: 'Working accessory', type: 'switch' }
    ]);
    expect(logs).to.have.length(1);
  });

  it('ignores blank host rows so automatic discovery can remain enabled', () => {
    const logs = [];
    const hosts = filterConfiguredHosts([
      { isRM4: false, isRFSupported: false },
      {},
      { address: '192.168.1.20', mac: '34:ea:34:12:34:56', isRM4: true }
    ], message => logs.push(message), 2);

    expect(hosts).to.deep.equal([
      { address: '192.168.1.20', mac: '34:ea:34:12:34:56', isRM4: true }
    ]);
    expect(logs).to.have.length(1);
  });

  it('rejects non-array host and accessory configuration', () => {
    expect(() => filterConfiguredHosts({ address: '192.168.1.20' }))
      .to.throw('hosts should be an array');
    expect(() => filterConfiguredAccessories({ type: 'switch' }))
      .to.throw('accessories should be an array');
  });
});
