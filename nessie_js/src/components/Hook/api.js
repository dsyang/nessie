export const COMMANDS = {
    status: "status",
    config: "config",
    moisture_sensors: "moisture",
    water_start: "start",
    water_stop: "stop",
    stopall: "STOPALL",
}

export const COMMAND_PAYLOADS = {
    status: JSON.stringify({
        cmd: COMMANDS.status,
    }),
    config: JSON.stringify({
        cmd: COMMANDS.config,
    }),
    moisture_sensors: JSON.stringify({
        cmd: COMMANDS.moisture_sensors,
    }),
    water_start: (zone_num) => {
        return JSON.stringify({
            cmd: COMMANDS.water_start,
            data: {
                zone: zone_num,
            },
        });
    },
    water_stop: (zone_num) => {
        return JSON.stringify({
            cmd: COMMANDS.water_stop,
            data: {
                zone: zone_num,
            },
        });
    },
    stopall: JSON.stringify({
        cmd: COMMANDS.stopall,
    }),
}



export function genRequestZonesReading(mqttPublish) {
    return () => {
        mqttPublish({
            qos: 0,
            payload: COMMAND_PAYLOADS.status,
        })
    };
}

export function genRequestConfig(mqttPublish) {
    return () => {
        mqttPublish({
            qos: 0,
            payload: COMMAND_PAYLOADS.config,
        });
    };
}

export function genRequestMoistureReadings(mqttPublish) {
    return () => {
        mqttPublish({
            qos: 0,
            payload: COMMAND_PAYLOADS.moisture_sensors,
        });
    };
}

export function genRequestStopAll(mqttPublish) {
    return () => {
        mqttPublish({
            qos: 0,
            payload: COMMAND_PAYLOADS.stopall,
        });
    }
}