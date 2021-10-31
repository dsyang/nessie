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
int IS_DEBUG_LEVEL = 0;

int NUM_ZONES = 4;
int MOISTURE_SENSOR_ZONE_0 = A0;
int MOISTURE_SENSOR_ZONE_1 = A2;
int MOISTURE_SENSOR_ZONE_2 = A4;
int MOISTURE_SENSOR_ZONE_3 = A5;

int FRESHLY_WATERED_PLANT_READING = 800;
int AIR_READING = 850;
int MOISTURE_SENSORS[] = {MOISTURE_SENSOR_ZONE_0, MOISTURE_SENSOR_ZONE_1, MOISTURE_SENSOR_ZONE_2, MOISTURE_SENSOR_ZONE_3};
char SENSE_CMD_OUT[] = "%04d %04d %04d %04d";

int SOLENOID_VALVE_PIN = 7;
int SOLENOID_VALVE_ZONE_IDX = 0;
int SOLENOID_VALVE_SENSOR_IDX = 0;

int WATER_PUMP_ZONE_0 = 7;
int WATER_PUMP_ZONE_1 = 6;
int WATER_PUMP_ZONE_2 = 4;
int WATER_PUMP_ZONE_3 = 5;

int ZONE_PINS[] = {WATER_PUMP_ZONE_0, WATER_PUMP_ZONE_1, WATER_PUMP_ZONE_2, WATER_PUMP_ZONE_3};
int ZONE_MOISTURE_INDEX[] = {0, 3, 1, 2};
char STATUS_CMD_OUT[] = "Z0(%d)=%d:%d Z1(%d)=%d:%d Z2(%d)=%d:%d Z3(%d)=%d:%d";

char RESPONSE_JSON_OUT_PREFIX[] = "{\"data\":";
char RESPONSE_JSON_OUT_POSTFIX[] = "}";
char CONIFG_JSON_OUT[] = "{ \
\"debug_level\":%d, \
\"num_relay_pins\": %d, \
\"solenoid_pin\": %d, \
\"num_sensors\": %d, \
\"sensor_wet\": %d, \
\"sensor_dry\": %d \
}";

char STATUS_JSON_OUT[] = "[ \
[ %d, %d, %d, %d], \
[ %d, %d, %d, %d], \
[ %d, %d, %d, %d], \
[ %d, %d, %d, %d] \
]";

char SENSE_JSON_OUT[] = "{ \
\"readings\":[ %d, %d, %d, %d] \
}";

char ZONE_WATER_SUCCESS[] = "200";
char ZONE_WATER_NO_CHANGE[] = "304";
char ZONE_WATER_EMERGENCY[] = "205";

// High means LED is off
int zoneStates[] = {HIGH, HIGH, HIGH, HIGH};

String in_buffer;
String out_buffer;

void setup()
{
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
  while (!Serial)
  {
    // Wait for serial connection to be established.
  }
  if (IS_DEBUG_LEVEL)
  {
    Serial.setTimeout(5000);
  }
}

void loop()
{
  if (shouldAutoShutoffZone(SOLENOID_VALVE_SENSOR_IDX, FRESHLY_WATERED_PLANT_READING))
  {
    zoneStates[SOLENOID_VALVE_ZONE_IDX] = emergencyWater(SOLENOID_VALVE_PIN, zoneStates[SOLENOID_VALVE_ZONE_IDX]);
  }
  else
  {

    readSerialPortUntil();

    if (in_buffer != "")
    {
      if (in_buffer == "DBG0")
      {
        IS_DEBUG_LEVEL = 0;
        writeConfig();
      }
      else if (in_buffer == "DBG1")
      {
        IS_DEBUG_LEVEL = 1;
        writeConfig();
      }
      else if (in_buffer == "DBG2")
      {
        IS_DEBUG_LEVEL = 2;
        writeConfig();
      }
      else if (in_buffer == "CONFIG")
      {
        writeConfig();
      }

      if (in_buffer == "STOP")
      {
        stopAllWatering();
      }
      else if (in_buffer == "SENSE")
      {
        readMoistureSensors();
      }
      else if (in_buffer == "STATUS")
      {
        readZones();
      }
      else if (in_buffer == "ZONE0_0")
      {
        zoneStates[0] = water(WATER_PUMP_ZONE_0, zoneStates[0], LOW);
      }
      else if (in_buffer == "ZONE0_1")
      {
        zoneStates[0] = water(WATER_PUMP_ZONE_0, zoneStates[0], HIGH);
      }

      else if (in_buffer == "ZONE1_0")
      {
        zoneStates[1] = water(WATER_PUMP_ZONE_1, zoneStates[1], LOW);
      }
      else if (in_buffer == "ZONE1_1")
      {
        zoneStates[1] = water(WATER_PUMP_ZONE_1, zoneStates[1], HIGH);
      }

      else if (in_buffer == "ZONE2_0")
      {
        zoneStates[2] = water(WATER_PUMP_ZONE_2, zoneStates[2], LOW);
      }
      else if (in_buffer == "ZONE2_1")
      {
        zoneStates[2] = water(WATER_PUMP_ZONE_2, zoneStates[2], HIGH);
      }

      else if (in_buffer == "ZONE3_0")
      {
        zoneStates[3] = water(WATER_PUMP_ZONE_3, zoneStates[3], LOW);
      }
      else if (in_buffer == "ZONE3_1")
      {
        zoneStates[3] = water(WATER_PUMP_ZONE_3, zoneStates[3], HIGH);
      }
      else if (IS_DEBUG_LEVEL > 1)
      {
        if (in_buffer == "z1")
        {
          zoneStates[1] = water(WATER_PUMP_ZONE_1, zoneStates[1], zoneStates[1] == LOW ? HIGH : LOW);
        }
        else if (in_buffer == "z2")
        {
          zoneStates[2] = water(WATER_PUMP_ZONE_2, zoneStates[2], zoneStates[2] == LOW ? HIGH : LOW);
        }
        else if (in_buffer == "z3")
        {
          zoneStates[3] = water(WATER_PUMP_ZONE_3, zoneStates[3], zoneStates[3] == LOW ? HIGH : LOW);
        }
        else if (in_buffer == "z0")
        {
          zoneStates[0] = water(WATER_PUMP_ZONE_0, zoneStates[0], zoneStates[0] == LOW ? HIGH : LOW);
        }
      }

      if (out_buffer != "" && IS_DEBUG_LEVEL > 1)
      {
        writeSerialPort();
        delay(10);
        readZones();
      }
    }
  }

  writeSerialPort();

  delay(500);
}

void writeConfig()
{
  char resp[200];
  snprintf(
      resp,
      sizeof(resp),
      CONIFG_JSON_OUT,
      IS_DEBUG_LEVEL,
      NUM_ZONES,
      SOLENOID_VALVE_PIN,
      NUM_ZONES,
      FRESHLY_WATERED_PLANT_READING,
      AIR_READING);
  out_buffer += RESPONSE_JSON_OUT_PREFIX;
  out_buffer += resp;
  out_buffer += RESPONSE_JSON_OUT_POSTFIX;
}

/**
 * Reads the moisture sensor levels, This function will take 5 readings per sensor and take the average.
 * 860-870 - Air
 * 700-710 - Freshly Watered Plant
 * 500-570 - In Water
 */
void readMoistureSensors()
{
  int SAMPLES_PER_SENSOR = 5;
  int readings[NUM_ZONES] = {0, 0, 0, 0};
  for (int sensor = 0; sensor < NUM_ZONES; sensor++)
  {
    readings[sensor] = readSingleMoistureSensor(sensor, MOISTURE_SENSORS[sensor], SAMPLES_PER_SENSOR);
  }
  char resp[100];

  snprintf(resp, sizeof(resp), SENSE_JSON_OUT, readings[0], readings[1], readings[2], readings[3]);

  out_buffer += RESPONSE_JSON_OUT_PREFIX;
  out_buffer += resp;
  out_buffer += RESPONSE_JSON_OUT_POSTFIX;
}

int readSingleMoistureSensor(int sensor_num, int pin, int num_samples)
{
  int reading = 0;
  int samples[num_samples];

  for (int i = 0; i < num_samples; i++)
  {
    samples[i] = analogRead(pin);
    if (IS_DEBUG_LEVEL > 1)
    {
      char resp[100];
      snprintf(resp, sizeof(resp), "Reading sensor %d(%d): %04d", sensor_num, pin, samples[i]);
      Serial.println(resp);
    }
    delay(10);
  }

  int avg;
  for (int j = 0; j < num_samples; j++)
  {
    avg += samples[j];
  }
  avg /= num_samples;

  return avg;
}

bool shouldAutoShutoffZone(int sensorIndex, int currentPinState) {
  int sensorPin = MOISTURE_SENSORS[sensorIndex];
  int reading = readSingleMoistureSensor(sensorIndex, sensorPin, 5);
  return reading < FRESHLY_WATERED_PLANT_READING && currentPinState == LOW;
}

/**
 * Reads the zone state and the current pin state.
 */
void readZones()
{
  int currentPinVal[NUM_ZONES];
  for (int i = 0; i < NUM_ZONES; i++)
  {
    currentPinVal[i] = digitalRead(ZONE_PINS[i]);
  }

  char resp[200];
  snprintf(
      resp,
      sizeof(resp),
      STATUS_JSON_OUT,
      ZONE_PINS[0], zoneStates[0], currentPinVal[0], ZONE_MOISTURE_INDEX[0],
      ZONE_PINS[1], zoneStates[1], currentPinVal[1], ZONE_MOISTURE_INDEX[1],
      ZONE_PINS[2], zoneStates[2], currentPinVal[2], ZONE_MOISTURE_INDEX[2],
      ZONE_PINS[3], zoneStates[3], currentPinVal[3], ZONE_MOISTURE_INDEX[3]);

  out_buffer += RESPONSE_JSON_OUT_PREFIX;
  out_buffer += resp;
  out_buffer += RESPONSE_JSON_OUT_POSTFIX;
}

/**
 * Returns the value to store in the pin state.
 */
int internalWater(int pin, int currentPinState, int newPinState, bool isEmergencyShutoff)
{
  int current_val = digitalRead(pin);
  if (current_val == newPinState || currentPinState == newPinState)
  {
    out_buffer += RESPONSE_JSON_OUT_PREFIX;
    out_buffer += ZONE_WATER_NO_CHANGE;
    out_buffer += RESPONSE_JSON_OUT_POSTFIX;
    return currentPinState;
  }
  else
  {
    digitalWrite(pin, newPinState);
    out_buffer += RESPONSE_JSON_OUT_PREFIX;
    out_buffer += (isEmergencyShutoff ? ZONE_WATER_EMERGENCY : ZONE_WATER_SUCCESS);
    out_buffer += RESPONSE_JSON_OUT_POSTFIX;
    return newPinState;
  }
}

/**
 * Normal watering
 */
int water(int pin, int currentPinState, int newPinState) {
  return internalWater(pin, currentPinState, newPinState, false);
}

/**
 * Emergency shutoff watering
 */
int emergencyWater(int pin, int currentPinState) {
  return internalWater(pin, currentPinState, HIGH, true);
}

/**
 * Stops all watering
 */
void stopAllWatering()
{
  for (int i = 0; i < NUM_ZONES; i++)
  {
    digitalWrite(ZONE_PINS[i], HIGH);
    zoneStates[i] = HIGH;
  }
  readZones();
}

void readSerialPortUntil()
{
  in_buffer = "";
  in_buffer = Serial.readStringUntil('|');
  if (in_buffer != "" && IS_DEBUG_LEVEL)
  {
    Serial.println("RECV: " + in_buffer);
  }
}

void writeSerialPort()
{
  if (out_buffer != "")
  {
    Serial.println(out_buffer);
    out_buffer = "";
  }
}
