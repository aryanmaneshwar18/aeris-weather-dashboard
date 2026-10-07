# AERIS — AI Weather Intelligence Platform

[![Version](https://img.shields.io/badge/version-2.5.0--pro-blue.svg)](file:///c:/Users/ARYAN%20MANESHWAR/Documents/Flux/index.html)
[![Tech](https://img.shields.io/badge/tech-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-cyan.svg)](file:///c:/Users/ARYAN%20MANESHWAR/Documents/Flux/script.js)
[![API](https://img.shields.io/badge/data-OpenWeather%20API-orange.svg)](https://openweathermap.org/)
[![Status](https://img.shields.io/badge/status-production--ready-emerald.svg)](file:///c:/Users/ARYAN%20MANESHWAR/Documents/Flux/index.html)

> **"An AI-powered weather command center, rather than a normal weather website."**

AERIS is a futuristic, cinematic, high-density meteorological intelligence platform engineered with pure Vanilla JavaScript, modern HTML5, and advanced CSS3. Built with zero heavy framework bloat (no React, Vue, Tailwind, or Bootstrap), AERIS delivers sub-second telemetry, real-time particle rendering, 5-day synoptic projections, orbital radar cartography, and an expressive reactive AI assistant.

---

## 1. Key Capabilities & Features

### ✦ Visual Aesthetics & Command Center
- **Cybernetic Glassmorphism & Atmospheric Depth**: Bespoke radial glowing backgrounds, micro-grid blueprints, and dynamic canvas particle simulations (rain drops, snow drifts, thunderstorm lightning flashes, floating quantum air embers).
- **Theme Matrix**: Instant live switching between **Midnight Cyan** (Default), **Deep Obsidian** (Ultra Dark), and **Cyberpunk Neon** palettes.
- **Expressive AI Weather Agent**: Interactive cybernetic robot avatar with blinking LED ocular lenses, pulsing core reactor, floating thruster animations, and weather-reactive emotional states (Sunny, Storm, Rain, Hypothermic Freeze).

### ✦ Real Meteorological Telemetry
- **OpenWeather REST Architecture**:
  - Current Weather (`/data/2.5/weather`): Live thermal reading, feels-like, diurnal high/low, humidity, barometer pressure, sight visibility, cloud cover, and solar timestamps.
  - 5-Day Synoptic Forecast (`/data/2.5/forecast`): 40-slice 3-hour resolution forecast grouped intelligently by calendar days with diurnal temperature variance and precipitation probability.
  - Air Pollution Telemetry (`/data/2.5/air_pollution`): Multi-spectrum European AQI (Good to Very Poor) with specific microgram sensors for $\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, and $\text{O}_3$.
  - Direct Geocoding (`/geo/1.0/direct`): Real-time debounced search autocomplete with country and regional state resolution.

### ✦ Specialized Atmospheric Instrumentation
- **Celestial Ephemeris & Solar Transit**: Geometric SVG arc tracking the sun's exact daily daylight trajectory, calculating sunrise, sunset, total daylight hours, and solar zenith.
- **Vector Wind Compass Rose**: Tactical 360° rotating magnetic needle, displaying bearing degrees, cardinal directions, Beaufort Wind Scale categories, and wind shear.
- **Rule-Engine Calculated Insights**: Synthetic outdoor activity score (0–100), comfort index, drone wind shear safety, and saturation probability derived mathematically from raw sensor values.
- **Chrono-Prediction 24h Slider**: Horizontal micro-cards displaying temperatures, sky icons, and precipitation probability.

### ✦ Multi-View Navigation System
1. **Command Center (Home)**: High-density hero telemetry dashboard.
2. **5-Day Forecast View**: Comprehensive synoptic view with an interactive **3-Hour Micro-Slice Day Inspector**.
3. **Orbital Radar Map View**: Fullscreen Leaflet.js cartography with switchable OpenWeather tile overlays (Thermal, Precipitation radar, Clouds, Wind vectors, and Isobars).
4. **Saved Stations Repository**: Fast bookmarking of favorite cities persisted in `localStorage`.
5. **System Settings & Telemetry**: Toggle temperature units (°C / °F), atmospheric animations, auto-refresh polling frequencies, and API keys.

---

## 2. Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **HTML5** | Semantic structure, accessible landmarks, SVG vectors |
| **CSS3** | Vanilla Design System, CSS Variables, Glassmorphism, Keyframe animations, Responsive media queries |
| **Vanilla JavaScript (ES6+)** | State management, asynchronous `fetch`/`async-await`, DOM manipulation, Canvas particle physics |
| **Leaflet.js (1.9.4)** | Interactive geospatial weather radar rendering |
| **OpenWeather REST API** | Authoritative meteorological telemetry source |
| **HTML5 Canvas** | High-performance particle engine for rain, snow, lightning, and dust |
| **LocalStorage API** | Offline persistence for saved stations, recent probes, and system settings |

---

## 3. Getting Started & Setup

### Prerequisites
A modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari).

### Quick Launch
1. Clone or download the repository into your local folder.
2. Open [`index.html`](file:///c:/Users/ARYAN%20MANESHWAR/Documents/Flux/index.html) directly in any browser, or serve it via a local static HTTP server:
   ```powershell
   # Using Python 3:
   python -m http.server 8080

   # Or using Node.js npx:
   npx serve .
   ```
3. Visit `http://localhost:8080` in your browser.

---

## 4. API Key Configuration

The application includes a pre-configured OpenWeather API key inside [`script.js`](file:///c:/Users/ARYAN%20MANESHWAR/Documents/Flux/script.js):

```javascript
const CONFIG = {
    API_KEY: "YOUR_OPENWEATHER_API_KEY",
    ENDPOINTS: {
        WEATHER: "https://api.openweathermap.org/data/2.5/weather",
        FORECAST: "https://api.openweathermap.org/data/2.5/forecast",
        AIR_POLLUTION: "https://api.openweathermap.org/data/2.5/air_pollution",
        GEOCODING: "https://api.openweathermap.org/geo/1.0/direct"
    },
    DEFAULT_CITY: "Indore",
    RECENT_MAX: 6
};
```

### In-App Setting Override
You can also override the API key at runtime without touching source files:
1. Navigate to **Telemetry & Settings** in the sidebar.
2. Enter your custom key under **OpenWeather API Configuration**.
3. Click **Update Key**. AERIS will store your override in `localStorage` and trigger an immediate telemetry refresh.

> [!IMPORTANT]
> **Production Deployment Security Note:**
> In production enterprise deployments, browser clients should not hold raw API secrets. Requests should be proxied through a serverless Edge Function (e.g., Cloudflare Workers, AWS Lambda, or Vercel Edge) where the API key is injected server-side.

---

## 5. Architectural Flow & Data Pipeline

```
[ User Search / GPS / Auto-Refresh ]
                  │
                  ▼
       [ executeWeatherTelemetry ]
                  │
      ┌───────────┴───────────┐
      ▼                       ▼
Current Weather API      Forecast API (5-day / 3h)
(/data/2.5/weather)     (/data/2.5/forecast)
      │                       │
      ├───────────────────────┘
      ▼
Air Pollution API (/data/2.5/air_pollution)
      │
      ▼
[ Normalized Application State (STATE) ]
      │
      ├─► renderPrimaryWeather() (Temps, high/low, clock)
      ├─► renderAIAssistant() (Speech bubble, robot expressions)
      ├─► renderAtmosphericInsights() (Outdoor score 0-100, comfort, wind)
      ├─► renderAirQuality() (AQI 1-5, PM2.5, PM10, NO2, O3)
      ├─► renderSolarEphemeris() (Daylight length, solar zenith, SVG arc)
      ├─► renderWindCompass() (Compass needle rotation, Beaufort scale)
      ├─► renderHourlyChrono() (Next 24 hours slider)
      ├─► renderForecastDetailedView() (Day cards & 3h micro-slice inspector)
      ├─► syncWeatherMap() (Leaflet position & radar layer)
      └─► AtmosphericEngine.setCondition() (Canvas rain/snow/stars)
```

---

## 6. Error Resilience & Defensive Engineering

AERIS is engineered never to crash or present a blank screen:
- **HTTP 404 (City Not Found)**: Displays a polite actionable dialog prompting spelling verification.
- **HTTP 401 (Invalid Key)**: Warns the user of key activation delay (new OpenWeather keys take up to 20 minutes to propagate).
- **HTTP 429 (Rate Limit)**: Alerts the user of temporary rate limits without crashing.
- **Network Offline**: Detects broken connectivity and renders a clear connection status banner.
- **Air Pollution Graceful Degradation**: If AQI is not provisioned for a coordinate, other weather cards render normally while the AQI panel gracefully displays "N/A".
- **Geolocation Permission Denied**: Fallbacks immediately to manual search without disrupting existing telemetry.

---

## 7. File Structure

```
AERIS/
│
├── index.html       # Single-Page Application shell, 5 distinct views, SVG instrumentation
├── style.css        # Futuristic Design System, responsive grid, animations, glassmorphism
├── script.js        # Pure Vanilla JS engine: telemetry fetcher, canvas physics, Leaflet map
└── README.md        # Comprehensive technical documentation
```

---

## 8. Accessibility & Performance Standards

- **Accessible Colors & Contrast**: Tested against WCAG AA standards with electric cyan against midnight obsidian.
- **Prefers-Reduced-Motion**: Respects OS motion accessibility settings by dampening animations.
- **Performance**: Zero bulky dependencies; initial load is instantaneous.
- **Fluid Layout**: Responsive from 360px mobile screens to 4K ultra-wide monitors.

---

© 2026 AERIS Meteorological Systems. Powered by OpenWeather API.
