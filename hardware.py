import logging
import time
import serial
import json
import inspect
from utils import NessieError


class NessieHardware:
    """
    Class for talking to the nessie watering hardware controller. Return value of APIs are all a dictionary like this:
     { 'result code': 200|304|404|500, 'msg': <debug string or error message for 4xx|500> }
    """

    def __init__(self, filename, logger, debug_level=0):
        self.conn = serial.Serial(filename, timeout=1)  # wait 1 second for reads.
        self.logger = logger
        self.debug_level = debug_level
        self.config = None

    def __enter__(self):
        time.sleep(0.5)
        self.config = self.read_configuration()["data"]
        return self

    def __exit__(self, type, value, traceback):
        self.conn.close()

    def __read_json(self, string):
        try:
            val = json.loads(string)
            if self.debug_level > 1:
                self.logger.debug(
                    f"Reading json from {inspect.stack()[1].function}(): {val}"
                )
            return val
        except json.decoder.JSONDecodeError as err:
            return {"result": 500, "msg": err.msg}

    def __read_json_or_throw(self, line, fail_msg):
        val = self.__read_json(line)
        if "result" in val:
            raise NessieError(f"{fail_msg}: {val['msg']} out of input: {line}")
        return val

    def read_conn(self):
        line = self.conn.readline()
        self.logger.info(f"resp: {line}")
        return line

    def write_conn(self, cmd):
        # See if emergency shutoff was initiated and there's something for us to read.
        if (self.conn.inWaiting() > 0):
            line = self.conn.readline()
            self.logger.info(f"EMERGENCY SHUTOFF FOR SOLENOID OCCURED")

        self.logger.info(f"cmd: {cmd}")
        self.conn.write(cmd.encode())

    def __water_zone(self, zone_num, start_watering):
        """
        send command to hardware to start or stop watering the given zone. Response should be a json object that looks like this:
        { 'data': 200|304} where 200 means it started watering, 304 means it was already watering.
        """
        START_VAL = 0
        STOP_VAL = 1
        num_relay_pins = self.config["num_relay_pins"]
        if zone_num < num_relay_pins:
            cmd = f"ZONE{zone_num}_{START_VAL if start_watering else STOP_VAL}|"
            self.write_conn(cmd)
            line = self.read_conn()
            val = self.__read_json_or_throw(
                line,
                f"Failure {'starting' if start_watering else 'stopping'} to water zone {zone_num}",
            )
            return val

        else:
            raise NessieError(
                f"Only {num_relay_pins} zones, can't water zone {zone_num}."
            )

    def read_configuration(self):
        """
        first function called after establishing connection to read configuration options. Should be a json object that looks like this:
        { 'debug_level': <num>, 'num_zones': <num>, 'num_sensors': <num>, 'solenoid_pin': <num> }
        """
        self.write_conn("CONFIG|")
        line = self.read_conn()
        val = self.__read_json_or_throw(line, "Failure reading initial configuration")
        return val

    def read_state(self):
        """
        tell hardware to read state of watering zones. response should be a json object that looks like this:
        { 'data': {'<pin_num>': [ '<pin_state>', '<digital_read>', '<moisture_sensor_index>' ], ...} }

        """
        self.write_conn("STATUS|")
        line = self.read_conn()
        val = self.__read_json_or_throw(line, "Failure reading status")
        return val

    def read_moisture_sensors(self):
        """
        tell hardware to read moisture sensors. response should be a json object that looks like this:
        { 'data': {'readings': [ <sensor_1>, <sensor_2> ], "wet_limit": <num>, "dry_limit": <num>} }

        """
        self.write_conn("SENSE|")
        line = self.read_conn()
        val = self.__read_json_or_throw(line, "Failure reading sensors")
        val["data"]["wet_limit"] = self.config["sensor_wet"]
        val["data"]["dry_limit"] = self.config["sensor_dry"]
        return val

    def start_watering(self, zone_num):
        return self.__water_zone(zone_num, start_watering=True)

    def stop_watering(self, zone_num):
        return self.__water_zone(zone_num, start_watering=False)

    def stop_all(self):
        self.write_conn("STOP|")
        line = self.read_conn()
        val = self.__read_json_or_throw(line, "Failure stopping all watering")
        return val


if __name__ == "__main__":
    formatter = (
        "[%(asctime)s] %(name)s {%(filename)s:%(lineno)d} %(levelname)s - %(message)s"
    )
    logging.basicConfig(level=logging.DEBUG, format=formatter)
    with NessieHardware("/dev/ttyACM0", logging) as hw:
        logging.info(hw.config)
        logging.info(hw.read_state())
        logging.info(hw.start_watering(3))
        logging.info(hw.read_state())
        
