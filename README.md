# Homebridge Broadlink RM Pro + Valve

A feature-rich fork of the original Homebridge Broadlink RM plugin. It retains the original Broadlink device integration and accessory types while adding a HomeKit water valve, a visual configuration form, accessory-wide test mode, and optional valve auto-close timing.

## Features

- **Broadlink RM integration:** discover RM devices automatically or configure them manually; send learned IR/RF commands and use the built-in learning accessories.
- **Original accessory support retained:** switches, multi-switches, outlets, lights, fans, air conditioners, air purifiers, humidifiers/dehumidifiers, heaters/coolers, temperature and humidity sensors, garage doors, locks, windows, window coverings, TVs, and learning accessories.
- **HomeKit water valve:** add a valve as a native HomeKit accessory, with separate learned commands for opening and closing and selectable valve type (generic, irrigation, shower, or water faucet).
- **Optional valve auto-close:** set a duration for an open valve; when the countdown expires, the plugin sends the configured close command. A duration of zero disables the timer, so the valve remains open until manually closed. Manually closing the valve cancels the countdown.
- **Visual Homebridge configuration:** choose an accessory type and configure its relevant fields in the Homebridge Config UI, without having to build the entire platform configuration by hand. Advanced and dynamic command maps, nested sequences, and repeat/pause arrays remain available through JSON Config.
- **Test mode for every accessory:** simulate HomeKit actions without Broadlink hardware or HEX commands. Test mode does not transmit commands; temperature and humidity sensors use simulated readings of 20 °C and 50% RH.
- **Safer MQTT TLS defaults:** broker certificates are verified by default. Disabling certificate validation is an explicit per-accessory opt-in.

## Important: valve state and RF/IR feedback

The valve accessory is command-based. Broadlink RM devices send IR/RF commands but do not receive confirmation of the physical valve position. HomeKit therefore displays the last command state reported by the plugin; it cannot verify that the valve actually opened or closed. The optional timer also sends a close command but cannot confirm physical closure. Use a valve/controller with independent position or flow feedback if confirmed state is required.

## Install

The recommended installation is from npm:

```sh
npm install -g homebridge-broadlink-rm-valve
```

You can also install it in Homebridge Config UI by opening **Plugins → Install Plugin** and searching for `homebridge-broadlink-rm-valve`.

For a direct GitHub installation, use **Plugins → Install custom plugin** and enter:

`https://github.com/vitva/homebridge-broadlink-rm-valve.git`

Or from the Homebridge server terminal:

```sh
npm install -g https://github.com/vitva/homebridge-broadlink-rm-valve.git
```

Requires Node.js 22.12 or newer (22, 24, or 26) and Homebridge 2.x.

## Homebridge visual settings

Open **Plugins → Homebridge Broadlink RM Pro + Valve → Settings** to configure the platform, discover or manually enter RM devices, and add accessories.

The platform remains idle until at least one supported, enabled accessory is configured. Once an accessory is configured, the built-in **Learn** and **Scan Frequency** accessories are added automatically unless a **Learn Code** accessory is already configured or the buttons are hidden in platform settings.

For a valve, choose **Кран (Valve)** and enter two separate learned commands in **Команды Broadlink**:

- **Открыть (HEX)** — command that opens the valve
- **Закрыть (HEX)** — command that closes the valve

Enable **Тестовый режим (без Broadlink)** to check the HomeKit accessory without an RM device. In this mode the plugin simulates actions and sends no commands.

## Water valve configuration

Use separate learned Broadlink codes for opening and closing. The accessory does not use a toggle command.

```json
{
  "name": "Water valve",
  "type": "valve",
  "host": "192.168.1.10",
  "data": {
    "open": "YOUR_OPEN_HEX_CODE",
    "close": "YOUR_CLOSE_HEX_CODE"
  },
  "valveType": 3,
  "persistState": false
}
```

Both `data.open` and `data.close` are required. Each command may be a single learned hex string or an array of command steps (the same repeat/pause format supported by the existing accessories). Learn each command separately with the existing Broadlink learning accessory.

The optional `valveType` accepts HomeKit values `0` (generic), `1` (irrigation), `2` (shower), or `3` (water faucet, the default).

The valve exposes HomeKit duration characteristics for optional auto-close. Set the duration to zero for manual operation without a timer. When a non-zero duration is set, the plugin counts down and sends the close command at expiry. Manual closing cancels the timer. The countdown is held in memory and is not preserved if Homebridge restarts.

## Accessory test mode (no Broadlink hardware)

Every accessory type has a **Тестовый режим (без Broadlink)** checkbox. Enable it on an accessory to simulate its HomeKit actions without a Broadlink RM device or HEX commands. Command fields are hidden while test mode is enabled. Temperature and humidity accessories use simulated readings (20 °C and 50% RH). The accessory remains a normal HomeKit service; no Broadlink commands are transmitted.

For example, a virtual test valve can be configured as:

```json
{
  "name": "Virtual test valve",
  "type": "valve",
  "testMode": true,
  "persistState": false
}
```

Turn test mode off and configure the accessory's normal Broadlink commands before using it with real hardware.

## MQTT security

MQTT connections using TLS verify the broker certificate by default. If your broker intentionally uses a self-signed or otherwise untrusted certificate, you can explicitly opt in per accessory in JSON Config:

```json
{
  "mqttURL": "mqtts://broker.example:8883",
  "mqttAllowInsecureTLS": true
}
```

Only enable `mqttAllowInsecureTLS` when you understand the risk. It disables TLS certificate validation and can expose MQTT credentials and messages to interception. The default is `false`.

## Tests

```sh
npm ci
npm install --no-save --package-lock=false @homebridge/hap-nodejs@2.3.0
npm run lint
npm test
```

## Source and license

This project is based on [kiwi-cam/homebridge-broadlink-rm](https://github.com/kiwi-cam/homebridge-broadlink-rm). The upstream Apache-2.0 license and attribution are retained.
