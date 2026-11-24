const invalidFilenameCharacters = '<>:"/\\|?*';

const safeFilename = (value) => Array.from(String(value || 'accessory'), (character) => {
  const code = character.charCodeAt(0);
  return invalidFilenameCharacters.includes(character) || code < 32 ? '-' : character;
}).join('');

module.exports = safeFilename;
