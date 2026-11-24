const safeFilename = (value) => String(value || 'accessory').replace(/[<>:"/\\|?*\x00-\x1F]/g, '-');

module.exports = safeFilename;
