const { expect } = require('chai');

const safeFilename = require('../helpers/safeFilename');

describe('safeFilename', () => {
  it('removes path separators and characters invalid in file names', () => {
    const filename = safeFilename('../../outside\\folder:history');

    expect(filename).not.to.include('/');
    expect(filename).not.to.include('\\');
    expect(filename).not.to.include(':');
  });

  it('preserves ordinary accessory names', () => {
    expect(safeFilename('Living Room Humidifier')).to.equal('Living Room Humidifier');
  });
});
