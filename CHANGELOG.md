# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.4.21-valve.12] - 2026-11-25

### Fixed
- Keep the platform idle until at least one enabled accessory is configured; do not publish automatic learning accessories for an empty configuration.
- Handle asynchronous Broadlink ping errors without throwing from the probe callback.
- Catch malformed platform and accessory configuration errors, log them, and skip invalid accessories without aborting platform startup.
- Fall back to the last sensor reading when temperature, humidity, or 1-Wire source files cannot be read; avoid exceptions in asynchronous file callbacks.
- Await humidifier state transitions and Broadlink power commands, and log asynchronous fan timer errors.
- Sanitize user-controlled humidifier history filenames so path separators cannot escape the Homebridge storage directory.
- Wait for HomeKit setter actions and Broadlink sends to finish before acknowledging writes; return command failures through the HomeKit callback.
- Restore the previous accessory state when a HomeKit command fails, avoiding a stale optimistic state.
- Keep RF scan timers and event listeners isolated per session so delayed cleanup cannot interrupt a replacement scan.
- Await TV input, remote, power, volume, and mute commands before acknowledging HomeKit writes.
- Preserve the cached fan speed and humidifier operating state when Broadlink commands fail.
- Replace active IR learning sessions safely without leaving stale listeners or throwing during cleanup.
- Catch temperature monitor failures and await retry chains instead of leaving rejected promises unhandled.
- Catch Broadlink discovery, device registration, and synchronous update-check errors in their asynchronous callbacks.
- Catch failures while requesting IR/RF learning data and stop the learning session cleanly instead of throwing from timer or device-event callbacks.
- Use the correct numeric HomeKit Active values for Fan v2 and TV while retaining the Boolean On characteristic for Fan v1.

### Tests
- Add regression coverage for empty platform configuration, asynchronous ping failures, and HomeKit characteristic formats.

### Validation
- GitHub Actions passed on Node.js 22, 24, and 26.
- 181 automated tests passed on each Node.js version; ESLint passed on all three.
- Full and production npm audits reported zero vulnerabilities.
- The release-candidate npm archive audit passed.

## [4.4.21-valve.11] - 2026-11-24

### Added
- Add an optional HomeKit Valve auto-close timer.

### Fixed
- Synchronize the Valve Active and InUse characteristics when opening and closing.

### Changed
- Refresh the README, package description, and Homebridge Config UI descriptions to document the expanded feature set.

## [4.4.21-valve.10] - 2026-11-24

### Added
- Add a universal per-accessory test mode that simulates accessory actions without a Broadlink RM device or HEX commands.
- Expose the test-mode toggle for every accessory type in Homebridge Config UI and hide Broadlink command fields while it is enabled.
- Add integration coverage that creates a real HAP Valve service and exercises simulated state changes without a device.

## [4.4.21-valve.9] - 2026-11-24

### Fixed
- Remove the legacy custom form layout that prevented Homebridge Config UI from generating the HomeKit accessory array editor.
- Let Config UI X render the accessory editor from JSON Schema, retaining the existing accessory types and Valve type.

### Validation
- Pull request checks passed on Node.js 22, 24, and 26, including lint, tests, and release archive checks.
- The published `.8` package remains unchanged; this release contains the Config UI editor fix.

## [4.4.21-valve.8] - 2026-11-24

### Fixed
- Fix the Homebridge Config UI accessory array schema so the editor can render the configured accessories.
- Correct nested Broadlink command schema handling and add regression tests for valid accessory arrays.

