import logging
import asyncio
import time
from hbmqtt.client import MQTTClient
from hbmqtt.mqtt.constants import QOS_0, QOS_1, QOS_2

async def test_coro():
        C = MQTTClient()
        await  C.connect('mqtt://broker.emqx.io/')
        tasks = [
            asyncio.ensure_future(C.publish('a/b/dsyang', b'TEST MESSAGE WITH QOS_0', qos=QOS_0)),
            asyncio.ensure_future(C.publish('a/b/dsyang', b'TEST MESSAGE WITH QOS_1', qos=QOS_1)),
            asyncio.ensure_future(C.publish('a/b/dsyang', b'TEST MESSAGE WITH QOS_2', qos=QOS_2)),
        ]
        await asyncio.wait(tasks)
        logging.info("messages published")
        await C.disconnect()

if __name__ == '__main__':
    formatter = "[%(asctime)s] %(name)s {%(filename)s:%(lineno)d} %(levelname)s - %(message)s"
    logging.basicConfig(level=logging.DEBUG, format=formatter)
    asyncio.get_event_loop().run_until_complete(test_coro())
