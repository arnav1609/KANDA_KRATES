# 📱 Kanda Krates — Mobile App Documentation

> **Built with:** React Native (Expo) — runs on Android, iOS, and Web from a single codebase.

---

## 🔐 1. Authentication & Session Management

The app uses a custom `AuthContext` backed by **Expo SecureStore** for native platforms and `sessionStorage` as a graceful web fallback. On launch, it silently restores any existing session token so users remain logged in across app restarts.

**Three login methods are supported:**
- **Farmer credentials** — username + phone number + password
- **Admin credentials** — same flow, elevated role
- **Google OAuth (SSO)** — via `expo-auth-session`

Session tokens are stored securely on-device and automatically attached as `Authorization` headers on every API call via a shared `secureRequest()` utility.

---

## 🗺️ 2. Role-Based Navigation (RBAC)

Every layout enforces role-based routing at the framework level:

| Role | Destination |
|---|---|
| **Farmer** | Sensor Dashboard with bottom tab bar |
| **Admin** | Admin Dashboard with crate & farmer management |
| **Unauthenticated** | Immediately redirected to `/login` |

All routing uses Expo Router with statically typed dynamic paths (e.g., `/admin/crate/[id]`). Role guards are applied at the `_layout.tsx` level for every route group.

---

## 📊 3. Farmer Sensor Dashboard

The core farmer screen polls live sensor data **every 2 seconds** and displays:

### OHI Gauge — Onion Health Index
A 0–100 score computed in real-time by the 7-model ML ensemble, colour-coded from Green (healthy) to Red (critical).

### 6 Live Sensor Cards

| Sensor | Metric |
|---|---|
| 🌡️ Temperature | °C |
| 💧 Humidity | % |
| 🟤 CO₂ | ppm |
| 🟡 NH₃ | ppm |
| 🟠 VOC | ppm |
| 📦 Stock | kg |

Each card is automatically colour-coded into tiers — **Normal / Alert / Action / Emergency** — based on real-time gas thresholds. Tapping a non-Normal card opens a localized action prompt.

### 🛡️ Tamper Detection Banner
If the backend returns data with a mismatched cryptographic hash, the app immediately surfaces a `⚠️ Data Integrity Issue` warning with the specific problem listed. Incoming sensor data is then **frozen** in memory (`Object.freeze`) to prevent runtime tampering.

---

## 📈 4. 24-Hour History Charts + AI Health Summary

Pulled from MongoDB `SensorHistory` snapshots (saved every 15 minutes), the dashboard renders a **Bezier line chart** of the last 24 hours of Temperature and Humidity trends.

Below the chart, an **AI-generated health summary** powered by **Groq Llama-3.1-8b** explains the trend in plain language — and crucially, automatically translates this analysis into the farmer's selected regional language.

---

## 💰 5. AI Sell Advisory Engine

Cross-references the ML shelf-life prediction with live APMC market prices to give each storage batch a clear, colour-coded business instruction:

| Alert | Trigger Condition |
|---|---|
| 🚨 **Sell Immediately** | OHI critically low (< 40) or ≤ 3 days remaining |
| 🔴 **Sell Now** | OHI declining (< 60) or ≤ 7 days + decent price |
| ⚠️ **Monitor Closely** | OHI moderate (60–75), watch market |
| ⚠️ **Hold Short Term** | Good OHI but market price is currently low |
| 🟢 **Hold** | Strong OHI (> 75) with plenty of time, wait for better price |

Each advisory card shows the OHI, days remaining, and current ₹/kg market rate.

---

## 🤖 6. AI Chatbot

A dedicated **AI Chat** tab powered by the Groq API, allowing farmers to ask free-form questions about their stored produce in their own language (e.g., "Is my onion ready to sell?") and receive contextual, AI-grounded guidance.

---

## 🏆 7. Leaderboard

A gamified community **Leaderboard** that ranks farmers by storage performance — incentivizing optimal storage practices and healthy OHI scores.

---

## 🌐 8. Multilingual Support — 11 Languages

A global `LanguageContext` (with a language picker on the login screen) supports:

| | | |
|---|---|---|
| English | Hindi | Marathi |
| Tamil | Telugu | Kannada |
| Malayalam | Gujarati | Punjabi |
| Bengali | Odia | |

Every screen, tier label, alert, and AI response respects the selected language.

---

## 🛡️ 9. Admin Dashboard

Available exclusively to admin-role users:
- 📋 View all registered farmers and their phone numbers
- 📦 Register new storage crates (bind Crate ID + Hardware MAC Address + assigned farmer)
- Live list of active crates with assignment info
- One-tap navigation to per-crate detail views

---

## 🔒 10. Security Summary

| Feature | Implementation |
|---|---|
| Authenticated API calls | `secureRequest()` wraps all fetches with token headers |
| Sensor data integrity check | `verifySensorData()` verifies hash on every data pull |
| In-memory data protection | `freezeSensorData()` freezes data via `Object.freeze` |
| Role-based route guards | Enforced at `_layout.tsx` level for every route group |
| Secure credential storage | `expo-secure-store` on native, `sessionStorage` on web |
| RBAC enforcement | Farmer and Admin spaces are completely isolated |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK) |
| Routing | Expo Router (file-based, typed) |
| State | React Context API (`AuthContext`, `LanguageContext`) |
| Storage | Expo SecureStore |
| Charts | `react-native-chart-kit` |
| Icons | `@expo/vector-icons` (Ionicons) |
| Auth (SSO) | `expo-auth-session` (Google OAuth) |
| AI Chat & Summaries | Groq API (Llama-3.1-8b-instant) |
