from json.decoder import JSONDecodeError
import logging
import traceback
import time
import json
import paho.mqtt.client as mqtt
import hardware
import argparse

from utils import NessieError
from hardware import NessieHardware


class NessieMqttClient:
    def __init__(self, hw, logger, uuid, broker_url):
        self.hw = hw
        self.logger = logger

        self.uuid = uuid
        self.publish_topic = f"{uuid}/nessie/publish"
        self.subscribe_topic = f"{uuid}/nessie/subscribe"

        self.broker_url = broker_url

        self.mqtt = mqtt.Client()
        self.mqtt.on_connect = self.__on_connect
        self.mqtt.on_subscribe = self.__on_subscribe
        self.mqtt.on_publish = self.__on_publish
        self.mqtt.on_message = self.__on_message

        self.hw_config = hw.read_configuration()

    def __enter__(self):
        self.mqtt.connect(self.broker_url)
        return self

    def __exit__(self, type, value, traceback):
        self.mqtt.loop_stop()

    def ok_payload(self, cmd, msg):
        timestamp_ms = int(time.time() * 1000)
        output = f'{{ "status": "ok", "cmd": "{cmd}", "msg": {msg}, "timestamp_ms":{timestamp_ms} }}'
        return output

    def error_payload(self, cmd, error):
        timestamp_ms = int(time.time() * 1000)
        output = f'{{ "status": "error", "cmd": "{cmd}", "msg": "{error}", "timestamp_ms":{timestamp_ms} }}'
        return output

    def send(self, payload):
        mid = self.mqtt.publish(self.publish_topic, payload=payload)
        self.logger.info(f"PUB {self.publish_topic}: {mid}, payload={payload}")

    def handle_command(self, data):
        try:
            payload = json.loads(data)
            cmd = payload["cmd"]
            resp = None
            if cmd == "start":
                zone_num = int(payload["data"]["zone"])
                val = self.hw.start_watering(zone_num)

                if val["data"] == 200:
                    resp = self.ok_payload(cmd, f"started zone {zone_num}")
                else:
                    resp = self.ok_payload(cmd, f"zone {zone_num} already started")
            elif cmd == "stop":
                zone_num = int(payload["data"]["zone"])
                val = self.hw.stop_watering(zone_num)

                if val["data"] == 200:
                    resp = self.ok_payload(cmd, f"started zone {zone_num}")
                else:
                    resp = self.ok_payload(cmd, f"zone {zone_num} already stopped")
            elif cmd == "moisture":
                val = self.hw.read_moisture_sensors()
                resp = self.ok_payload(cmd, json.dumps(val['data']))
            elif cmd == "status":
                val = self.hw.read_state()
                resp = self.ok_payload(cmd, json.dumps(val["data"]))
            elif cmd == "STOPALL":
                resp = self.ok_payload(cmd, "shutting down")
                val = self.hw.stop_all()
                resp = self.ok_payload(cmd, "stopped all watering zones")
            elif cmd == "config":
                resp = self.ok_payload(cmd, json.dumps(self.hw.config))
            else:
                msg = f"Invalid payload received: {data}"
                raise NessieError(msg)
            if resp is not None:
                self.send(resp)
            else:
                self.send(self.error_payload(cmd, "no response payload"))

        except NessieError as err:
            msg = traceback.format_exc()
            self.logger.error(msg)
            self.send(self.error_payload("NessieError", f"{msg}"))

        except JSONDecodeError as err:
            msg = traceback.format_exc()
            self.logger.error(msg)
            self.send(
                self.error_payload("JSONDecodeError", f"When decoding {data} \n {msg}")
            )
        except Exception as err:
            msg = traceback.format_exc()
            self.logger.error(msg)
            self.send(self.error_payload("PythonError", f"{msg}"))

    def __on_connect(self, client, userdata, flags, rc):
        """Callback function called when connected"""
        self.logger.info(f"CONN: {rc}")
        mid = self.mqtt.subscribe(self.subscribe_topic)
        self.logger.info(f"SUB {self.subscribe_topic}: {mid}")

    def __on_subscribe(self, client, userdata, mid, granted_qos):
        """Callback function called when broker confirms we're subscribed. mid is the value returned from client.subscribe()"""
        self.logger.info(f"SUB_ACK: {mid}")

    def __on_publish(self, client, userdata, mid):
        """Callback function called when broker confirms message was transmitted."""
        self.logger.info(f"PUB_ACK: {mid}")

    def __on_message(self, client, userdata, msg):
        """Callback function called when we received a message"""
        self.logger.info(f"RECV {msg.topic}, payload = {str(msg.payload)}")
        if msg.topic != self.subscribe_topic:
            self.logger.error(f"No handler for topic {msg.topic}")
            return
        else:
            self.handle_command(msg.payload)
            return


if __name__ == "__main__":
    formatter = (
        "[%(asctime)s] %(name)s {%(filename)s:%(lineno)d} %(levelname)s - %(message)s"
    )
    logging.basicConfig(level=logging.DEBUG, format=formatter)

    with NessieHardware("/dev/ttyACM0", logging) as hw:
        with NessieMqttClient(
            hw=hw, logger=logging, broker_url="broker.emqx.io", uuid="dsyangtest"
        ) as client:
            time.sleep(0.5)
            client.send("OLLLLL")
            client.send("HAIIIII")
            client.send('{"cmd": "asdfasdf", "payload": true}')
            client.mqtt.loop_forever()
