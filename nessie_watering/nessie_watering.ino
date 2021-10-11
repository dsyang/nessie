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

int NUM_ZONES = 4;
int MOISTURE_SENSOR_ZONE_0 = A0;
int MOISTURE_SENSOR_ZONE_1 = A1;
int MOISTURE_SENSOR_ZONE_2 = A2;
int MOISTURE_SENSOR_ZONE_3 = A3;

int MOISTURE_SENSORS[] = {MOISTURE_SENSOR_ZONE_0, MOISTURE_SENSOR_ZONE_1, MOISTURE_SENSOR_ZONE_2, MOISTURE_SENSOR_ZONE_3};
char SENSE_CMD_OUT[] = "%04d %04d %04d %04d";


int WATER_PUMP_ZONE_0 = 2;
int WATER_PUMP_ZONE_1 = 3;
int WATER_PUMP_ZONE_2 = 4;
int WATER_PUMP_ZONE_3 = 5;

int zone0State = LOW;
int zone1State = LOW;
int zone2State = LOW;
int zone3State = LOW;

String in_buffer;
String out_buffer;

void setup() {
  pinMode(WATER_PUMP_ZONE_0, OUTPUT);
  digitalWrite(WATER_PUMP_ZONE_0, zone0State);
  
  pinMode(WATER_PUMP_ZONE_1, OUTPUT);
  digitalWrite(WATER_PUMP_ZONE_1, zone1State);
  
  pinMode(WATER_PUMP_ZONE_2, OUTPUT);
  digitalWrite(WATER_PUMP_ZONE_2, zone2State);
  
  pinMode(WATER_PUMP_ZONE_3, OUTPUT);
  digitalWrite(WATER_PUMP_ZONE_3, zone3State);
  
  Serial.begin(9600);
  while (!Serial) {
    // Wait for serial connection to be established. 
  }
}

void loop() {
  readSerialPort();
  
  if (in_buffer != "") {
    if (in_buffer == "SENSE") {
      readMoistureSensors();

    } else if (in_buffer == "ZONE0_0") {
      water(WATER_PUMP_ZONE_0, zone0State, LOW);
    } else if (in_buffer == "ZONE0_1") {
      water(WATER_PUMP_ZONE_0, zone0State , HIGH);
    
    } else if (in_buffer == "ZONE1_0") {
      water(WATER_PUMP_ZONE_1, zone1State, LOW);
    } else if (in_buffer == "ZONE1_1") {
      water(WATER_PUMP_ZONE_1, zone1State, HIGH);

    } else if (in_buffer == "ZONE2_0") {
      water(WATER_PUMP_ZONE_2, zone2State, LOW);
    } else if (in_buffer == "ZONE2_1") {
      water(WATER_PUMP_ZONE_2, zone2State, HIGH);

    } else if (in_buffer == "ZONE3_0") {
      water(WATER_PUMP_ZONE_3, zone3State, LOW);
    } else if (in_buffer == "ZONE3_1") {
      water(WATER_PUMP_ZONE_3, zone3State, HIGH);

    }
  }
  
  writeSerialPort();
  
  delay(500);
  
}

/**
 * Reads the moisture sensor levels, This function will take 5 readings per sensor and take the average.  
 */
void readMoistureSensors() {
  int SAMPLES_PER_SENSOR = 5;
  int readings[NUM_ZONES] = {0, 0, 0, 0};
  for(int sensor = 0; sensor < NUM_ZONES; sensor++) {
    readings[sensor] = readSingleMoistureSensor(MOISTURE_SENSORS[sensor], SAMPLES_PER_SENSOR);
  }
  char resp[100];
  
  snprintf(resp, sizeof(resp), SENSE_CMD_OUT, readings[0], readings[1], readings[2], readings[3]);
  out_buffer += resp;
}

int readSingleMoistureSensor(int pin, int num_samples) {
  int reading = 0;
  int samples[num_samples];
  
  for (int i = 0; i < num_samples; i++) {
    samples[i] = analogRead(pin);
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
 * Returns the value to store in the pint state. 
 */
int water(int pin, int currentPinState, int newPinState) {
  int current_val = digitalRead(pin);
  if (current_val == currentPinState) {
    out_buffer = "304";
    return currentPinState;
  } else {
    digitalWrite(pin, newPinState);
    
    out_buffer = "200";
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

void writeSerialPort() {
  if (out_buffer != "") {
    Serial.println(out_buffer);
    out_buffer = "";
  }
}
