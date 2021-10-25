import React, { createContext, useEffect, useState } from 'react';
import Connection from './Connection';
import Publisher from './Publisher';
import Receiver from './Receiver';
import Stats, { readConfig } from './Stats';
import mqtt from 'mqtt';

export const QosOption = createContext([])
const qosOption = [
  {
    label: '0',
    value: 0,
  }, {
    label: '1',
    value: 1,
  }, {
    label: '2',
    value: 2,
  },
];

const HookMqtt = () => {
  const [clientId] = useState(`nessie_js_${Math.random().toString(16).substr(2, 8)}`)
  const [client, setClient] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [payload, setPayload] = useState({});
  const [connectStatus, setConnectStatus] = useState('Connect');
  const [publishTopic, setPublishTopic] = useState('');

  const mqttConnect = (host, mqttOption, publishTopic) => {
    if (client === null || !client.connected) {
      setConnectStatus('Connecting');
      setClient(mqtt.connect(host, mqttOption));
      setPublishTopic(publishTopic);
    }
  };

  useEffect(() => {
    if (client) {
      client.on('connect', () => {
        setConnectStatus('Connected');
      });
      client.on('error', (err) => {
        console.error('Connection error: ', err);
        client.end();
      });
      client.on('reconnect', () => {
        setConnectStatus('Reconnecting');
      });
      client.on('message', (topic, message) => {
        const payload = { topic, message: message.toString() };
        console.log(payload);
        setPayload(payload);
      });
    }
  }, [client]);

  const mqttDisconnect = () => {
    if (client) {
      client.end(() => {
        setConnectStatus('Connect');
      });
    }
  }

  const mqttPublish = (context) => {
    if (client) {
      const { topic, qos, payload } = context;
      client.publish(topic, payload, { qos }, error => {
        if (error) {
          console.log('Publish error: ', error);
        }
      });
    }
  }

  const mqttSub = (subscription) => {
    if (client && !client.disconnecting) {
      const { topic, qos } = subscription;
      client.subscribe(topic, { qos }, (error) => {
        if (error) {
          console.log('Subscribe to topics error', error)
          return
        }
        console.log(`Subscribed to ${topic}`);
        setIsSubscribed(true)
      });
    }
  };

  const mqttUnSub = (subscription) => {
    if (client) {
      const { topic } = subscription;
      client.unsubscribe(topic, error => {
        if (error) {
          console.log('Unsubscribe error', error)
          return
        }
        setIsSubscribed(false);
      });
    }
  };

  const exConfig = { 'debug_level': 0, 'num_relay_pins': 4, 'solenoid_pin': 7, 'num_sensors': 4, 'sensor_wet': 700, 'sensor_dry': 810 }
  const exStats = { 'data': { '7': [1, 1], '6': [1, 1], '4': [1, 1], '5': [1, 1] } }
  const exSensors = { 'data': { '7': [0, 0], '6': [1, 1], '4': [1, 1], '5': [1, 1] } }
  const requestConfig = () => {
    mqttPublish({
      topic: publishTopic,
      qos: 0,
      payload: JSON.stringify({
        cmd: "config",
      })
    });
  }
  const requestZonesReading = () => {
    mqttPublish({
      topic: publishTopic,
      qos: 0,
      payload: JSON.stringify({
        cmd: "status",
      })
    })
  }
  return (
    <>
      <Connection
        clientId={clientId}
        connect={mqttConnect}
        disconnect={mqttDisconnect}
        connectBtn={connectStatus}
        subscribe={mqttSub}
        unsubscribe={mqttUnSub}
        isSubscribed={isSubscribed} />
      {!isSubscribed ? null :
        <Stats
          config={JSON.stringify(exConfig)}
          stats={JSON.stringify(exStats)}
          exSensors={JSON.stringify(exSensors)}
          requestConfig={requestConfig}
          requestZonesReading={requestZonesReading}
        />}
      <QosOption.Provider value={qosOption}>
        <Publisher publish={mqttPublish} isConnected={connectStatus === "Connected"} />
      </QosOption.Provider>
      <Receiver payload={payload} />
    </>
  );
}

export default HookMqtt;
