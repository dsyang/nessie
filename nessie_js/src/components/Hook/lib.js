import { COMMANDS } from "./api";

const IS_ON = 0;
export const INITIAL_VIEW_MODEL = {
    configuration: {
        // debug_level: 0-2,
        // num_zones: 4,
        // num_sensors: 4,
        // sensor_wet_limit: 700,
        // sensor_dry_limit: 810
    },
    zones: [
        /*{
            // pin: 7,
            // state: {
            //   is_on: bool,
            //   app_state_minus_digital_read: int,
            //   last_changed_timestamp_ms: int
            //   last_read_timestamp_ms: int
            // }
            // moisture_sensor_index: 0
        }*/
    ],
    moisture_sensors: [
        /*{
            // reading: int,
            // last_read_timestamp_ms: int
        }*/
    ],
}

const ZONE_METADATA = [
    { title: "Solenoid Valve", plants: "" },
    { title: "Zone 1 (tub)", plants: "" },
    { title: "Zone 2 ()", plants: "" },
    { title: "Zone 3", plants: "" },
];

export function transformTimestampMsToString(obj) {
    const newObj = { ...obj }
    for (const [key, value] of Object.entries(newObj)) {
        const [newKey, remainder] = key.split('_timestamp_ms');
        if (remainder === '' && newObj[newKey] === undefined) {
            newObj[newKey] = value > 0 ? new Date(value).toLocaleString() : "";
            delete newObj[key];
        }
    }
    return newObj;
}

export function handleNewMessage(payload, currentViewModel, setViewModel) {
    if (payload.status === "ok") {
        switch (payload.cmd) {
            case COMMANDS.config:
                handleConfigCommandResponse(payload, currentViewModel, setViewModel);
                break;
            case COMMANDS.moisture_sensors:
                handleReadSensorsCommandResponse(payload, currentViewModel, setViewModel);
                break;
            case COMMANDS.status:
                handleStatusCommandResponse(payload, currentViewModel, setViewModel);
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
    const values = payload.msg
    const newViewModel = {
        ...currentViewModel,
        configuration: {
            debug_level: values.debug_level,
            num_zones: values.num_relay_pins,
            num_sensors: values.num_sensors,
            sensor_wet_limit: values.sensor_wet,
            sensor_dry_limit: values.sensor_dry,
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

    const last_read_timestamp_ms = payload.timestamp_ms
    const zones = payload.msg.map((zone, idx) => {
        let last_changed_timestamp_ms = 0;
        if (currentViewModel.zones[idx] && currentViewModel.zones[idx].state) {
            last_changed_timestamp_ms = currentViewModel.zones[idx].state.last_changed_timestamp_ms
        }
        return {
            title: ZONE_METADATA[idx].title,
            plants: ZONE_METADATA[idx].plants,
            zone_num: idx,
            pin: zone[0],
            state: {
                is_on: zone[1] === IS_ON,
                app_state_minus_digital_read: zone[1] - zone[2],
                last_changed_timestamp_ms,
                last_read_timestamp_ms
            },
            moisture_sensor_index: zone[3]
        }
    })

    const newViewModel = {
        ...currentViewModel,
        zones,
    }
    setViewModel(newViewModel);
}