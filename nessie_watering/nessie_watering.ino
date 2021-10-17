/*
 Program controlling moisture sensors and water pumps for nessie.
 It accepts commands from serial to turn on, turn off, or read moisture sensors.
 Error codes are written back.

 Accepted commands:
  - ZONE(1,2,3,4)_1 -> 200 ok, 304 not modified, 500 error
  - ZONE(1,2,3,4)_0 -> 200 ok, 304 not modified, 500 error
  - SENSE -> snprintf("%04d %04d %04d %04d")

From https://cpp4arduino.com/2020/02/07/how-to-format-strings-without-the-string-class.html
  snprintf_P(s, sizeof(s), PSTR("%s is %i years old"), name, age);

*/
/* 0 = none 1 = normal 2 = verbose */
int IS_DEBUG_LEVEL = 2;

int NUM_ZONES = 4;
int MOISTURE_SENSOR_ZONE_0 = A0;
int MOISTURE_SENSOR_ZONE_1 = A2;
int MOISTURE_SENSOR_ZONE_2 = A4;
int MOISTURE_SENSOR_ZONE_3 = A5;

int MOISTURE_SENSORS[] = {MOISTURE_SENSOR_ZONE_0, MOISTURE_SENSOR_ZONE_1, MOISTURE_SENSOR_ZONE_2, MOISTURE_SENSOR_ZONE_3};
char SENSE_CMD_OUT[] = "%04d %04d %04d %04d";


int WATER_PUMP_ZONE_0 = 7;
int WATER_PUMP_ZONE_1 = 6;
int WATER_PUMP_ZONE_2 = 4;
int WATER_PUMP_ZONE_3 = 5;

int ZONE_PINS[] = { WATER_PUMP_ZONE_0, WATER_PUMP_ZONE_1, WATER_PUMP_ZONE_2, WATER_PUMP_ZONE_3};
char STATUS_CMD_OUT[] = "Z0(%d)=%d:%d Z1(%d)=%d:%d Z2(%d)=%d:%d Z3(%d)=%d:%d";

// High means LED is off
int zoneStates[] = {HIGH, HIGH, HIGH, HIGH};

String in_buffer;
String out_buffer;

void setup() {
  analogReference(EXTERNAL);

  pinMode(WATER_PUMP_ZONE_0, OUTPUT);
  digitalWrite(WATER_PUMP_ZONE_0, zoneStates[0]);

  pinMode(WATER_PUMP_ZONE_1, OUTPUT);
  digitalWrite(WATER_PUMP_ZONE_1, zoneStates[1]);

  pinMode(WATER_PUMP_ZONE_2, OUTPUT);
  digitalWrite(WATER_PUMP_ZONE_2, zoneStates[2]);

  pinMode(WATER_PUMP_ZONE_3, OUTPUT);
  digitalWrite(WATER_PUMP_ZONE_3, zoneStates[3]);

  Serial.begin(9600);
  while (!Serial) {
    // Wait for serial connection to be established.
  }
  if (IS_DEBUG_LEVEL) {
    Serial.setTimeout(5000);
  }
}

void loop() {
  readSerialPortUntil();

  if (in_buffer != "") {
    if (in_buffer == "SENSE") {
      readMoistureSensors();

    } else if (in_buffer == "STATUS") {
      readZones();

    } else if (in_buffer == "ZONE0_0") {
      zoneStates[0] = water(WATER_PUMP_ZONE_0, zoneStates[0], LOW);
    } else if (in_buffer == "ZONE0_1") {
      zoneStates[0] = water(WATER_PUMP_ZONE_0, zoneStates[0], HIGH);
    }

     else if (in_buffer == "ZONE1_0") {
      zoneStates[1] = water(WATER_PUMP_ZONE_1, zoneStates[1], LOW);
    } else if (in_buffer == "ZONE1_1") {
      zoneStates[1] = water(WATER_PUMP_ZONE_1, zoneStates[1], HIGH);
    }

     else if (in_buffer == "ZONE2_0") {
      zoneStates[2] = water(WATER_PUMP_ZONE_2, zoneStates[2], LOW);
    } else if (in_buffer == "ZONE2_1") {
      zoneStates[2] = water(WATER_PUMP_ZONE_2, zoneStates[2], HIGH);
    }

     else if (in_buffer == "ZONE3_0") {
      zoneStates[3] = water(WATER_PUMP_ZONE_3, zoneStates[3], LOW);
    } else if (in_buffer == "ZONE3_1") {
      zoneStates[3] = water(WATER_PUMP_ZONE_3, zoneStates[3], HIGH);
    } else if (IS_DEBUG_LEVEL > 1) {
      if (in_buffer == "z1") {
	zoneStates[1] = water(WATER_PUMP_ZONE_1, zoneStates[1], zoneStates[1] == LOW ? HIGH : LOW);
      } else if (in_buffer == "z2") {
	zoneStates[2] = water(WATER_PUMP_ZONE_2, zoneStates[2], zoneStates[2] == LOW ? HIGH : LOW);

      } else if (in_buffer == "z3") {
	zoneStates[3] = water(WATER_PUMP_ZONE_3, zoneStates[3], zoneStates[3] == LOW ? HIGH : LOW);
      
      } else if (in_buffer == "z0") {
	zoneStates[0] = water(WATER_PUMP_ZONE_0, zoneStates[0], zoneStates[0] == LOW ? HIGH : LOW);
      }

    }



    if(out_buffer != "" && IS_DEBUG_LEVEL > 1) {
      writeSerialPort();
      delay(10);
      readZones();
    }
  }

  writeSerialPort();

  delay(500);

}

/**
 * Reads the moisture sensor levels, This function will take 5 readings per sensor and take the average.
 * 860-870 - Air
 * 700-710 - Freshly Watered Plant
 * 500-570 - In Water
 */
void readMoistureSensors() {
  int SAMPLES_PER_SENSOR = 5;
  int readings[NUM_ZONES] = {0, 0, 0, 0};
  for(int sensor = 0; sensor < NUM_ZONES; sensor++) {
    readings[sensor] = readSingleMoistureSensor(sensor, MOISTURE_SENSORS[sensor], SAMPLES_PER_SENSOR);
  }
  char resp[100];

  snprintf(resp, sizeof(resp), SENSE_CMD_OUT, readings[0], readings[1], readings[2], readings[3]);
  out_buffer += resp;
}

int readSingleMoistureSensor(int sensor_num, int pin, int num_samples) {
  int reading = 0;
  int samples[num_samples];

  for (int i = 0; i < num_samples; i++) {
    samples[i] = analogRead(pin);
    if (IS_DEBUG_LEVEL > 1) {
      char resp[100];
      snprintf(resp, sizeof(resp), "Reading sensor %d(%d): %04d", sensor_num, pin, samples[i]);
      Serial.println(resp);
    }
    delay(10);
  }

  int avg;
  for (int j = 0; j < num_samples; j++) {
    avg += samples[j];
  }
  avg /= num_samples;

  return avg;
}

/**
 * Reads the zone state and the current pin state.
 */
void readZones() {
  int currentPinVal[NUM_ZONES];
  for (int i = 0; i < NUM_ZONES; i++) {
    currentPinVal[i] = digitalRead(ZONE_PINS[i]);
  }

  char resp[100];
  snprintf(
    resp, 
    sizeof(resp),
    STATUS_CMD_OUT,
    ZONE_PINS[0], zoneStates[0], currentPinVal[0],
    ZONE_PINS[1], zoneStates[1], currentPinVal[1],
    ZONE_PINS[2], zoneStates[2], currentPinVal[2],
    ZONE_PINS[3], zoneStates[3], currentPinVal[3]);
  out_buffer += resp;
}

/**
 * Returns the value to store in the pint state.
 */
int water(int pin, int currentPinState, int newPinState) {
  int current_val = digitalRead(pin);
  if (current_val == newPinState || currentPinState == newPinState) {
    out_buffer = "304";
    if (IS_DEBUG_LEVEL) {
      writeSerialPort();
      delay(10);
      readZones();
    }
    return currentPinState;
  } else {
    digitalWrite(pin, newPinState);
    out_buffer = "200";
    if (IS_DEBUG_LEVEL) {
      writeSerialPort();
      delay(10);
      readZones();
    }
    return newPinState;
  }
}


void readSerialPort() {
  in_buffer = "";
  if (Serial.available()) {
    delay(10);
    while (Serial.available() > 0) {
      in_buffer += (char)Serial.read();
    }
    Serial.flush();
  }
}

void readSerialPortUntil() {
  in_buffer = "";
  in_buffer = Serial.readStringUntil('|');
  if (in_buffer != "" && IS_DEBUG_LEVEL) {
    Serial.println("RECV: "+ in_buffer);
  }
}

void writeSerialPort() {
  if (out_buffer != "") {
    Serial.println(out_buffer);
    out_buffer = "";
  }
}

