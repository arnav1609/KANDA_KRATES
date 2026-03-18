import { secureRequest, API_ENDPOINTS } from "../config/api";
import { verifySensorData, freezeSensorData } from "../utils/dataIntegrity";

/**
 * Fetch sensor data for a specific crate and batch.
 * Uses secure authenticated requests and verifies data integrity.
 */
export async function getBatchSensors(crate: string, batch: string) {
  const res = await secureRequest(API_ENDPOINTS.sensors(crate, batch));

  if (!res.ok) {
    throw new Error(`Sensor API failed with status ${res.status}`);
  }

  const data = await res.json();

  // Verify data integrity
  const integrity = verifySensorData(data, data.dataHash);
  if (!integrity.valid) {
    console.warn("[SensorService] Data integrity issues:", integrity.issues);
  }

  // Return frozen (immutable) data to prevent tampering
  return {
    data: freezeSensorData(data),
    integrity,
  };
}