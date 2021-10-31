import React from 'react';
import { Card, Button, Collapse } from 'antd';
import { Typography, } from 'antd';
import { COMMAND_PAYLOADS } from './api';
import SensorReading from "./SensorReading";

const { Paragraph, Text } = Typography;
const { Panel, } = Collapse;
const Stats = ({ config, requestConfig, sensors, requestSensorsReading, zones, requestZonesReading, requestStopAll }) => {

    const SensorReadings = (
        <>
            {Object.entries(sensors).map(([idx, reading]) => <SensorReading key={idx} idx={idx} reading={reading} />)}
        </>
    )
    return (
        <Card
            title="Stats"
        >
            <Typography>
                <Paragraph>Config: <Text code>{JSON.stringify(config, null, 2)}</Text></Paragraph>
                <Paragraph ellipsis={{ rows: 2, expandable: true }}>Moisture Sensor Readings: <Text code>{JSON.stringify(sensors)}</Text></Paragraph>
                {SensorReadings}
                <Paragraph ellipsis={{ rows: 2, expandable: true }}>Zone Readings: {JSON.stringify(zones)}</Paragraph>
                <Paragraph>
                    <Button onClick={requestConfig}>{"Read Config"}</Button>
                    <Button onClick={requestSensorsReading}>{"Read Moisture Sensors"}</Button>
                    <Button onClick={requestZonesReading}>{"Read Zone Stats"}</Button>
                    <Button danger onClick={requestStopAll}>{"Stop all watering"}</Button>
                </Paragraph>
            </Typography>
            <Collapse ghost>
                <Panel header="Explicit Commands">
                    <Typography>
                        <Paragraph code>{COMMAND_PAYLOADS.config}</Paragraph>
                        <Paragraph code>{COMMAND_PAYLOADS.moisture_sensors}</Paragraph>
                        <Paragraph code>{COMMAND_PAYLOADS.status}</Paragraph>
                    </Typography>
                </Panel>
            </Collapse>
        </Card>
    )
}

export default Stats;
