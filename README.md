# Homebridge Broadlink RM Pro + Valve

A Homebridge Broadlink RM plugin fork with an additional HomeKit water-valve accessory. Existing Broadlink accessory types, learning accessories, and configuration options are retained.

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

The plugin includes a native Homebridge Config UI form. After installation, open **Plugins → Homebridge Broadlink RM Pro + Valve → Settings** to configure the platform, discover or manually enter RM devices, and add accessories without editing the main JSON configuration.

For a valve, choose **Кран (Valve)** and enter two separate learned commands in **Команды Broadlink**:
- **Открыть (HEX)** — command that opens the valve
- **Закрыть (HEX)** — command that closes the valve

The built-in form exposes common settings and the valve fields. Advanced accessory types and multi-step command sequences remain available in Homebridge's JSON Config editor so existing configurations are not restricted by the simplified form.

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

Both `data.open` and `data.close` are required. Each command may be a single learned hex string or an array of command steps (the same repeat/pause format supported by the existing accessories). Learn each command separately with the existing Broadlink learning accessory, then put the resulting code or command sequence in the configuration.

The optional `valveType` accepts HomeKit values `0` (generic), `1` (irrigation), `2` (shower), or `3` (water faucet, the default).

HomeKit reports the last command dispatched to the Broadlink device. Broadlink RM devices do not provide physical valve-position feedback, so the displayed state cannot confirm that the valve physically moved.

## Tests

```sh
npm ci
npm install --no-save --package-lock=false @homebridge/hap-nodejs@2.3.0
npm run lint
npm test
```

## Source and license

This project is based on [kiwi-cam/homebridge-broadlink-rm](https://github.com/kiwi-cam/homebridge-broadlink-rm). The upstream Apache-2.0 license and attribution are retained.


## MQTT security

MQTT connections using TLS verify the broker certificate by default. If your broker intentionally uses a self-signed or otherwise untrusted certificate, you can explicitly opt in per accessory in JSON Config:

```json
{
  "mqttURL": "mqtts://broker.example:8883",
  "mqttAllowInsecureTLS": true
}
```

Only enable `mqttAllowInsecureTLS` when you understand the risk. It disables TLS certificate validation and can expose MQTT credentials and messages to interception. The default is `false`.
