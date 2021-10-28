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

export function handleNewMessage() {

}

const exConfig = { 'debug_level': 0, 'num_relay_pins': 4, 'solenoid_pin': 7, 'num_sensors': 4, 'sensor_wet': 700, 'sensor_dry': 810 }
const exStats = { 'data': { '7': [1, 1], '6': [1, 1], '4': [1, 1], '5': [1, 1] } }
const exSensors = {'readings': [850, 875, 868, 859]}