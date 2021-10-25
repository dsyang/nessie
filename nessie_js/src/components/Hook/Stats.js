import React, { useState } from 'react';
import { Card, Form, Input, Row, Col, Button, Select } from 'antd';
import { Typography, } from 'antd';

const { Paragraph, } = Typography;
const Stats = ({ config, requestConfig, sensors, requestSensorsReading, zones, requestZonesReading }) => {


    return (
        <Card
            title="Stats"
            actions={[
                <Button onClick={requestConfig}>{"Read Config"}</Button>,
                <Button onClick={requestSensorsReading}>{"Read Moisture Sensors"}</Button>,
                <Button onClick={requestZonesReading}>{"Read Zone Stats"}</Button>
            ]}
        >
            <Typography>
                <Paragraph>Config: {config}</Paragraph>
                <Paragraph>LOLOL</Paragraph>
            </Typography>
        </Card>
    )
}

const readConfig = () => {
    console.log("LOLHI");
}

export { readConfig };
export default Stats;
