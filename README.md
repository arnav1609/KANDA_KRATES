🧅 Kanda Krates
🤖 AI-Powered Modular Onion Storage & Spoilage Prevention System
📌 Overview

Kanda Krates is a smart, modular, and AI-driven onion storage solution designed to reduce post-harvest losses, improve farmer decision-making, and enable sustainable onion storage at scale. The system integrates IoT sensors, edge artificial intelligence, ethylene control mechanisms, and agentic AI decision support to detect spoilage at an early stage—often before it becomes visible—and to recommend timely corrective actions such as ventilation adjustment or urgent sale. By shifting onion storage from a reactive to a predictive approach, Kanda Krates addresses a critical gap in post-harvest agricultural infrastructure.

🚨 Problem Statement

India loses approximately 20–30% of its onion produce after harvest due to poor ventilation, uncontrolled humidity, ethylene-induced sprouting, undetected microbial spoilage, and delays caused by manual inspection methods. Farmers typically lack access to real-time, actionable insights that could help prevent losses before they escalate. Traditional godown-based storage systems respond only after visible damage has occurred, making them inefficient and economically unsustainable. Kanda Krates directly addresses this challenge by enabling proactive, data-driven storage management.

💡 Solution Overview

Kanda Krates introduces 5-ton modular storage units, referred to as krates, each equipped with a suite of sensors and AI models. These units continuously monitor storage conditions, predict spoilage risks using machine learning, regulate ventilation and ethylene scrubbing mechanisms, and generate simple, actionable recommendations for farmers. The system is designed to operate reliably even in low-connectivity environments through local edge inference, making it suitable for rural and semi-urban deployment.

🧠 Onion Health Index (OHI)

At the core of Kanda Krates is the Onion Health Index (OHI), a single, intuitive score ranging from 0 to 100 that represents overall storage health. Based on this score, storage conditions are categorized into four levels: Normal, Alert, Action Required, and Emergency. This abstraction allows farmers to quickly understand storage conditions without interpreting complex sensor data.

🌡️ Multi-Sensor Monitoring

Each krate is equipped with multi-sensor monitoring capabilities, including temperature, humidity, carbon dioxide (CO₂) concentration, and hydrogen sulfide (H₂S) levels, with optional weight monitoring to track batch degradation over time. H₂S serves as a critical early indicator of microbial spoilage, enabling intervention before visible rot occurs.

🤖 AI-Powered Spoilage Intelligence

The intelligence layer of Kanda Krates consists of multiple machine learning models working together. LSTM-based time-series models analyze trends in gas concentration and micro-climatic data to detect early spoilage patterns. Random Forest classifiers categorize each krate into low, medium, or high risk, allowing prioritization of interventions. Shelf-life estimation models predict the remaining safe storage duration to support sell-or-hold decisions, while anomaly detection using Isolation Forest and statistical thresholds identifies sudden gas spikes or micro-climate deviations indicating localized spoilage.

🌬️ Adaptive Ventilation Control

To actively maintain optimal storage conditions, Kanda Krates employs AI-assisted adaptive ventilation control. Airflow is dynamically adjusted to prevent gas buildup while minimizing dehydration and unnecessary energy consumption. This ensures efficient preservation of onion quality throughout the storage period.

🧪 Ethylene Scrubbing System

Kanda Krates integrates a KMnO₄-based ethylene scrubbing system that absorbs ethylene gas released during storage. By reducing ethylene concentration, the system slows sprouting and aging without introducing chemicals directly onto the produce, thereby extending shelf life in a safe and controlled manner.

🧑‍🌾 Agentic AI – Farmer Decision Support

A key differentiator of Kanda Krates is its agentic AI decision-support layer, which translates complex sensor readings and AI outputs into simple, actionable recommendations. Instead of presenting raw data, the system provides clear guidance such as “Safe to store,” “Increase ventilation,” “Inspect within 24 hours,” or “Sell immediately to avoid loss.” Multilingual alert support ensures accessibility across diverse farming communities.

🌱 Sustainable & Scalable Design

Kanda Krates uses modular HDPE frames that are durable, moisture-resistant, recyclable, and stackable. This design supports scalable deployment ranging from individual farmers to cooperative societies and government-operated storage facilities. Edge-based intelligence reduces cloud dependency, lowers operating costs, and improves system reliability.

📱 Mobile Application

The companion mobile application provides real-time visualization of the Onion Health Index, color-coded risk tiers, sensor dashboards, multilingual alerts, and one-tap acknowledgements. The interface is intentionally farmer-friendly, avoiding technical jargon and focusing on clear, decision-oriented insights.

🎯 Use Cases

Kanda Krates is suitable for farmer-owned onion storage units, cooperative societies, cold-storage alternatives for dry onions, government post-harvest infrastructure, and agri-logistics and mandi supply chains. The modular architecture allows flexible deployment across varying scales and regions.

🌍 Impact

By enabling early spoilage detection and proactive intervention, Kanda Krates reduces post-harvest losses, improves farmer income, minimizes food waste, and promotes sustainable agricultural practices. The system empowers farmers with data-driven storage decisions that directly translate into economic and environmental benefits.

🚀 Future Scope

Planned enhancements include market price forecasting and sell-timing intelligence, integration with mandi pricing APIs, solar-powered krates, expansion to crops such as potatoes and garlic, and large-scale government deployment dashboards.

🧪 Project Status

The project is prototype-ready, with sensor data simulation supported, AI logic demonstrated using sample datasets, and a functional mobile application available for demonstration in hackathons and pilot deployments.

📌 Tagline

Store Smart. Sell Right. Save Every Onion.
