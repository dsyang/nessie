import logging
import traceback
import time
import json
import paho.mqtt.client as mqtt

UUID = '7ee6f9fa-c7b4-4427-b441-c9d00897f33e'

class NessieError(Exception):
    """ Class for exceptions from this app"""

def subscribe_topics():
    """Subscribe to these topics to receive commands to start / stop water. Report soil moisture. And report app state.
    """
    return f"{UUID}/nessie/subscribe"

def publish_topic():
    """Publish on this topic to report watering start/stop, report soil moisture, report app state.
    """
    return f"{UUID}/nessie/publish"

def ok_payload(msg):
    timestamp_ms = int(time.time()*1000)
    output = f"{{ 'status': 'ok', 'msg': '{msg}', 'timestamp_ms':{timestamp_ms} }}"
    return output

def error_payload(error):
    timestamp_ms = int(time.time()*1000)
    output= f"{{ 'status': 'error', 'msg': '{error}', 'timestamp_ms':{timestamp_ms} }}"
    return output

def send(payload):
    mid = client.publish(publish_topic(), payload=payload)
    logging.info(f"PUB {publish_topic()}: {mid}, payload={payload}")
    

def handle_command(client, data):
    try:
        payload = json.loads(data)
        cmd = payload['cmd']
        resp = None
        if cmd == 'start':
            resp = ok_payload('started')
        elif cmd == 'stop':
            resp = ok_payload('stopped')
        elif cmd == 'moisture':
            resp = ok_payload('moisture levels:')
        elif cmd == 'debug':
            resp = ok_payload('app_state:')
        elif cmd == 'DIE':
            resp = ok_payload('shutting down')
        else:
            msg =f"Invalid payload received: {data}" 
            raise NessieError(msg)
        if (resp is not None):
            send(resp)
        else:
            send(error_payload("no response payload"))

    except NessieError as err:
        msg = traceback.format_exc()
        logging.error(msg)
        send(error_payload(f"App Error: {msg}"))
        
    except Exception as err:
        msg = traceback.format_exc()
        logging.error(msg)
        send(error_payload(f"Python Error: {msg}"))


def on_connect(client, userdata, flags, rc):
    """ Callback function called when connected"""
    logging.info(f"CONN: {rc}")
    mid = client.subscribe(subscribe_topics())
    logging.info(f"SUB {subscribe_topics()}: {mid}")

def on_subscribe(client, userdata, mid, granted_qos):
    """ Callback function called when broker confirms we're subscribed. mid is the value returned from client.subscribe()"""
    logging.info(f"SUB_ACK: {mid}")

def on_publish(client, userdata, mid):
    """ Callback function called when broker confirms message was transmitted."""
    logging.info(f"PUB_ACK: {mid}")

def on_message(client, userdata, msg):
    """ Callback function called when we received a message"""
    logging.info(f"RECV {msg.topic}, payload = {str(msg.payload)}")
    if (msg.topic != subscribe_topics()):
        logging.error(f"No handler for topic {msg.topic}")
        return
    else:
        handle_command(client, msg.payload)
        return

if __name__ == '__main__':
    formatter = "[%(asctime)s] %(name)s {%(filename)s:%(lineno)d} %(levelname)s - %(message)s"
    logging.basicConfig(level=logging.DEBUG, format=formatter)
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_subscribe = on_subscribe
    client.on_publish = on_publish
    client.on_message = on_message
    
    
    client.connect("broker.emqx.io", 1883, 60)
    client.loop_forever()
