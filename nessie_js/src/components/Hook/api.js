export function genRequestZonesReading(mqttPublish) {
    return () => {
        mqttPublish({
            qos: 0,
            payload: JSON.stringify({
                cmd: "status",
            })
        })
    };
}

export function genRequestConfig(mqttPublish) {
    return () => {
        mqttPublish({
            qos: 0,
            payload: JSON.stringify({
                cmd: "config",
            })
        });
    };
}

export function genRequestMoistureReadings(mqttPublish) {
    return () => {
        mqttPublish({
            qos: 0,
            payload: JSON.stringify({
                cmd: "moisture",
            })
        });
    };    
}