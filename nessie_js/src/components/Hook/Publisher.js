import React, { useContext } from 'react';
import { Form, Input, Row, Col, Button, Select } from 'antd';
import { Typography, } from 'antd';
import { QosOption } from './index'

const { Paragraph } = Typography;
const Publisher = ({ publish, isConnected }) => {
  const [form] = Form.useForm();
  const qosOptions = useContext(QosOption);

  const record = {
    topic: 'dsyangtest/nessie/subscribe',
    qos: 0,
  };

  const onFinish = (values) => {
    publish(values)
  };
  const readmeText =
    `
The MQTT payload it expects to see looks like:{ "cmd": string, "data": ?JSONObject}
where <> is:
- "start": data is \`{"zone": int}\`. Starts to water the zone. Does nothing if zone is already started. Will not stop until stop command given.
- "stop": data is \`{"zone": int}\`. Stops watering the zone. Does nothing if zone not started.
- "DIE": disconnects from mqtt and ends program.
- "moisture": data is \`{"zone": int}\`. Publishes moisture sensor reading for zone. If \`zone == -1\` the publishes moisture sensor deading for all zones as a single mqtt message.
- "status": publishes current app state.
- "config": publishes current config.
`
  const ReadmeText =
    <Typography>
      <Paragraph>
        <pre>{readmeText}</pre>
      </Paragraph>
    </Typography>;

  const PublishForm = (
    <Form
      layout="vertical"
      name="basic"
      form={form}
      initialValues={record}
      onFinish={onFinish}
    >
      <Row gutter={20}>
        <Col span={12}>
          <Form.Item
            label="Topic"
            name="topic"
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="QoS"
            name="qos"
          >
            <Select options={qosOptions} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            label="Payload"
            name="payload"
          >
            <Input.TextArea />
          </Form.Item>
        </Col>
        <Col span={8} offset={16} style={{ textAlign: 'right' }}>
          <Form.Item>
            <Button type="primary" htmlType="submit" disabled={!isConnected}>
              Publish
            </Button>
          </Form.Item>
        </Col>
        <Col span={24}>
          {ReadmeText}
        </Col>
      </Row>
    </Form>
  )

  return (
    <>
      {PublishForm}
    </>
  );
}

export default Publisher;
