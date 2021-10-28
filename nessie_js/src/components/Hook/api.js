export const COMMANDS = {
    status: "status",
    config: "config",
    moisture_sensors: "moisture",
    water_start: "start",
    water_stop: "stop",
    stopall: "STOPALL",
}



export function genRequestZonesReading(mqttPublish) {
    return () => {
        mqttPublish({
            qos: 0,
            payload: JSON.stringify({
                cmd: COMMANDS.status,
            })
        })
    };
}

export function genRequestConfig(mqttPublish) {
    return () => {
        mqttPublish({
            qos: 0,
            payload: JSON.stringify({
                cmd: COMMANDS.config,
            })
        });
    };
}

export function genRequestMoistureReadings(mqttPublish) {
    return () => {
        mqttPublish({
            qos: 0,
            payload: JSON.stringify({
                cmd: COMMANDS.moisture_sensors,
            })
        });
    };    
}