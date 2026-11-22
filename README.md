# Homebridge Broadlink RM Pro + Valve

A Homebridge Broadlink RM plugin fork with an additional HomeKit water-valve accessory.

## Valve behavior

The valve uses separate Broadlink commands for opening and closing; it does not use a toggle command. HomeKit state reflects the last command sent because Broadlink RM devices do not report the physical valve position.

## Source and license

This project is based on the upstream Homebridge Broadlink RM project. Upstream attribution and license are retained in the source distribution.
