import React from 'react';
import { Card, Button } from 'antd';
import { Typography, } from 'antd';

const { Paragraph, } = Typography;
const Stats = ({ config, requestConfig, sensors, requestSensorsReading, zones, requestZonesReading }) => {


    return (
        <Card
            title="Stats"
        >
            <Typography>
                <Paragraph>Config: {JSON.stringify(config)}</Paragraph>
                <Paragraph>Sensor Readings: {JSON.stringify(sensors)}</Paragraph>
                <Paragraph>Zone Readings: {JSON.stringify(zones)}</Paragraph>
                <Paragraph>
                    <Button onClick={requestConfig}>{"Read Config"}</Button>
                    <Button onClick={requestSensorsReading}>{"Read Moisture Sensors"}</Button>
                    <Button onClick={requestZonesReading}>{"Read Zone Stats"}</Button>
                </Paragraph>
            </Typography>
        </Card>
    )
}

export default Stats;
