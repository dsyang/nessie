
# Nessie

Indoor plant remote watering system for RPi

## Server.py

This program listens for mqtt params and communicates with the gpio pins to start/stop water or retrieve moisture sensor data. 

The MQTT payload it expects to see looks like:
```
{ "cmd": string, "data": ?JSONObject}
```
where <> is:
- "start": data is `{"zone": int}`. Starts to water the zone. Does nothing if zone is already started. Will not stop until stop command given.
- "stop": data is `{"zone": int}`. Stops watering the zone. Does nothing if zone not started.
- "DIE": disconnects from mqtt and ends program.
- "moisture": data is `{"zone": int}`. Publishes moisture sensor reading for zone. If `zone == -1` the publishes moisture sensor deading for all zones as a single mqtt message.
- "debug": publishes current app state. 

## Moisture.py

This program periodically sends MQTT commands to `Server.py` to read moisture sensor data and publish it to an airtable table. 

If moisture sensor data for a single zone is too high, it will issue a stop command for that zone.

## nessie\_watering

This is an arduino sketch used to control the hardware for watering: the capacitive sensors for reading soil moisture and the relays for controlling the water pumps.

The arduino communicates with the raspberry pi via a bidirectional serial terminal. It can be compiled via command line with the following functions:

```
arduino-cli compile --fqbn arduino:avr:uno nessie_watering
arduino-cli upload -p <port> --fqbn arduino:avr:uno nessie_watering
```

port is found once the arduino is connected via:
`arduino-cli board list`
