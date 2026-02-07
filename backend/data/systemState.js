export const systemState = {
  sensors: {
    box_id: "B3",
    temperature_c: 25.4,
    humidity_percent: 70,
    co2_ppm: 395,
    h2s_ppm: 1.2,
    voc_ppb: 11.2,
    stock_weight_kg: 2367
  },

  ai_models: {
    spoilage_lstm: {
      probability: 0.32,
      trend: "increasing"
    },
    risk_random_forest: {
      class: "Medium",
      confidence: 0.81
    },
    shelf_life_model: {
      estimated_days: 42,
      confidence: 0.76
    },
    anomaly_isolation_forest: {
      detected: true,
      affected_zone: "north section"
    },
    ventilation_controller: {
      suggested_airflow_change_percent: 20
    }
  }
};
