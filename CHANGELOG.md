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

## [4.4.21-valve.7] - 2026-11-24

### Added
- Expand the Homebridge Config UI accessory form with type-specific settings and command fields for the original accessory types.
- Preserve the original accessory selector order and append the HomeKit Valve as the final type.
- Add UI fields for fan speed and swing commands, light brightness and color, TV remote/input commands, humidifier/dehumidifier modes, heater/cooler modes, and accessory timing and sensor options.

### Fixed
- Ignore empty accessory and Broadlink host placeholders created by the Homebridge Config UI, preventing fresh-install configuration errors and keeping automatic Broadlink discovery enabled when no valid manual hosts are configured.

### Compatibility
- Retain Homebridge 2.x / Node.js 22, 24, and 26 compatibility and the original dynamic JSON configuration format for custom temperature-code maps and complex command sequences.

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
- Document npm, Homebridge UI, and direct GitHub installation methods.

### Validation
- Post-merge GitHub Actions passed on Node.js 22, 24, and 26.
- All 147 automated tests passed; ESLint passed.
- Full and production npm audits reported zero vulnerabilities.

## [4.4.21-valve.5] - 2026-11-23

### Fixed
- Avoid terminating Homebridge when accessory configuration contains invalid boolean or numeric values; report configuration errors safely.
- Validate each MQTT topic entry independently and ignore malformed entries such as null values without throwing.

### Validation
- Post-merge GitHub Actions passed on Node.js 22, 24, and 26.
- The full test suite passed (143 tests), and full and production npm audits reported zero vulnerabilities.
- All 89 files in the published npm archive matched the Git release tag.

## [4.4.21-valve.4] - 2026-11-23

### Security
- Verify MQTT TLS certificates by default; self-signed broker certificates require the explicit `mqttAllowInsecureTLS: true` opt-in.
- Remove the unused `js` runtime dependency and update development tooling to eliminate reported dependency vulnerabilities.
- Use `Buffer.from()` instead of the deprecated Buffer constructor.

### Validation
- GitHub Actions passed on Node.js 22, 24, and 26, including Homebridge 2 HAP runtime checks, lint, and 139 automated tests.
- Full and production npm dependency audits reported zero vulnerabilities.
- The release-candidate npm archive was verified: all 88 packed files match the source tree, and required package entry points and configuration schema are present.

## [4.4.21-valve.3] - 2026-11-23

### Added
- Add a HomeKit Valve accessory with separate Broadlink commands for opening and closing.
- Add native Homebridge Config UI fields for valve type and open/close commands.
- Add an ESM entry point while retaining the CommonJS entry point.

### Changed
- Declare compatibility with Homebridge 2 and Node.js 22, 24, and 26.
- Clarify that HomeKit displays the last command dispatched to Broadlink; it cannot confirm the valve's physical position.
- Expand automated checks for valve behavior, configuration schema, and module exports.

### Validation
- GitHub Actions passed on Node.js 22, 24, and 26, including dependency installation, Homebridge 2 HAP test runtime setup, lint, and the full test suite.
- Production dependency audit passed on Node.js 22.

## [4.4.21 - 2026-05-10]
### Fixed
 - Homebridge 2.0 compatibility: access HAP categories via `hap.Categories` instead of `hap.Accessory.Categories`. (#777 thanks @Gernot)
 - Fixed RM4 Pro auth via hosts config (#779 Thanks @GlitchVector)
### Changed
 - Improved Battery level monitoring in Temperataure Sensors

## [4.4.20 - 2025-08-28]
### Fixed
 - Fixed ESLint support and applied some code fixes
### Changed
 - Stopped device temperature checks when they're not applicable (MQTT, File, W1)
 - Updated dependancies

## [4.4.19 - 2024-09-30]
### Fixed
 - refreshCharacteristic and value() were not updating the UI. Rebuilt to use updateValue method. (#733 and #725)
### Added
 - updated package to show Homebridge 2.0 support (#730)

## [4.4.18 - 2024-08-08]
### Added
 - Added ping state change logging for troubleshooting
### Changed
 - Removed use of Characteristic.getValue() in preparation of homebridge 2.0 (#722)
 - The removal of getValue() has stopped the regular getCurrentTemperature and getCurrentHumidity calls. Changed the regualar updates to make these calls instead of just using refreshCharacteristic. (#722)

## [4.4.17 - 2024-07-17]
### Added
 - Adds support for RM3 Mini 0x27d0 (#691)
### Fixed
 - Reduced default logging of blind positions #702
 - Updated versions of mqtt, mocha, release-it, and hap-nodejs to resolve known vulnerabilities
### Changed
 - Reduced log level for onTemperature events (now debug events)

## [4.4.16 - 2023-07-10]
### Fixed
 - Fix for wrong command being sent or no command sent in certain circumstances #669 (Thanks @seidnerj)
 - Added 0xd7 command for RF 315Mhz
 - Incorporates fixes from broadlinkjs-rm (https://github.com/kiwi-cam/broadlinkjs-rm/releases/tag/v0.9.20)
 - Fixed dependancy issue in package.json

## [4.4.15] - 2023-07-27
### Fixed
 - Fixes the Fanv2 'On' Characteristic warning. (Thanks @dnicolson) #639

## [4.4.14] - 2023-07-26
### Added
 - Adding support for 520d device (#632)
### Fixed
 - Fixes 'No off HEX code found for XX' error (#615)
 - Updated semver version to resolve CVE-2022-25883
### Changed
 - Heater-Cooler tempStepSize default changed to 1 to match AC (#616)

## [4.4.13] - 2023-06-19
### Added
 - w1 and file temperatures will return a battery level of 100 if none found
### Fixed
 - Fixes log error (Thanks @hypery2k) #606
 - Fan speed fixes (Thanks @dnicolson) #592 and #593
 - Resolve the workaround of #440. (Thanks @banboobee) #519 
### Changed
 - Serializes the simultaneous IR/RF commands. (Thanks @banboobee) #520
 - Updated dependancies to resolve known vulnerabilities

## [4.4.12] - 2023-05-25
### Added
 - Added tempStepSize to configuration (defaulting to 1) to allow AC units with 0.5 steps (Thanks @nasudon) #570
 - Added support for fahrenheit temperature sources #495 - set tempSourceUnits to 'F'
### Fixed
 - Updated versions to address vulnerabilities
 - Set HAP properties for fan speed handling (Thanks @datibbaw) #583
## Changed
 - Serialised simultaneous IR/RF commands (Thanks @banboobee) #520
 - Adjusted logging levels for temperature/humidity updates
 - Adds support for 0x520b and 0x520c Devices

## [4.4.11] - 2022-06-08
### Added
 - MQTT support for zigbee2mqtt (Thanks @mikicof) #467
### Fixed
 - "no device found" message in Node 18 (Thanks @h2oota) #486
 - Version number message incorrect in prerelease (Thanks @seidnerj)
### Changed
 - Homebridge versions bumped
 - Device not found message update to suggest unlocking (Thanks @jacoblukewook) #491

## [4.4.10] - 2022-04-12
### Added
 - Turns off other lights in group when it turns on. (Thanks @banboobee)
### Fixed
 - Improved 'device unreachable' false alerts (Thanks @banboobee)
 - Updated dependencies to resolve vulnerabilities

## [4.4.9] - 2022-02-24
### Added
 - Adds AutoOff support to the AirConditioner accessory (Thanks @banboobee)
 - Updated dependencies to remove security vulnerabilities.

## [4.4.8] - 2021-12-08
### Fixed
 - Updated dependencies to resolve security vulnerabilities
 - Keepalive logs now only log under debug

## [4.4.7] - 2021-11-26
### Added
 - Adds 0x6184 device support
 - Added support for 'white' light. Thanks to @JuniorGenius
### Fixed
 - Removed unsupported AutoOnOff code from heater-cooler accessory which was causing exceptions.

## [4.4.6] - 2021-08-03
### Added
 - Adds support for 0x6508 devices
### Changed
 - General code tidy-up/standardisation.
### Fixed
 - Improved the temperature update process when using MQTT to make the UI more responsive
 - Fixed 'One of your plugins incorrectly registered an external accessory using the platform name ([object Object]) and not the plugin identifier' message which caused TVs to fail in HOOBS
 - Fixes Version checks on start-up (Thanks @dnicolson)

## [4.4.5] - 2021-06-23
### Changed
 - Improved default allowResend logic when using preventResendHex
 - Heater-Cooler now shows as Heating or Cooling depending on mode selected
 - Updated to always use noHumidity when using a source which doesn't support it (w1 or pseudo)
### Fixed
 - Fixed characteristic 'Current Temperature': characteristic was supplied illegal value when a heater-cooler reads below 10
 - Fixed name not defined error when using oscillate in Heater Cooler
 - Fixed bug in Humidifier-Dehumidifier sending FanOnly hex regardless of state
 - Fixed logLevel is not defined error in aircon accessory
 - Updated MQTT version requirements to fix known vulnerabilities in dependencies

## [4.4.4] - 2021-06-09
### Added
- Heater-Cooler states now all support allowResend for when values are not changing.
- Heater-Cooler now supports humidity values and noHumidity configuration.
- Accessorys now support logLevel configuration (none=6, critical=5, error=4, warning=3, info=2, debug=1, trace=0)
- The Platform now also supports logLevel configuration
- Learn RF now finds 0xb2 codes
### Changed
- Updated CHANGELOG.md to follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- turnOnWhenOff now defaults to true for Heater-Cooler accessories.
- All accessories now explicitly have allowResend set to true by default.
- Learn Accessories will temporarily enable platform level debug during a learn
### Fixed
- Learn RF now times out after 60 seconds to allow all frequencies to be scanned. 

## [4.4.3] - 2021-05-04
### Added
 - Adds Mute button to TV accessories (No HomeKit support and untested yet)
 - Adds the RM Mini 3 6507
 - Adds fan speed step functionality and speed improvements (Thanks @EpicKris)
 - Adds Current Temperature support to Heater-Cooler accessories. Offers all the same options: file, MQTT, or RM Pro Device (Thanks @uzumaki20398)
 - Allows HEX Objects for additional charactistics on Fan, Air-Purifier, and HumidifierDehumidifier Accessories (Thanks @ aymericbaur)
 - Adds turnOnWhenOff support to the HeaterCooler Accessory
### Fixed
 - Fixes bug with Parsing JSON MQTT messages (#298)
 - Fixes fanv1 "counterClockwise is undefined" error when showRotationDirection is true (#306)

## [4.4.2] - 2021-04-07
### Added
 - Adds offDryMode configuration option to the airconditioner accessory. Thanks @pixeleyesltd
 - Adds stateless configuration switch option to have a switch "forget" its state
 - Adds Eve History service support. This can be disabled by adding `"noHistory":true` to your config
### Changed
 - Set node-persist to ignore parse errors to stop crashing the plugin on read errors
 - Sets "undefined" characteristics to either 0 or minValue to prevent future Homebridge errors
 - Moves onTemperature and onHumidity logging to Debug only, reducing noice in the logs from all updates
### Fixed
 - Fixes mac address formatting error when using manual hosts devices #266
 - Fixes Accessory mac address formatting to support all formats the hosts section does - and improve matching to devices.
 - Stopped MQTT updates from defaulting to 0 when the topic isn't found. This does create messages that the plugin is slowing homebridge until MQTT updates are recieved.

## [4.4.1] - 2021-01-27
### Added
 -  Adds pingUseArp configuration to use an ARP lookup instead of ICMP ping to test a device's status
 -  Adds heater-cooler tempStepSize to support devices without 0.5 temperaure codes
### Fixed
 -  Fixes "'Temperature Display Units': characteristic was supplied illegal value: undefined!"
 -  Fixes "SET handler returned write response value, though the characteristic doesn't support write response! when returning a value"
 -  Fixes Learn Button error "the characteristic 'On': characteristic was supplied illegal value: undefined!"
 -  Fixes Error in Heater-Cooler with setting a value to a constant

## [4.4.0] - 2020-12-17
### Added
 -  Added Low Battery Alerts to Humidity and Temperature sensors (using battery:XX in readings from files)
 -  Extended Temperature and Humidity readings from files to support temperature:XX, humidity:XX, and battery:XX values on each line
 -  Added MQTT support to AC and Temperature sensor using temperature,humidity, and battery identifiers
 -  Added HeaterCooler accessory option. Refer to [this document](https://github.com/kiwi-cam/homebridge-broadlink-rm/blob/kiwi-cam-beta-1/docs/heater-cooler.md) to read @newt10's work here.
### Changed
 -  Updated all dependencies to remove some security vulnerabilities 
 -  Removed file and w1 Temperature readings being forced to 10 minutes. Now 1 minute minimum and adjustable
 -  Integrated the platform helper module to improve maintainability.
 -  MQTT will update when published so frequent refreshes aren't required ( 10 minute default as a fallback )
### Fixed
 -  Fixed duplicate monitorTemperature calls from Temperature Sensor accessories
 -  Fixed SIGTERM when unexpected packet received

## [4.3.8] - 2020-12-01
### Added
-  **Added RF Learning** steps from #45
### Changed
-  Added Keep Alive packet to RM Devices to avoid reboots when the cloud is unreachable.
### Fixed
-  Fixes "No Response" from Dehumidifers when noHumidity and accessory Off
-  Fixes "log is not a function" error when using Pronto codes

## [4.3.7] - 2020-11-16
### Fixed
-  Fixes missing FanSpeed/Direction features in Fanv1

## [4.3.6] - 2020-11-11
### Added
-  Adds humidityFilePath support to the HumidifierDehumidifier accessory to update the current humidity from a local file
-  Adds autoOn/autoOff support to the Fan and HumidifierDehumidifier accessory (Note the Bug detail below)
### Changed
-  Improves HumidifierDehumidifier accessory to update state by using Humidity data from the Broadlink device 
-  Updated humiditySensor and temperatureSensor accessories to extend HumidifierDehumidifier and AirCon accessories (respectively) so both gain MQTT and file values too.
-  Updated the switch accessory to use On/Active status depending on device type. Many accessories inherit from this and it broke their AutoOff functions.
### Fixed
-  Fixed AutoOn/AutoOff functions for Fan and HumidifierDehumidifier. This was an issue with the different characteristics between the HomeKit Fan and Fanv2 Services. In order to tidy this up users wanting to have the classic style Fan (with more icon options) will need to update type to "fanv1" i.e. `"type": "fanv1"`

## [4.3.5] - -2020-11-02
-  Fixes bug in Fan accessory that removed Rotation Direction and/or Swing options

## [4.3.4] - 2020-10-27
### Added
-  Adds fan improvements with defaultFanSpeed and stepSize (Thanks @newt10)
### Changed
-  Improves HumidifierDehumidifier accessory by using Humidity data from the Broadlink device (See README.md for notes.) 
-  Uses Service.Fan instead of Service.Fanv2 to allow Fan icons if not using SwingMode (Thanks @apexad)
### Fixed
-  Fixes Air Purifier so it no longer appears as a fan
-  Removes limits on air-conditioner Current Temperature so it isn't constrained to the same limits as the Target Temperature.
-  Fixed the identification of manual devices. New Manual deviceTypes added which are selected based on isRFSupported and isRM4. isRM4 will be required on newer devices to make sure messages include the correct headers.
-  Fixes an error in the aircon accessory where HEX codes for temperatureXX would falsely report as missing

## [4.3.3] - 2020-09-29
### Added
-  Adds Humidity information to the Aircon accessory
-  Adds TemperatureSensor accessory to give temperature and humidity information from Broadlink sensors
-  Adds HumiditySensor accessory to give humidity information from Broadlink sensors
-  Adds AirPurifier and HumidifierDehumidifier accessory from the original fork
### Fixed
-  Fixes error in heombridge-platform-helper "ReferenceError: log is not defined"

## [4.3.2] - 2020-09-21
### Added
-  Updated documentation around TV changes

## [4.3.1] - 2020-09-21
### Added
-  Adds coolOnly mode for Aircon accessories
-  Fixes TV Display issue in iOS14. *All TVs are now seperate accessories. Previously the first TV connected via Homebridge as a bridge. This means that after updating, that first TV will need to be removed and re-added to HomeKit.*
-  Adds TV subType to display STB, Receiver, or Stick types 
### Fixed
-  Fixes issue in heatOnly mode for Aircon accessories
-  Fixes MAC address order error. *If you specify a HOST in your config.json by MAC address, you'll likely need to correct this value after you update.*

## [4.3.0] - 2020-09-09
### Added
-  Adds HeatOnly mode for Aircon accessories
-  Adds support for RM4 Temperature sensors
### Changed
-  Improves support for RM4 RF devices (e.g. RM4 Pro)

## [4.2.9] - 2020-08-11
### Added
-  Added `Broadlink RM Mini 4 C` 610f support
-  Added notes about IHC setup/reset process 

## [4.2.8] - 2020-07-15
### Added
-  Added `Broadlink RM4 4 Pro` 649b support

## [4.2.7] - 2020-07-10
### Added
-  Adds IR Learn support for RM4 devices
-  Adds additional Debug information
-  Added `Broadlink RM4 Mini 4 KR` support

## [4.2.6] - -2020-06-12
### Added
-  Adds command acknowledgement messages
### Fixed
-  Fix for RM4 SendCode issues

## [4.2.5] - 2020-06-10
### Added
-  Added `Broadlink RM Mini 4 S` support
### Fixed
-  Updated to use new kiwicam-broadlinkjs-rm version with RM4 bug fixes (Learn Mode)

## [4.2.3] - 2020-06-08
### Fixed
-  Update to use new fork kiwicam-broadlinkjs-rm with RM4 support

## [4.2.0] - 2020-05-25
### Added
-  Inital version - forked from AlexanderBabel/homebridge-broadlink-rm-tv
### Fixed
-  Added device support from def-broadlinkjs-rm
