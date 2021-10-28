import { COMMANDS } from "./api";

export const INITIAL_VIEW_MODEL = {
    configuration: {
        // debug_level: 0-2,
        // num_zones: 4,
        // num_sensors: 4,
        // sensor_wet_limit: 700,
        // sensor_dry_limit: 810
    },
    zones: [
        {
            // pin: 7,
            // state: {
            //   is_on: bool,
            //   last_changed_timestamp_ms: int
            // }
            // moisture_sensor_index: 0
        }
    ],
    moisture_sensors: [
        {
            // reading: int,
            // last_read_timestamp_ms: int
        }
    ]
}

export function handleNewMessage(payload, currentViewModel, setViewModel) {
    if (payload.status === "ok") {
        switch(payload.cmd) {
            case COMMANDS.config:
                handleConfigCommandResponse(payload.msg, currentViewModel, setViewModel);
                break;
            case COMMANDS.moisture_sensors:
                handleReadSensorsCommandResponse(payload, currentViewModel, setViewModel);
                break;
            case COMMANDS.status:
                handleStatusCommandResponse(payload.msg, currentViewModel, setViewModel);
                break;
            case COMMANDS.stopall:
                console.log("STOPPPPP")
                break;
            case COMMANDS.water_start:
                console.log('start water')
                break;
            case COMMANDS.water_stop:
                console.log("water_stop")
                break;
            default:
                console.error(payload.msg)
        }
    } else {
        console.error(payload);
    }
}

function handleConfigCommandResponse(payload, currentViewModel, setViewModel) {
    const newViewModel = {
        ...currentViewModel,
        configuration: {
            debug_level: payload.debug_level,
            num_zones: payload.num_relay_pins,
            num_sensors: payload.num_sensors,
            sensor_wet_limit: payload.sensor_wet,
            sensor_dry_limit: payload.sensor_dry,
        }
    }
    setViewModel(newViewModel);
}

function handleReadSensorsCommandResponse(payload, currentViewModel, setViewModel) {
    console.log(payload)
    const last_read_timestamp_ms = payload.timestamp_ms
    const moisture_sensors = payload.msg.readings.map((reading) => {
        return {
            reading,
            last_read_timestamp_ms
        };
    });
    const newViewModel = {
        ...currentViewModel,
        moisture_sensors,
    }
    setViewModel(newViewModel);
}

function handleStatusCommandResponse(payload, currentViewModel, setViewModel) {
    console.log(payload)
    const exStats = { 'data': { '7': [1, 1], '6': [1, 1], '4': [1, 1], '5': [1, 1] } }
    const newViewModel = {
        ...currentViewModel,
        zones: []
    }
    setViewModel(newViewModel);
}