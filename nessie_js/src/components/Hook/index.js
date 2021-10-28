import React, { createContext, useEffect, useState } from 'react';
import Connection from './Connection';
import Publisher from './Publisher';
import Receiver from './Receiver';
import Stats from './Stats';
import { genRequestConfig, genRequestMoistureReadings, genRequestZonesReading } from './api';
import { INITIAL_VIEW_MODEL, handleNewMessage } from './lib';
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
  const [viewModel, setViewModel] = useState(INITIAL_VIEW_MODEL);

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
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      client.removeAllListeners('message');
      client.on('message', (topic, message) => {
        const payload = { topic, message: message.toString() };
        console.log(payload);
        let msg_json = ""
        let did_error = false;
        try {
          msg_json = JSON.parse(message)
        } catch (objError) {
          did_error = true;
          if (objError instanceof SyntaxError) {
            console.error(objError.name);
          } else {
            console.error(objError.message);
          }
        }

        if (!did_error) {
          handleNewMessage(msg_json, viewModel, setViewModel);
        }
        setPayload(payload);
      });
    }
  }, [client, viewModel]);

  const mqttDisconnect = () => {
    if (client) {
      client.end(() => {
        setConnectStatus('Connect');
      });
    }
  }

  const mqttPublish = (context) => {
    if (client) {
      const { qos, payload } = context;
      client.publish(publishTopic, payload, { qos }, error => {
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
          config={viewModel.configuration}
          zones={viewModel.zones}
          sensors={viewModel.moisture_sensors}
          requestConfig={genRequestConfig(mqttPublish)}
          requestZonesReading={genRequestZonesReading(mqttPublish)}
          requestSensorsReading={genRequestMoistureReadings(mqttPublish)}
        />}
      <QosOption.Provider value={qosOption}>
        <Publisher publish={mqttPublish} isConnected={connectStatus === "Connected"} />
      </QosOption.Provider>
      <Receiver payload={payload} />
    </>
  );
}

export default HookMqtt;
