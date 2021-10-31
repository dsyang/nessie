import React from 'react';
import { Typography, } from 'antd';
import { transformTimestampMsToString } from "./lib";

const { Paragraph, Text } = Typography;

const SensorReadings = ({ idx, reading }) => {
    const value = transformTimestampMsToString(reading);
    return (
        <Paragraph>
            Moisture Sensor {idx}: <Text strong>{value.reading}</Text> on {value.last_read}
        </Paragraph>
    );
}

export default SensorReadings;