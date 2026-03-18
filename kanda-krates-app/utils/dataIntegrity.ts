/**
 * Sensor Data Integrity Utilities
 *
 * Protects sensor data from tampering by:
 * 1. Computing a hash of sensor values for verification
 * 2. Validating readings are within physically possible ranges
 * 3. Comparing hashes against server-provided checksums
 */

// ──── Physically Valid Sensor Ranges ────

const SENSOR_RANGES: Record<string, { min: number; max: number; label: string }> = {
  temperature: { min: -40, max: 100, label: "Temperature (°C)" },
  humidity:    { min: 0,   max: 100, label: "Humidity (%)" },
  mq135:       { min: 0,   max: 50000, label: "CO₂ (ppm)" },
  mq137:       { min: 0,   max: 500,   label: "NH₃ (ppm)" },
  mq136:       { min: 0,   max: 500,   label: "VOC (ppm)" },
};

// ──── Simple Hash Function ────

/**
 * Compute a simple numeric hash from sensor data.
 * Uses a deterministic algorithm so the same data always produces the same hash.
 *
 * NOTE: For production, use HMAC-SHA256 with a shared secret.
 * This is a lightweight client-side check.
 */
export function computeSensorHash(data: Record<string, any>): string {
  // Sort keys for deterministic order
  const keys = Object.keys(data).sort();
  const payload = keys
    .filter((k) => typeof data[k] === "number")
    .map((k) => `${k}:${data[k]}`)
    .join("|");

  // Simple hash (djb2 algorithm)
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 33) ^ payload.charCodeAt(i);
  }

  return (hash >>> 0).toString(16); // Unsigned 32-bit hex
}

// ──── Verify Data Integrity ────

export type IntegrityResult = {
  valid: boolean;
  issues: string[];
};

/**
 * Verify sensor data integrity:
 * 1. Check if values are within physically valid ranges
 * 2. If server provides a hash, compare it to our computed hash
 */
export function verifySensorData(
  data: Record<string, any>,
  serverHash?: string
): IntegrityResult {
  const issues: string[] = [];

  // ── Range validation ──
  for (const [key, range] of Object.entries(SENSOR_RANGES)) {
    const value = data[key];
    if (value !== undefined && typeof value === "number") {
      if (value < range.min || value > range.max) {
        issues.push(
          `⚠️ ${range.label} value ${value} is outside valid range [${range.min}, ${range.max}]`
        );
      }
    }
  }

  // ── Hash verification (if server provides one) ──
  if (serverHash) {
    const clientHash = computeSensorHash(data);
    if (clientHash !== serverHash) {
      issues.push(
        "🔒 Data integrity check failed: sensor data may have been tampered with"
      );
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Create an immutable (frozen) copy of sensor data.
 * Prevents accidental or malicious mutation of sensor readings.
 */
export function freezeSensorData<T extends Record<string, any>>(data: T): Readonly<T> {
  return Object.freeze({ ...data });
}
