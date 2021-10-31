import React from 'react';
import { Card, Button } from 'antd';
import { Typography, } from 'antd';
import { Collapse } from 'antd';
import { COMMAND_PAYLOADS } from './api';
import SensorReadings from './SensorReading';
import { transformTimestampMsToString } from './lib';

const { Paragraph, Text } = Typography;
const { Panel } = Collapse;

const Zone = ({ zone, sensors, requestStartWatering, requestStopWatering, requestSensorsReading }) => {

    const Description = zone.plants ? <Paragraph>with {zone.plants} </Paragraph> : undefined;
    const [idx, reading] = [zone.moisture_sensor_index, sensors[zone.moisture_sensor_index]];
    const state = transformTimestampMsToString(zone.state);

    const Status = (<>
        <Paragraph>
            <Text strong>{state.is_on ? "WATERING" : "STOPPED"} </Text>
            - (Checksum: {state.app_state_minus_digital_read}) as of {state.last_read}
        </Paragraph>
    </>)

    const RecentlyChanged = state.last_changed ? <Paragraph>Recently updated on {state.last_changed}</Paragraph> : <Paragraph>No recent changes while connected.</Paragraph>;

    return (
        <Card
            title={`${zone.zone_num}. ${zone.title}`}
        >
            <Typography>
                {Description}
                {Status}
                {RecentlyChanged}
                <SensorReadings idx={idx} reading={reading} />
                <Paragraph>
                    <Button onClick={requestStartWatering}>{"Start watering"}</Button>
                    <Button onClick={requestStopWatering}>{"Stop watering"}</Button>
                    <Button onClick={requestSensorsReading}>{"Update moisture"}</Button>
                </Paragraph>
            </Typography>
            <Collapse ghost>
                <Panel header="Explicit Commands">
                    <Typography>
                        <Paragraph code>{COMMAND_PAYLOADS.water_start(zone.zone_num)}</Paragraph>
                        <Paragraph code>{COMMAND_PAYLOADS.water_stop(zone.zone_num)}</Paragraph>
                    </Typography>
                </Panel>
            </Collapse>
        </Card>
    )
}

export default Zone