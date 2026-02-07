#define RELAY1 7
#define RELAY2 8

void setup() {
  Serial.begin(9600);

  pinMode(RELAY1, OUTPUT);
  pinMode(RELAY2, OUTPUT);

  // Start with relays OFF
  digitalWrite(RELAY1, HIGH);
  digitalWrite(RELAY2, HIGH);

  Serial.println("Relay control started");
}

void loop() {

  // -------- RELAYS ON --------
  digitalWrite(RELAY1, LOW);
  digitalWrite(RELAY2, LOW);

  Serial.println("Relay 1: ON");
  Serial.println("Relay 2: ON");

  delay(5000);

  // -------- RELAYS OFF --------
  digitalWrite(RELAY1, HIGH);
  digitalWrite(RELAY2, HIGH);

  Serial.println("Relay 1: OFF");
  Serial.println("Relay 2: OFF");

  delay(5000);
}
