import logging
import time
import serial
import json
import inspect
from utils import NessieError

DEBUG_LEVEL = 2


class NessieHardware:
    """
    Class for talking to the nessie watering hardware controller. Return value of APIs are all a dictionary like this:
     { 'result code': 200|304|404|500, 'msg': <debug string or error message for 4xx|500> }
    """

    def __init__(self, filename, logger):
        self.conn = serial.Serial(filename, timeout=1)  # wait 1 second for reads.
        self.logger = logger

    def __enter__(self):
        return self

    def __exit__(self, type, value, traceback):
        self.conn.close()

    def __read_json(self, string):
        try:
            val = json.loads(string)
            if DEBUG_LEVEL > 1:
                self.logger.debug(
                    f"Reading json from {inspect.stack()[1].function}(): {val}"
                )
            return val
        except json.decoder.JSONDecodeError as err:
            return {"result": 500, "msg": err.msg}

    def read_configuration(self):
        """
        first function called after establishing connection to read configuration options. Should be a json object that looks like this:
        { 'debug_level': <num>, 'num_zones': <num>, 'num_sensors': <num>, 'solenoid_pin': <num> }
        """
        self.conn.write(b"CONFIG|")
        line = self.conn.readline()
        val = self.__read_json(line)
        if "result" in val:
            raise NessieError(
                f"Failure reading initial configuration: {val['msg']} out of input: {line}"
            )
        return val

    def read_state(self):
        """
        tell hardware to read state of watering zones. response should be a json object that looks like this:
        { 'data': {'<pin_num>': [ '<pin_state>', '<digital_read>' ], ...} }

        """
        self.conn.write(b"SENSE|")
        line = self.conn.readline()
        val = self.__read_json(line)
        if "result" in val:
            raise NessieError(
                f"Failure reading state: {val['msg']} out of input: {line}"
            )

        return line


def start_watering(conn, config, zone_num):
    pass


def stop_watering(conn, config, zone_num):
    pass


def read_moisture_sensors(conn, config):
    pass


def toggle_watering(conn, config, zone_num):
    pass


if __name__ == "__main__":
    formatter = (
        "[%(asctime)s] %(name)s {%(filename)s:%(lineno)d} %(levelname)s - %(message)s"
    )
    logging.basicConfig(level=logging.DEBUG, format=formatter)
    with NessieHardware("/dev/ttyACM0", logging) as hw:
        hw.read_configuration()
        time.sleep(3)
        hw.read_state()
