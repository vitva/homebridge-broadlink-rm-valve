# Homebridge Broadlink RM Pro + Valve

A Homebridge Broadlink RM plugin fork with an additional HomeKit water-valve accessory. Existing Broadlink accessory types, learning accessories, and configuration options are retained.

## Install

In Homebridge Config UI, open **Plugins → Install custom plugin** and enter:

`https://github.com/vitva/homebridge-broadlink-rm-valve.git`

Or install from the Homebridge server terminal:

```sh
npm install -g https://github.com/vitva/homebridge-broadlink-rm-valve.git
```

Requires Node.js 22.12 or newer (22, 24, or 26) and Homebridge 2.x.

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
  }
}
```

Both `data.open` and `data.close` are required. Learn each command separately with the existing Broadlink learning accessory, then put the resulting hex codes in the configuration.

HomeKit reports the last successfully sent command. Broadlink RM devices do not provide physical valve-position feedback, so the displayed state cannot confirm that the valve physically moved.

## Tests

```sh
npm ci
npm run lint
npm run test:valve
```

## Source and license

This project is based on [kiwi-cam/homebridge-broadlink-rm](https://github.com/kiwi-cam/homebridge-broadlink-rm). The upstream Apache-2.0 license and attribution are retained.
