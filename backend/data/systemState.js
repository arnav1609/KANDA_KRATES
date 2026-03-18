/* ================= MQTT SENSOR STORE ================= */

export let sensorStore = {};


/* ================= UPDATE SENSOR DATA ================= */

export function updateSensorState(crate, batch, data) {

  if (!sensorStore[crate]) {
    sensorStore[crate] = {};
  }

  sensorStore[crate][batch] = {
    temperature_c: data.temperature,
    humidity_percent: data.humidity,
    co2_ppm: data.mq135,
    h2s_ppm: data.mq137,
    voc_ppb: data.mq136,
    stock_weight_kg: data.stock || 2367
  };

}


/* ================= OHI CALCULATION ================= */

function calculateOHI(s) {

  let score = 100;

  score -= s.co2_ppm / 120;
  score -= s.h2s_ppm * 8;
  score -= s.voc_ppb * 0.5;
  score -= Math.abs(s.temperature_c - 25) * 1.5;
  score -= Math.abs(s.humidity_percent - 65) * 0.8;

  return Math.max(40, Math.min(100, Math.round(score)));

}


/* ================= RISK STATUS ================= */

function statusFromOHI(ohi) {

  if (ohi < 55) return "Emergency";
  if (ohi < 70) return "Action";
  if (ohi < 85) return "Alert";

  return "Normal";
}


/* ================= STORAGE ANALYSIS ================= */

function analyzeStorage(sensors, status) {

  const reasons = [];
  const actions = [];
  const improvements = [];

  if (sensors.temperature_c > 28) {
    reasons.push("High temperature accelerates onion respiration.");
    actions.push("Improve ventilation and reduce heat exposure.");
    improvements.push("Use shade nets or roof insulation.");
  }

  if (sensors.humidity_percent > 75) {
    reasons.push("High humidity promotes fungal onion rot.");
    actions.push("Increase airflow to reduce moisture.");
    improvements.push("Use ventilated storage crates.");
  }

  if (sensors.co2_ppm > 2500) {
    reasons.push("CO₂ buildup indicates poor ventilation.");
    actions.push("Increase ventilation immediately.");
    improvements.push("Maintain airflow gaps between stacks.");
  }
  else if (sensors.co2_ppm > 1200) {
    reasons.push("Moderate CO₂ buildup detected.");
    actions.push("Monitor ventilation levels.");
  }

  if (sensors.h2s_ppm > 1.5) {
    reasons.push("H₂S indicates microbial onion decomposition.");
    actions.push("Remove spoiled onions immediately.");
    improvements.push("Inspect batches regularly.");
  }

  if (sensors.voc_ppb > 15) {
    reasons.push("VOC rise signals biochemical spoilage.");
    actions.push("Inspect nearby stacks for decay.");
    improvements.push("Avoid overstacking onions.");
  }

  if (status === "Normal") {
    actions.push("Continue routine monitoring.");
    improvements.push("Maintain current airflow conditions.");
  }

  if (status === "Alert") {
    actions.push("Inspect batch for early spoilage.");
    improvements.push("Increase inspection frequency.");
  }

  if (status === "Action") {
    actions.push("Plan partial sale within 24 hours.");
    improvements.push("Improve ventilation in storage area.");
  }

  if (status === "Emergency") {
    actions.push("Sell immediately to avoid losses.");
    improvements.push("Review storage airflow design.");
  }

  return {
    reasons,
    actions,
    improvements
  };

}


/* ================= BUILD SYSTEM STATE ================= */

export function createDynamicSystemState() {

  const batches = {};

  Object.keys(sensorStore).forEach(crate => {

    Object.keys(sensorStore[crate]).forEach(batch => {

      const sensors = sensorStore[crate][batch];

      const ohi = calculateOHI(sensors);
      const status = statusFromOHI(ohi);

      const analysis = analyzeStorage(sensors, status);

      batches[batch] = {
        crate_id: crate,
        batch_id: batch,
        sensors,
        ohi,
        risk_level: status,
        storage_analysis: analysis
      };

    });

  });

  return batches;

}


/* ================= EXTRACT BATCH FROM QUESTION ================= */

export function extractBatch(question) {

  const match = question.match(/B\d+/i);

  return match ? match[0].toUpperCase() : null;

}


/* ================= BUILD CHATBOT CONTEXT ================= */

export function buildContext(question) {

  const batch = extractBatch(question);

  const systemState = createDynamicSystemState();

  if (!batch || !systemState[batch]) {
    return null;
  }

  const batchData = systemState[batch];

  return {
    crate_id: batchData.crate_id,
    batch_id: batchData.batch_id,
    sensors: batchData.sensors,
    ohi: batchData.ohi,
    risk_level: batchData.risk_level,
    storage_analysis: batchData.storage_analysis
  };

}