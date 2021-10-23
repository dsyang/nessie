
# Nessie

Indoor plant remote watering system for RPi

## Usage
- Install the arduino sketch
- `python nessie.py --arduino <file for serial connection> [--mqtt <mqtt broker url>] [--uuid <UUID for mqtt>]`
- `python nessie.py /dev/ttyACM0 --uuid dsyangtest`

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

## nessie\_watering

This is an arduino sketch used to control the hardware for watering: the capacitive sensors for reading soil moisture and the relays for controlling the water pumps.

The arduino communicates with the raspberry pi via a bidirectional serial terminal. It can be compiled via command line with the following functions:

```
arduino-cli compile --fqbn arduino:avr:uno nessie_watering
arduino-cli upload -p <port> --fqbn arduino:avr:uno nessie_watering
```

port is found once the arduino is connected via:
`arduino-cli board list`

## nessie\_watering API spec:
Communication is done as a JSON wire format.
- On serial connection, print configuration information:
```
{ 
    "data": {
        "debug_level": number, 
        "num_pins": number, 
        "solenoid_pin": number,
        "num_sensors": number, 
        "sensor_wet": number,
        "sensor_dry": number,
    }
}
```
- When nessie\_watering receives "STATUS|", it returns the internal state of relay gpio values:
```
{
    "data": {
        <pin>: [<internal state>, <ditigal read>],
        ...
    }
}
```
- When nessie\_watering receives "SENSE|", it reads moisture sensors and relays that data:
```
{
    "data": [<number>]
}
```
- When nessie\_watering receives "ZONE<num>_<0|1>", it toggles that zone to be <0|1> and returns:
```
{ "data": <200|304>} // 200 means set properly, 304 means no change
```


## Moisture.py

This program periodically sends MQTT commands to `Server.py` to read moisture sensor data and publish it to an airtable table. 

If moisture sensor data for a single zone is too high, it will issue a stop command for that zone.