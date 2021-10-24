import React, { useEffect, useState } from 'react';
import { Card, Button, Form, Typography, Divider } from 'antd';
const { Paragraph } = Typography;

const Connection = ({ clientId, connect, disconnect, connectBtn, subscribe, unsubscribe, isSubed}) => {
  const isConnected = connectBtn === 'Connected';
  const [form] = Form.useForm();
  const record = {
    host: 'broker.emqx.io',
    port: 8083,
  };
  const [topicUUID, setTopicUUID] = useState('dsyangtest');
  const [subTopic, setSubTopic] = useState('nessie/publish');
  const onFinish = () => {
    const { host, port } = record;
    const url = `ws://${host}:${port}/mqtt`;
    const options = {
      keepalive: 30,
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
        topic: 'WillMsg',
        payload: 'Connection Closed abnormally..!',
        qos: 0,
        retain: false
      },
      rejectUnauthorized: false,
      clientId: clientId
    };
    connect(url, options);
  };

  const handleConnect = () => {
    form.submit();
  };

  const handleDisconnect = () => {
    unsubscribe({topic: subTopic})
    disconnect();
  };

  const subscriptionArgs = {
    shouldSubscribe: isConnected && !isSubed,
    topic: subTopic
  }

  useEffect( () => {
    if (subscriptionArgs.shouldSubscribe) {
      subscribe({ topic: subscriptionArgs.topic, qos: 0})
    }
  }, [subscriptionArgs, subscribe]);

  const statusText = !isConnected ? "Not Connected." : (isSubed ? "Ready" : "Not Subscribed.")
  const ConnectionInfo = (
    <Form
      layout="vertical"
      name="basic"
      form={form}
      initialValues={record}
      onFinish={onFinish}
    >
      <Typography>
        <Paragraph> Broker: {record.host}:{record.port}</Paragraph>
        <Paragraph> ClientId: {clientId}</Paragraph>
        <Typography.Text>UUID: </Typography.Text>
        <Typography.Text editable={{onChange: setTopicUUID}}>{topicUUID}</Typography.Text>
        <Paragraph></Paragraph>
        <Typography.Text>Read msgs from: {topicUUID}/</Typography.Text>
        <Typography.Text editable={{onChange: setSubTopic}}>{subTopic}</Typography.Text>
        <Divider />
        <Paragraph>{statusText}</Paragraph>
      </Typography>
    </Form>
  )

  return (
    <Card
      title="Connection"
      actions={[
        <Button type="primary" onClick={handleConnect} disabled={isConnected}>{connectBtn}</Button>,
        <Button danger onClick={handleDisconnect}>Disconnect</Button>
      ]}
    >
      {ConnectionInfo}
    </Card>
  );
}

export default Connection;
