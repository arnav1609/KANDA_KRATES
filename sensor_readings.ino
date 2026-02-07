#include <DHT.h>

// ---------- DHT SETUP ----------
#define DHTTYPE DHT22

#define DHT1_PIN 25
#define DHT2_PIN 26
#define DHT3_PIN 27

DHT dht1(DHT1_PIN, DHTTYPE);
DHT dht2(DHT2_PIN, DHTTYPE);
DHT dht3(DHT3_PIN, DHTTYPE);

// ---------- MQ & FSR PINS ----------
#define MQ136_PIN 34
#define MQ135_PIN 35
#define MQ137_PIN 32
#define FSR_PIN   33

void setup() {
  Serial.begin(115200);
  delay(1000);

  dht1.begin();
  dht2.begin();
  dht3.begin();

  Serial.println("ESP32 Sensor System Started");
  Serial.println("-----------------------------------");
}

void loop() {

  // ---------- MQ SENSOR READINGS ----------
  int mq136Value = analogRead(MQ136_PIN);
  int mq135Value = analogRead(MQ135_PIN);
  int mq137Value = analogRead(MQ137_PIN);

  // ---------- FSR READING ----------
  int fsrValue = analogRead(FSR_PIN);

  // ---------- DHT READINGS ----------
  float t1 = dht1.readTemperature();
  float h1 = dht1.readHumidity();

  float t2 = dht2.readTemperature();
  float h2 = dht2.readHumidity();

  float t3 = dht3.readTemperature();
  float h3 = dht3.readHumidity();

  // ---------- PRINT VALUES ----------
  Serial.println("===== SENSOR READINGS =====");

  Serial.print("MQ136 (H2S) ADC: ");
  Serial.println(mq136Value);

  Serial.print("MQ135 (Air Quality) ADC: ");
  Serial.println(mq135Value);

  Serial.print("MQ137 (NH3) ADC: ");
  Serial.println(mq137Value);

  Serial.print("FSR Pressure ADC: ");
  Serial.println(fsrValue);

  Serial.println("--- DHT22 Sensors ---");

  Serial.print("DHT1 -> Temp: ");
  Serial.print(t1);
  Serial.print(" °C | Humidity: ");
  Serial.print(h1);
  Serial.println(" %");

  Serial.print("DHT2 -> Temp: ");
  Serial.print(t2);
  Serial.print(" °C | Humidity: ");
  Serial.print(h2);
  Serial.println(" %");

  Serial.print("DHT3 -> Temp: ");
  Serial.print(t3);
  Serial.print(" °C | Humidity: ");
  Serial.print(h3);
  Serial.println(" %");

  Serial.println("============================\n");

  delay(5000);  // 5-second delay
}

