import argparse
import logging
from logging.handlers import RotatingFileHandler
from hardware import NessieHardware
from server import NessieMqttClient


if __name__ == "__main__":
    formatter = (
        "[%(asctime)s] %(name)s {%(filename)s:%(lineno)d} %(levelname)s - %(message)s"
    )
    logging.basicConfig(
        level=logging.DEBUG,
        format=formatter,
        handlers= [
            RotatingFileHandler("nessie.log", maxBytes=1024*300, backupCount=1),
            logging.StreamHandler()
        ]
    )

    parser = argparse.ArgumentParser(
        description="Remote watering system that controls an arduino with mqtt."
    )
    parser.add_argument(
        "arduino",
        help="A device file representing the serial connection for the Arduino. (/dev/ttyACM0 9600)",
    )
    parser.add_argument(
        "--mqtt", default="broker.emqx.io", help="url of the mqtt broker to use"
    )
    parser.add_argument(
        "--uuid",
        default="7ee6f9fa-c7b4-4427-b441-c9d00897f33e",
        help="a uuid prefix to the mqtt topics this publishes.",
    )

    arguments = parser.parse_args()

    with NessieHardware(arguments.arduino, logging) as hw:
        with NessieMqttClient(
            hw, logging, uuid=arguments.uuid, broker_url=arguments.mqtt
        ) as client:
            logging.info(client.hw.config)

            client.mqtt.loop_forever()
