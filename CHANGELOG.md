# Changelog
## [4.4.21-valve.7] - 2026-11-24

### Added
- Expanded the Homebridge Config UI accessory form with type-specific settings and command fields for the original accessory types.
- Preserved the original accessory selector order and appended the HomeKit Valve as the final type.
- Added UI fields for fan speed and swing commands, light brightness and color, TV remote/input commands, humidifier/dehumidifier modes, heater/cooler modes, and accessory timing and sensor options.

### Fixed
- Ignore empty accessory and Broadlink host placeholders created by the Homebridge Config UI, preventing fresh-install configuration errors and keeping automatic Broadlink discovery enabled when no valid manual hosts are configured.

### Compatibility
- Retained the existing Homebridge 2.x / Node.js 22, 24, and 26 compatibility target and the original dynamic JSON configuration format for custom temperature-code maps and complex command sequences.

### Validation
- GitHub Actions passed on Node.js 22, 24, and 26 with the Homebridge 2 HAP 2.3.0 runtime.
- All 150 automated tests passed; ESLint passed.
- Full and production dependency audits passed with zero vulnerabilities.
- The published npm artifact comparison passed.

## [4.4.21-valve.6] - 2026-11-23

### Fixed
- Correct update notifications to link to this fork and detect valve prereleases.
- Keep valid MQTT topic entries active when other entries in the configured list are invalid; warn about skipped entries.

### Changed
- Documented npm, Homebridge UI, and direct GitHub installation methods.

### Validation
- Post-merge GitHub Actions passed on Node.js 22, 24, and 26.
- All 147 automated tests passed; ESLint passed.
- Full and production npm audits reported zero vulnerabilities.


