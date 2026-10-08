/* ==========================================================================
   AERIS — AI WEATHER INTELLIGENCE ENGINE (V2.5 PRO)
   Pure Vanilla JavaScript Architecture (ES6+)
   OpenWeather REST API Integration + Canvas Weather Simulation + Multi-View UI
   ========================================================================== */

/**
 * CONFIGURATION REPOSITORY
 * In production architecture, API keys should be accessed via a backend serverless proxy.
 */
const CONFIG = {
    API_KEY: "95d555dfec7690042570e5d5cfd20526",
    ENDPOINTS: {
        WEATHER: "https://api.openweathermap.org/data/2.5/weather",
        FORECAST: "https://api.openweathermap.org/data/2.5/forecast",
        AIR_POLLUTION: "https://api.openweathermap.org/data/2.5/air_pollution",
        GEOCODING: "https://api.openweathermap.org/geo/1.0/direct"
    },
    DEFAULT_CITY: "Indore",
    CACHE_EXPIRY_MS: 300000, // 5 minutes client cache
    RECENT_MAX: 6
};

/* ==========================================================================
   STATE MANAGEMENT
   ========================================================================== */

const STATE = {
    currentWeather: null,
    forecastData: null,
    airQualityData: null,
    activeCity: CONFIG.DEFAULT_CITY,
    unit: localStorage.getItem("aeris_unit") || "metric", // 'metric' (°C) or 'imperial' (°F)
    theme: localStorage.getItem("aeris_theme") || "default",
    animationsEnabled: localStorage.getItem("aeris_animations") !== "false",
    autoRefreshEnabled: localStorage.getItem("aeris_auto_refresh") !== "false",
    refreshIntervalMs: parseInt(localStorage.getItem("aeris_refresh_interval") || "600000", 10),
    savedCities: JSON.parse(localStorage.getItem("aeris_saved_cities") || "[]"),
    recentCities: JSON.parse(localStorage.getItem("aeris_recent_cities") || "[]"),
    activeView: "home",
    selectedForecastIndex: 0,
    mapInstance: null,
    mapTileLayer: null,
    weatherTileLayer: null,
    mapMarker: null,
    activeBasemap: localStorage.getItem("aeris_basemap") || "streets",
    activeMapLayer: "temp_new",
    autoRefreshTimer: null,
    clockTimer: null,
    isFetching: false
};

/* ==========================================================================
   DOM ELEMENTS REPOSITORY
   ========================================================================== */

const DOM = {
    // Topbar & Search
    searchForm: document.getElementById("searchForm"),
    cityInput: document.getElementById("cityInput"),
    searchButton: document.getElementById("searchButton"),
    geoBtn: document.getElementById("geoBtn"),
    searchDropdown: document.getElementById("searchDropdown"),
    quickPills: document.querySelectorAll(".city-chip"),
    saveCityBtn: document.getElementById("saveCityBtn"),
    saveCityIcon: document.getElementById("saveCityIcon"),
    saveCityText: document.getElementById("saveCityText"),
    refreshWeatherBtn: document.getElementById("refreshWeatherBtn"),
    celsiusBtn: document.getElementById("celsiusBtn"),
    fahrenheitBtn: document.getElementById("fahrenheitBtn"),

    // Navigation & Views
    navItems: document.querySelectorAll(".nav-item"),
    views: {
        home: document.getElementById("viewHome"),
        forecast: document.getElementById("viewForecast"),
        map: document.getElementById("viewMap"),
        saved: document.getElementById("viewSaved"),
        settings: document.getElementById("viewSettings")
    },
    savedCountBadge: document.getElementById("savedCountBadge"),
    gotoForecastViewBtn: document.getElementById("gotoForecastViewBtn"),

    // AI Assistant & Robot
    assistantSpeechBubble: document.getElementById("assistantSpeechBubble"),
    assistantHeadline: document.getElementById("assistantHeadline"),
    assistantSpeechText: document.getElementById("assistantSpeechText"),
    assistantModeTag: document.getElementById("assistantModeTag"),
    robotAvatar: document.getElementById("robotAvatar"),
    robotAura: document.getElementById("robotAura"),

    // Primary Weather Card
    cityName: document.getElementById("cityName"),
    cityCoords: document.getElementById("cityCoords"),
    countryName: document.getElementById("countryName"),
    currentDate: document.getElementById("currentDate"),
    currentTime: document.getElementById("currentTime"),
    cityTimezoneOffset: document.getElementById("cityTimezoneOffset"),
    temperature: document.getElementById("temperature"),
    tempUnitSymbol: document.getElementById("tempUnitSymbol"),
    feelsLike: document.getElementById("feelsLike"),
    tempMax: document.getElementById("tempMax"),
    tempMin: document.getElementById("tempMin"),
    weatherDescription: document.getElementById("weatherDescription"),
    weatherMessage: document.getElementById("weatherMessage"),
    weatherIconContainer: document.getElementById("weatherIconContainer"),
    visualSkyTag: document.getElementById("visualSkyTag"),

    // Secondary Telemetry Stats
    humidity: document.getElementById("humidity"),
    humidityBar: document.getElementById("humidityBar"),
    wind: document.getElementById("wind"),
    windDirectionText: document.getElementById("windDirectionText"),
    pressure: document.getElementById("pressure"),
    pressureClass: document.getElementById("pressureClass"),
    visibility: document.getElementById("visibility"),
    visibilityRating: document.getElementById("visibilityRating"),

    // Computed Insights
    outdoorScoreVal: document.getElementById("outdoorScoreVal"),
    outdoorScoreBadge: document.getElementById("outdoorScoreBadge"),
    outdoorScoreAdvice: document.getElementById("outdoorScoreAdvice"),
    scoreCircleProgress: document.getElementById("scoreCircleProgress"),
    insightComfort: document.getElementById("insightComfort"),
    insightComfortDesc: document.getElementById("insightComfortDesc"),
    insightRainRisk: document.getElementById("insightRainRisk"),
    insightRainDesc: document.getElementById("insightRainDesc"),
    insightWindStatus: document.getElementById("insightWindStatus"),
    insightWindDesc: document.getElementById("insightWindDesc"),
    insightCloudCover: document.getElementById("insightCloudCover"),
    insightCloudDesc: document.getElementById("insightCloudDesc"),

    // Air Quality
    aqiPanel: document.getElementById("aqiPanel"),
    aqiStatusBadge: document.getElementById("aqiStatusBadge"),
    aqiNumeric: document.getElementById("aqiNumeric"),
    aqiInterpretation: document.getElementById("aqiInterpretation"),
    aqiThumb: document.getElementById("aqiThumb"),
    pollutantPM25: document.getElementById("pollutantPM25"),
    pollutantPM10: document.getElementById("pollutantPM10"),
    pollutantNO2: document.getElementById("pollutantNO2"),
    pollutantO3: document.getElementById("pollutantO3"),

    // Hourly micro-forecast
    hourlyContainer: document.getElementById("hourlyContainer"),

    // Solar & Wind Ephemeris
    daylightLength: document.getElementById("daylightLength"),
    solarOrbTracker: document.getElementById("solarOrbTracker"),
    solarArcFill: document.getElementById("solarArcFill"),
    sunrise: document.getElementById("sunrise"),
    solarZenith: document.getElementById("solarZenith"),
    sunset: document.getElementById("sunset"),
    compassNeedle: document.getElementById("compassNeedle"),
    compassSpeedTag: document.getElementById("compassSpeedTag"),
    windBearingDeg: document.getElementById("windBearingDeg"),
    windGustVal: document.getElementById("windGustVal"),
    beaufortVal: document.getElementById("beaufortVal"),

    // Forecast Lists
    homeForecastList: document.getElementById("homeForecastList"),
    forecastViewCity: document.getElementById("forecastViewCity"),
    forecastExtendedGrid: document.getElementById("forecastExtendedGrid"),
    inspectorDayTitle: document.getElementById("inspectorDayTitle"),
    inspectorSlicesRow: document.getElementById("inspectorSlicesRow"),

    // Saved & Recent
    savedCitiesGrid: document.getElementById("savedCitiesGrid"),
    saveCurrentCityDirectBtn: document.getElementById("saveCurrentCityDirectBtn"),
    recentCitiesContainer: document.getElementById("recentCities"),
    clearRecent: document.getElementById("clearRecent"),

    // Map View
    weatherMap: document.getElementById("weatherMap"),
    mapTargetName: document.getElementById("mapTargetName"),
    mapTargetCoords: document.getElementById("mapTargetCoords"),
    activeLayerName: document.getElementById("activeLayerName"),
    mapLayerButtons: document.querySelectorAll(".map-layer-btn"),
    mapTypeButtons: document.querySelectorAll(".map-type-btn"),
    mapLocateBtn: document.getElementById("mapLocateBtn"),

    // Settings
    settingUnitSelect: document.getElementById("settingUnitSelect"),
    settingThemeSelect: document.getElementById("settingThemeSelect"),
    settingAnimToggle: document.getElementById("settingAnimToggle"),
    settingAutoRefreshToggle: document.getElementById("settingAutoRefreshToggle"),
    settingIntervalSelect: document.getElementById("settingIntervalSelect"),
    btnFlushLocalStorage: document.getElementById("btnFlushLocalStorage"),
    settingApiKeyInput: document.getElementById("settingApiKeyInput"),
    btnSaveApiKey: document.getElementById("btnSaveApiKey"),
    autoRefreshStatusText: document.getElementById("autoRefreshStatusText"),

    // Banners & Overlays
    alertBanner: document.getElementById("alertBanner"),
    alertTitle: document.getElementById("alertTitle"),
    alertDescription: document.getElementById("alertDescription"),
    closeAlert: document.getElementById("closeAlert"),
    errorBox: document.getElementById("errorBox"),
    errorTitle: document.getElementById("errorTitle"),
    errorMessage: document.getElementById("errorMessage"),
    closeError: document.getElementById("closeError"),
    loading: document.getElementById("loading"),
    loadingStatusMessage: document.getElementById("loadingStatusMessage"),
    toastContainer: document.getElementById("toastContainer"),
    footerClock: document.getElementById("footerClock"),

    // Background Canvas
    weatherCanvas: document.getElementById("weatherCanvas")
};

/* ==========================================================================
   CANVAS DYNAMIC ATMOSPHERIC SIMULATOR
   ========================================================================== */

const AtmosphericEngine = {
    ctx: null,
    particles: [],
    weatherType: "clear", // 'clear', 'clouds', 'rain', 'thunderstorm', 'snow'
    animationId: null,
    width: 0,
    height: 0,

    init() {
        if (!DOM.weatherCanvas) return;
        this.ctx = DOM.weatherCanvas.getContext("2d");
        this.resize();
        window.addEventListener("resize", () => this.resize());
        this.createParticles();
        this.loop();
    },

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        DOM.weatherCanvas.width = this.width;
        DOM.weatherCanvas.height = this.height;
    },

    setCondition(condition, isNight) {
        const cond = condition.toLowerCase();
        if (cond.includes("rain") || cond.includes("drizzle")) {
            this.weatherType = "rain";
        } else if (cond.includes("thunder") || cond.includes("storm")) {
            this.weatherType = "thunderstorm";
        } else if (cond.includes("snow")) {
            this.weatherType = "snow";
        } else if (cond.includes("cloud")) {
            this.weatherType = "clouds";
        } else {
            this.weatherType = isNight ? "night" : "clear";
        }
        this.createParticles();
    },

    createParticles() {
        this.particles = [];
        if (!STATE.animationsEnabled) return;

        let count = 60;
        if (this.weatherType === "rain") count = 120;
        if (this.weatherType === "snow") count = 90;
        if (this.weatherType === "thunderstorm") count = 150;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 2 + 1,
                speedY: this.getSpeedY(),
                speedX: (Math.random() - 0.5) * 0.8,
                alpha: Math.random() * 0.6 + 0.2,
                length: Math.random() * 15 + 10
            });
        }
    },

    getSpeedY() {
        if (this.weatherType === "rain") return Math.random() * 7 + 8;
        if (this.weatherType === "thunderstorm") return Math.random() * 9 + 11;
        if (this.weatherType === "snow") return Math.random() * 1.5 + 0.8;
        return (Math.random() - 0.5) * 0.4; // drifting embers/dust
    },

    loop() {
        if (!STATE.animationsEnabled) {
            if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
            this.animationId = requestAnimationFrame(() => this.loop());
            return;
        }

        this.ctx.clearRect(0, 0, this.width, this.height);

        // Thunderstorm lightning flashes
        if (this.weatherType === "thunderstorm" && Math.random() < 0.008) {
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // Render atmospheric particles
        for (let p of this.particles) {
            if (this.weatherType === "rain" || this.weatherType === "thunderstorm") {
                this.ctx.strokeStyle = `rgba(130, 205, 255, ${p.alpha})`;
                this.ctx.lineWidth = 1.2;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(p.x + p.speedX * 2, p.y + p.length);
                this.ctx.stroke();
            } else if (this.weatherType === "snow") {
                this.ctx.fillStyle = `rgba(240, 248, 255, ${p.alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Floating subtle quantum air particles
                this.ctx.fillStyle = `rgba(65, 213, 255, ${p.alpha * 0.5})`;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }

            p.y += p.speedY;
            p.x += p.speedX;

            if (p.y > this.height) {
                p.y = -10;
                p.x = Math.random() * this.width;
            }
            if (p.x > this.width) p.x = 0;
            if (p.x < 0) p.x = this.width;
        }

        this.animationId = requestAnimationFrame(() => this.loop());
    }
};

/* ==========================================================================
   TOAST SYSTEM
   ========================================================================== */

function showToast(message, type = "info", durationMs = 3500) {
    if (!DOM.toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let icon = "✦";
    if (type === "success") icon = "✓";
    if (type === "error") icon = "✕";

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-msg">${sanitizeHTML(message)}</span>
    `;

    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(12px) scale(0.9)";
        setTimeout(() => toast.remove(), 300);
    }, durationMs);
}

/* ==========================================================================
   LOADING & ERROR ARCHITECTURE
   ========================================================================== */

function showLoading(msg = "Synchronizing atmospheric sensors with orbital telemetry...") {
    STATE.isFetching = true;
    if (DOM.loadingStatusMessage) DOM.loadingStatusMessage.textContent = msg;
    if (DOM.loading) DOM.loading.classList.remove("hidden");
    if (DOM.refreshWeatherBtn) DOM.refreshWeatherBtn.classList.add("loading-spin");
}

function hideLoading() {
    STATE.isFetching = false;
    if (DOM.loading) DOM.loading.classList.add("hidden");
    if (DOM.refreshWeatherBtn) DOM.refreshWeatherBtn.classList.remove("loading-spin");
}

function showError(title, message) {
    if (!DOM.errorBox) return;
    DOM.errorTitle.textContent = title;
    DOM.errorMessage.textContent = message;
    DOM.errorBox.classList.remove("hidden");
    DOM.errorBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideError() {
    if (DOM.errorBox) DOM.errorBox.classList.add("hidden");
}

DOM.closeError?.addEventListener("click", hideError);

/* ==========================================================================
   API TELEMETRY CLIENT (CURRENT WEATHER, 5-DAY, AIR POLLUTION, GEO)
   ========================================================================== */

/**
 * Robust fetch wrapper handling HTTP status codes: 404, 401, 429, network offline.
 */
async function fetchAPI(url) {
    if (!navigator.onLine) {
        throw new Error("OFFLINE_NETWORK");
    }

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) throw new Error("CITY_NOT_FOUND");
        if (response.status === 401) throw new Error("INVALID_API_KEY");
        if (response.status === 429) throw new Error("RATE_LIMIT_EXCEEDED");
        throw new Error(`HTTP_ERROR_${response.status}`);
    }

    return await response.json();
}

/**
 * Main Orchestration Function: Fetches all telemetry layers concurrently
 */
async function executeWeatherTelemetry(cityQuery, coords = null) {
    const activeKey = getActiveApiKey();
    if (!activeKey || activeKey === "YOUR_OPENWEATHER_API_KEY") {
        showError("API Key Missing", "Please supply an OpenWeather API Key in settings or script.js CONFIG.");
        return;
    }

    showLoading(`Analyzing atmosphere for ${cityQuery || "coordinates"}...`);
    hideError();

    try {
        let weatherUrl;
        let forecastUrl;

        if (coords) {
            weatherUrl = `${CONFIG.ENDPOINTS.WEATHER}?lat=${coords.lat}&lon=${coords.lon}&appid=${activeKey}&units=${STATE.unit}`;
            forecastUrl = `${CONFIG.ENDPOINTS.FORECAST}?lat=${coords.lat}&lon=${coords.lon}&appid=${activeKey}&units=${STATE.unit}`;
        } else {
            weatherUrl = `${CONFIG.ENDPOINTS.WEATHER}?q=${encodeURIComponent(cityQuery.trim())}&appid=${activeKey}&units=${STATE.unit}`;
            forecastUrl = `${CONFIG.ENDPOINTS.FORECAST}?q=${encodeURIComponent(cityQuery.trim())}&appid=${activeKey}&units=${STATE.unit}`;
        }

        // Fetch Weather and Forecast simultaneously
        const [weatherData, forecastData] = await Promise.all([
            fetchAPI(weatherUrl),
            fetchAPI(forecastUrl).catch(err => {
                console.warn("Forecast fetch warning:", err);
                return null; // Graceful degradation if forecast fails
            })
        ]);

        STATE.currentWeather = weatherData;
        STATE.forecastData = forecastData;
        STATE.activeCity = weatherData.name;

        // Try fetching Air Quality using coordinates from weatherData
        if (weatherData.coord) {
            try {
                const aqiUrl = `${CONFIG.ENDPOINTS.AIR_POLLUTION}?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&appid=${activeKey}`;
                STATE.airQualityData = await fetchAPI(aqiUrl);
            } catch (aqiErr) {
                console.warn("Air Quality unavailable for this region:", aqiErr);
                STATE.airQualityData = null;
            }
        }

        // Render all UI components
        renderAllTelemetry();

        // Update registries
        recordRecentSearch(weatherData);
        updateSaveCityButtonState();

        showToast(`Atmospheric sync complete: ${weatherData.name}`, "info");

    } catch (error) {
        console.error("Telemetry fetch error:", error);
        handleFetchErrors(error, cityQuery);
    } finally {
        hideLoading();
    }
}

function handleFetchErrors(error, query) {
    if (error.message === "CITY_NOT_FOUND") {
        showError("City Not Found", `We couldn't locate weather data for "${query}". Check the spelling and try again.`);
    } else if (error.message === "INVALID_API_KEY") {
        showError("Invalid API Key", "Your OpenWeather API key is invalid or not yet activated (can take 10-20 mins).");
    } else if (error.message === "RATE_LIMIT_EXCEEDED") {
        showError("Rate Limit Exceeded", "OpenWeather rate limit reached. Please wait a minute before requesting again.");
    } else if (error.message === "OFFLINE_NETWORK") {
        showError("Connection Problem", "AERIS couldn't reach the weather service. Check your internet connection.");
    } else {
        showError("Weather Service Unavailable", "AERIS encountered an unexpected response from OpenWeather. Try again shortly.");
    }
}

function getActiveApiKey() {
    return localStorage.getItem("aeris_api_key_override") || CONFIG.API_KEY;
}

/* ==========================================================================
   RENDER ORCHESTRATION & COMPONENT UPGRADES
   ========================================================================== */

function renderAllTelemetry() {
    if (!STATE.currentWeather) return;

    renderPrimaryWeather();
    renderAIAssistant();
    renderSecondaryStats();
    renderAtmosphericInsights();
    renderAirQuality();
    renderHourlyChrono();
    renderSolarEphemeris();
    renderWindCompass();
    renderForecastPreview();
    renderForecastDetailedView();
    renderWeatherAlerts();
    updateThemeAtmosphere();

    // If map view is active, update map position
    if (STATE.activeView === "map") {
        syncWeatherMap();
    }
}

/**
 * 1. Primary Weather Card Presentation
 */
function renderPrimaryWeather() {
    const data = STATE.currentWeather;
    const { name, sys, main, weather, coord, timezone } = data;

    DOM.cityName.textContent = `${name}, ${sys.country || ""}`;
    DOM.countryName.textContent = `${getCountryName(sys.country)} • Station ID: ${data.id || "GPS"}`;
    DOM.cityCoords.textContent = `${coord.lat.toFixed(2)}° N, ${coord.lon.toFixed(2)}° E`;

    DOM.temperature.textContent = Math.round(main.temp);
    DOM.tempUnitSymbol.textContent = STATE.unit === "metric" ? "°C" : "°F";
    DOM.feelsLike.textContent = `${Math.round(main.feels_like)}°`;
    DOM.tempMax.textContent = `${Math.round(main.temp_max)}°`;
    DOM.tempMin.textContent = `${Math.round(main.temp_min)}°`;

    const condition = weather[0].main;
    const desc = weather[0].description;
    DOM.weatherDescription.textContent = capitalizeWords(desc);
    DOM.weatherMessage.textContent = generateAtmosphericNarrative(condition, main);

    // Weather Visual Stage
    renderWeatherVisualSphere(condition, weather[0].icon);

    // Dynamic Clock
    startLocalStationClock(timezone);
}

function renderWeatherVisualSphere(condition, iconCode) {
    const isNight = iconCode.endsWith("n");
    DOM.visualSkyTag.textContent = condition.toUpperCase();

    let visualHTML = "";
    if (condition === "Clear") {
        if (isNight) {
            visualHTML = `<div class="moon-orb"><span style="font-size: 78px; filter: drop-shadow(0 0 25px rgba(255,255,255,0.6));">☾</span></div>`;
        } else {
            visualHTML = `<div class="sun-orb"><div class="sun-orb-core"></div></div>`;
        }
    } else if (condition === "Clouds") {
        visualHTML = `<div style="font-size: 80px; filter: drop-shadow(0 0 25px rgba(100,200,255,0.4));">☁</div>`;
    } else if (condition === "Rain" || condition === "Drizzle") {
        visualHTML = `<div style="font-size: 80px; filter: drop-shadow(0 0 25px rgba(50,150,255,0.6));">🌧</div>`;
    } else if (condition === "Thunderstorm") {
        visualHTML = `<div style="font-size: 80px; filter: drop-shadow(0 0 30px rgba(255,180,50,0.8));">⛈</div>`;
    } else if (condition === "Snow") {
        visualHTML = `<div style="font-size: 80px; filter: drop-shadow(0 0 25px rgba(200,240,255,0.8));">❄</div>`;
    } else {
        visualHTML = `<div style="font-size: 80px; filter: drop-shadow(0 0 25px rgba(150,180,210,0.5));">🌫</div>`;
    }

    DOM.weatherIconContainer.innerHTML = visualHTML;
}

/**
 * 2. AI Weather Assistant Reaction Engine
 */
function renderAIAssistant() {
    const weather = STATE.currentWeather;
    if (!weather) return;

    const condition = weather.weather[0].main;
    const temp = weather.main.temp;
    const isNight = weather.weather[0].icon.endsWith("n");

    let headline = "Atmospheric Synchrony Established";
    let message = "Conditions are nominal across local troposphere.";
    let robotClass = "state-clear";

    if (condition === "Clear") {
        headline = isNight ? "Clear Nocturnal Sky" : "Optimal Clear Conditions";
        message = isNight
            ? "Unobstructed nocturnal sky detected. Optimal atmospheric visibility for celestial tracking."
            : "Conditions look excellent today. Thermal balance is favorable — perfect time to be outside.";
        robotClass = "state-clear";
    } else if (condition === "Rain" || condition === "Drizzle") {
        headline = "Precipitation Detected";
        message = "Precipitation detected in your area. Surface friction reduced; carry rain protection.";
        robotClass = "state-rain";
    } else if (condition === "Thunderstorm") {
        headline = "Severe Storm Alert";
        message = "Active convective storm cell detected. High electrical discharge potential; outdoor plans should be reconsidered.";
        robotClass = "state-storm";
    } else if (condition === "Snow") {
        headline = "Cryosphere Deposition";
        message = "Sub-freezing crystalline precipitation falling. Thermal insulation recommended.";
        robotClass = "state-cold";
    } else if (temp > 35 && STATE.unit === "metric" || temp > 95 && STATE.unit === "imperial") {
        headline = "Extreme Thermal Advisory";
        message = "High temperatures detected. Stay hydrated and limit prolonged direct ultraviolet exposure.";
        robotClass = "state-storm";
    } else if (temp < 5 && STATE.unit === "metric" || temp < 41 && STATE.unit === "imperial") {
        headline = "Hypothermic Vector Warning";
        message = "Temperatures are dropping significantly. Consider an additional thermal layer before heading out.";
        robotClass = "state-cold";
    }

    DOM.assistantHeadline.textContent = headline;
    DOM.assistantSpeechText.innerHTML = message;
    DOM.assistantModeTag.textContent = condition.toUpperCase();

    // Update Robot Visual Avatar State
    DOM.robotAvatar.className = `robot ${robotClass}`;
}

/**
 * 3. Secondary Telemetry Stats
 */
function renderSecondaryStats() {
    const { main, wind: windData, visibility: visData } = STATE.currentWeather;

    // Humidity
    DOM.humidity.textContent = `${main.humidity}%`;
    DOM.humidityBar.style.width = `${Math.min(main.humidity, 100)}%`;

    // Wind
    DOM.wind.textContent = `${windData.speed} ${STATE.unit === "metric" ? "m/s" : "mph"}`;
    DOM.windDirectionText.textContent = `${getWindDirectionCompass(windData.deg)} (${windData.deg || 0}°)`;

    // Pressure
    DOM.pressure.textContent = `${main.pressure} hPa`;
    let pClass = "Standard (Stable)";
    if (main.pressure < 1005) pClass = "Low Pressure (Storm Front)";
    else if (main.pressure > 1025) pClass = "High Pressure (Clear Sky)";
    DOM.pressureClass.textContent = pClass;

    // Visibility
    const visKm = (visData / 1000).toFixed(1);
    DOM.visibility.textContent = `${visKm} km`;
    let visRate = "Optimal Sight";
    if (visKm < 2) visRate = "Dense Fog / Hazard";
    else if (visKm < 6) visRate = "Moderate Haze";
    DOM.visibilityRating.textContent = visRate;
}

/**
 * 4. Rule-Based Atmospheric Insights Calculation Engine
 */
function renderAtmosphericInsights() {
    const { main, weather, wind, visibility, clouds } = STATE.currentWeather;
    const tempC = STATE.unit === "metric" ? main.temp : (main.temp - 32) * (5 / 9);

    // Calculate Outdoor Score (0-100) based on realistic factors
    let score = 100;
    if (tempC < 10) score -= (10 - tempC) * 2;
    if (tempC > 28) score -= (tempC - 28) * 3;
    if (main.humidity > 70) score -= (main.humidity - 70) * 0.5;
    if (wind.speed > 8) score -= (wind.speed - 8) * 4;
    if (visibility < 5000) score -= 15;
    if (weather[0].main === "Rain") score -= 35;
    if (weather[0].main === "Thunderstorm") score -= 60;
    score = Math.max(10, Math.min(100, Math.round(score)));

    DOM.outdoorScoreVal.textContent = score;

    // SVG radial circle progress: circumference = 2 * PI * 42 ≈ 264
    const offset = 264 - (score / 100) * 264;
    DOM.scoreCircleProgress.style.strokeDashoffset = offset;

    let badge = "EXCELLENT";
    let advice = "Optimal conditions for outdoor activities, sports, or travel.";
    if (score < 40) {
        badge = "POOR";
        advice = "Adverse weather factors detected. Indoor shelter recommended.";
    } else if (score < 70) {
        badge = "MODERATE";
        advice = "Acceptable conditions. Exercise caution with changing fronts.";
    }
    DOM.outdoorScoreBadge.textContent = badge;
    DOM.outdoorScoreAdvice.textContent = advice;

    // Comfort
    let comfort = "Comfortable";
    let comfortDesc = "Mild ambient temperature";
    if (tempC > 30 && main.humidity > 60) {
        comfort = "Muggy & Sultry";
        comfortDesc = "High heat index";
    } else if (tempC < 12) {
        comfort = "Chilly";
        comfortDesc = "Wind-chill factor active";
    }
    DOM.insightComfort.textContent = comfort;
    DOM.insightComfortDesc.textContent = comfortDesc;

    // Rain Risk
    let rainRisk = "Low (<10%)";
    let rainDesc = "Negligible shower probability";
    if (weather[0].main === "Rain" || weather[0].main === "Drizzle") {
        rainRisk = "High (>85%)";
        rainDesc = "Active ground saturation";
    } else if (clouds.all > 75) {
        rainRisk = "Moderate (40%)";
        rainDesc = "Overcast cumulus decks";
    }
    DOM.insightRainRisk.textContent = rainRisk;
    DOM.insightRainDesc.textContent = rainDesc;

    // Wind Shear
    DOM.insightWindStatus.textContent = getBeaufortDescription(wind.speed);
    DOM.insightWindDesc.textContent = `Velocity: ${wind.speed} m/s`;

    // Cloud Veil
    DOM.insightCloudCover.textContent = `${clouds.all}%`;
    DOM.insightCloudDesc.textContent = clouds.all > 80 ? "Dense stratocumulus" : "Scattered cirrus veil";
}

/**
 * 5. Air Quality Telemetry & Pollutant Sensors
 */
function renderAirQuality() {
    if (!STATE.airQualityData || !STATE.airQualityData.list || !STATE.airQualityData.list.length) {
        DOM.aqiNumeric.textContent = "N/A";
        DOM.aqiInterpretation.textContent = "Air pollution telemetry sensor unavailable for this coordinate.";
        return;
    }

    const item = STATE.airQualityData.list[0];
    const aqi = item.main.aqi; // 1 to 5 in OpenWeather
    const comps = item.components;

    const aqiLabels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
    const aqiText = aqiLabels[aqi - 1] || "Moderate";

    DOM.aqiNumeric.textContent = `AQI ${aqi}`;
    DOM.aqiStatusBadge.textContent = aqiText.toUpperCase();

    // Position indicator along spectrum bar (0% to 100%)
    const percent = Math.min(100, Math.max(0, ((aqi - 1) / 4) * 100));
    DOM.aqiThumb.style.left = `${percent}%`;

    let interp = "Clean air with low particulate matter. Safe for outdoor exertion.";
    if (aqi >= 4) interp = "Elevated particulate pollution. Sensitive groups should wear filtration masks.";
    DOM.aqiInterpretation.textContent = interp;

    // Components
    DOM.pollutantPM25.innerHTML = `${comps.pm2_5.toFixed(1)} <small>µg/m³</small>`;
    DOM.pollutantPM10.innerHTML = `${comps.pm10.toFixed(1)} <small>µg/m³</small>`;
    DOM.pollutantNO2.innerHTML = `${comps.no2.toFixed(1)} <small>µg/m³</small>`;
    DOM.pollutantO3.innerHTML = `${comps.o3.toFixed(1)} <small>µg/m³</small>`;
}

/**
 * 6. Hourly Chrono-Prediction Row
 */
function renderHourlyChrono() {
    if (!STATE.forecastData || !STATE.forecastData.list) {
        DOM.hourlyContainer.innerHTML = `<p style="padding: 12px; color: var(--text-tertiary);">Hourly forecast data loading...</p>`;
        return;
    }

    DOM.hourlyContainer.innerHTML = "";
    const list = STATE.forecastData.list.slice(0, 8); // Next 24 hours (3-hour intervals)

    list.forEach((item, index) => {
        const date = new Date(item.dt * 1000);
        const hours = date.getHours();
        const ampm = hours >= 12 ? "PM" : "AM";
        const formattedHour = `${hours % 12 || 12} ${ampm}`;
        const temp = Math.round(item.main.temp);
        const iconEmoji = getWeatherEmoji(item.weather[0].main, item.weather[0].icon);
        const pop = Math.round((item.pop || 0) * 100);

        const card = document.createElement("div");
        card.className = `hourly-card ${index === 0 ? "active-now" : ""}`;
        card.innerHTML = `
            <span class="hourly-time">${index === 0 ? "Now" : formattedHour}</span>
            <div class="hourly-icon">${iconEmoji}</div>
            <strong class="hourly-temp">${temp}°</strong>
            <span class="hourly-pop">${pop > 0 ? `☂ ${pop}%` : "0%"}</span>
        `;
        DOM.hourlyContainer.appendChild(card);
    });
}

/**
 * 7. Celestial Ephemeris: Sunrise / Sunset & Solar Arc Tracker
 */
function renderSolarEphemeris() {
    const { sys, timezone } = STATE.currentWeather;
    const sunriseEpoch = sys.sunrise;
    const sunsetEpoch = sys.sunset;
    const currentEpoch = Math.floor(Date.now() / 1000);

    const sunriseStr = formatUTCTimestamp(sunriseEpoch, timezone);
    const sunsetStr = formatUTCTimestamp(sunsetEpoch, timezone);

    DOM.sunrise.textContent = sunriseStr;
    DOM.sunset.textContent = sunsetStr;

    // Daylight length calculation
    const daylightSec = Math.max(0, sunsetEpoch - sunriseEpoch);
    const dayHours = Math.floor(daylightSec / 3600);
    const dayMins = Math.floor((daylightSec % 3600) / 60);
    DOM.daylightLength.textContent = `Daylight: ${dayHours}h ${dayMins}m`;

    // Solar Zenith (Midpoint)
    const zenithEpoch = Math.floor((sunriseEpoch + sunsetEpoch) / 2);
    DOM.solarZenith.textContent = formatUTCTimestamp(zenithEpoch, timezone);

    // Calculate Sun's progress along arc (0.0 to 1.0)
    let progress = 0;
    if (currentEpoch >= sunriseEpoch && currentEpoch <= sunsetEpoch) {
        progress = (currentEpoch - sunriseEpoch) / daylightSec;
    } else if (currentEpoch > sunsetEpoch) {
        progress = 1.0;
    }

    // SVG arc stroke-dashoffset: path length ≈ 420
    const offset = 420 - progress * 210;
    DOM.solarArcFill.style.strokeDashoffset = offset;

    // Move sun orb along geometric arc: x from 30 to 290, y follows ellipse
    const arcX = 30 + progress * 260;
    const arcY = 140 - Math.sin(progress * Math.PI) * 90;
    DOM.solarOrbTracker.style.left = `${(arcX / 320) * 100}%`;
    DOM.solarOrbTracker.style.top = `${(arcY / 160) * 100}%`;
}

/**
 * 8. Vector Wind Compass & Radar Direction
 */
function renderWindCompass() {
    const { wind } = STATE.currentWeather;
    const deg = wind.deg || 0;
    const speed = wind.speed || 0;

    DOM.compassNeedle.style.transform = `rotate(${deg}deg)`;
    DOM.compassSpeedTag.textContent = `${speed} ${STATE.unit === "metric" ? "m/s" : "mph"}`;
    DOM.windBearingDeg.textContent = `${deg}° ${getWindDirectionCompass(deg)}`;
    DOM.windGustVal.textContent = wind.gust ? `${wind.gust} m/s` : "Normal";
    DOM.beaufortVal.textContent = `${getBeaufortScale(speed)} — ${getBeaufortDescription(speed)}`;
}

/**
 * 9. Synoptic 5-Day Forecast Grid Preview
 */
function renderForecastPreview() {
    if (!STATE.forecastData || !STATE.forecastData.list) return;

    DOM.homeForecastList.innerHTML = "";
    const dailyData = aggregateForecastByDay(STATE.forecastData.list);

    dailyData.slice(0, 5).forEach((day, index) => {
        const card = document.createElement("div");
        card.className = `forecast-card ${index === 0 ? "selected" : ""}`;
        card.innerHTML = `
            <span class="forecast-day">${day.dayName}</span>
            <span class="forecast-date">${day.dateFormatted}</span>
            <div class="forecast-card-icon">${day.iconEmoji}</div>
            <div class="forecast-temps">
                <span class="forecast-high">${day.maxTemp}°</span>
                <span class="forecast-low">${day.minTemp}°</span>
            </div>
            <span class="forecast-condition-label">${day.condition}</span>
        `;

        card.addEventListener("click", () => {
            switchView("forecast");
            inspectForecastDay(index);
        });

        DOM.homeForecastList.appendChild(card);
    });
}

/**
 * 10. Dedicated 5-Day Forecast View & Day Inspector
 */
function renderForecastDetailedView() {
    if (!STATE.forecastData || !STATE.forecastData.list) return;

    DOM.forecastViewCity.textContent = `${STATE.currentWeather.name}, ${STATE.currentWeather.sys.country}`;
    DOM.forecastExtendedGrid.innerHTML = "";

    const dailyData = aggregateForecastByDay(STATE.forecastData.list);

    dailyData.slice(0, 5).forEach((day, index) => {
        const card = document.createElement("div");
        card.className = `extended-card ${index === STATE.selectedForecastIndex ? "active-selected" : ""}`;
        card.innerHTML = `
            <span class="panel-eyebrow">DAY 0${index + 1}</span>
            <h3 style="font-size: 18px; margin: 6px 0 2px;">${day.dayName}</h3>
            <span style="font-size: 11px; color: var(--text-tertiary);">${day.dateFormatted}</span>
            <div style="font-size: 38px; margin: 14px 0;">${day.iconEmoji}</div>
            <div class="forecast-temps" style="margin-bottom: 8px;">
                <strong style="font-size: 20px;">${day.maxTemp}°</strong>
                <span style="font-size: 14px; color: var(--text-tertiary);">${day.minTemp}°</span>
            </div>
            <span style="font-size: 12px; color: var(--cyan);">${day.condition}</span>
        `;

        card.addEventListener("click", () => {
            STATE.selectedForecastIndex = index;
            renderForecastDetailedView();
            inspectForecastDay(index);
        });

        DOM.forecastExtendedGrid.appendChild(card);
    });

    inspectForecastDay(STATE.selectedForecastIndex);
}

function inspectForecastDay(dayIndex) {
    const dailyData = aggregateForecastByDay(STATE.forecastData.list);
    const day = dailyData[dayIndex];
    if (!day) return;

    DOM.inspectorDayTitle.textContent = `${day.dayName} (${day.dateFormatted}) — 3-Hour Synoptic Micro-Slices`;
    DOM.inspectorSlicesRow.innerHTML = "";

    day.rawSlices.forEach(slice => {
        const time = new Date(slice.dt * 1000).toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
        const sliceCard = document.createElement("div");
        sliceCard.className = "slice-card";
        sliceCard.innerHTML = `
            <span class="slice-time">${time}</span>
            <div class="slice-icon">${getWeatherEmoji(slice.weather[0].main, slice.weather[0].icon)}</div>
            <strong class="slice-temp">${Math.round(slice.main.temp)}°</strong>
            <span class="slice-pop">☂ ${Math.round((slice.pop || 0) * 100)}%</span>
        `;
        DOM.inspectorSlicesRow.appendChild(sliceCard);
    });
}

/**
 * 11. Meteorological Advisories Banner
 */
function renderWeatherAlerts() {
    const { weather, main, wind } = STATE.currentWeather;
    const condition = weather[0].main;
    const temp = main.temp;

    let hasAlert = false;
    let title = "";
    let desc = "";

    if (condition === "Thunderstorm") {
        hasAlert = true;
        title = "Severe Electrical Thunderstorm Detected";
        desc = "High voltage atmospheric discharge and wind shear present. Seek hardened indoor structure.";
    } else if (wind.speed > 12) {
        hasAlert = true;
        title = "High Velocity Gale Advisory";
        desc = `Wind velocity peaking at ${wind.speed} m/s. Secure exterior lightweight fixtures.`;
    } else if ((temp > 38 && STATE.unit === "metric") || (temp > 100 && STATE.unit === "imperial")) {
        hasAlert = true;
        title = "Excessive Thermal Index";
        desc = "Extreme ground temperatures detected. Heat exhaustion risk during prolonged exposure.";
    }

    if (hasAlert) {
        DOM.alertTitle.textContent = title;
        DOM.alertDescription.textContent = desc;
        DOM.alertBanner.classList.remove("hidden");
    } else {
        DOM.alertBanner.classList.add("hidden");
    }
}

DOM.closeAlert?.addEventListener("click", () => {
    DOM.alertBanner.classList.add("hidden");
});

/* ==========================================================================
   VIEW 3: INTERACTIVE LEAFLET WEATHER MAP
   ========================================================================== */

/* ==========================================================================
   VIEW 3: INTERACTIVE LEAFLET WEATHER MAP (GOOGLE MAPS STYLE)
   ========================================================================== */

const BASEMAP_TILES = {
    streets: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19
    },
    satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
        maxZoom: 18
    },
    dark: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; Esri, HERE, DeLorme, MapmyIndia, OpenStreetMap contributors',
        maxZoom: 16
    },
    terrain: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; Esri, HERE, DeLorme, TomTom, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), swisstopo, MapmyIndia, and the GIS User Community',
        maxZoom: 18
    }
};

function initWeatherMap() {
    if (STATE.mapInstance || !DOM.weatherMap || typeof L === "undefined") return;

    // Center on active city coords or fallback
    const lat = STATE.currentWeather?.coord?.lat || 22.72;
    const lon = STATE.currentWeather?.coord?.lon || 75.83;

    STATE.mapInstance = L.map("weatherMap", {
        center: [lat, lon],
        zoom: 8,
        zoomControl: true,
        scrollWheelZoom: true
    });

    // Create a dedicated custom pane for Weather Radar overlays
    // Leaflet tilePane has z-index 200, so we set radarPane to 350 to ensure it's ALWAYS on top of any basemap
    if (!STATE.mapInstance.getPane("weatherRadarPane")) {
        const radarPane = STATE.mapInstance.createPane("weatherRadarPane");
        radarPane.style.zIndex = 350;
        radarPane.style.pointerEvents = "none";
    }

    // Set Basemap Layer
    updateBasemapLayer(STATE.activeBasemap);

    // Attach OpenWeather Radar Tile Layer (if active)
    updateMapWeatherTileLayer();

    // Attach Location Target Pin
    updateMapMarker(lat, lon);

    // Google Maps Style Click-anywhere interaction: inspect clicked location!
    STATE.mapInstance.on("click", (e) => {
        const clickedLat = e.latlng.lat;
        const clickedLon = e.latlng.lng;
        showToast(`Inspecting coordinates: ${clickedLat.toFixed(2)}°, ${clickedLon.toFixed(2)}°`, "info");
        executeWeatherTelemetry(null, { lat: clickedLat, lon: clickedLon });
    });
}

function updateBasemapLayer(type = "streets") {
    if (!STATE.mapInstance) return;

    if (STATE.mapTileLayer) {
        STATE.mapInstance.removeLayer(STATE.mapTileLayer);
    }

    const config = BASEMAP_TILES[type] || BASEMAP_TILES.streets;
    STATE.activeBasemap = type;
    localStorage.setItem("aeris_basemap", type);

    STATE.mapTileLayer = L.tileLayer(config.url, {
        attribution: config.attribution,
        maxZoom: config.maxZoom
    }).addTo(STATE.mapInstance);

    // Keep radar layer on top if present
    if (STATE.weatherTileLayer) {
        STATE.weatherTileLayer.bringToFront();
    }
}

function updateMapMarker(lat, lon) {
    if (!STATE.mapInstance || typeof L === "undefined") return;

    // Create Google Maps style custom marker pin with pulse animation
    const customPinIcon = L.divIcon({
        className: "gmap-custom-pin-wrapper",
        html: `
            <div class="gmap-marker-pin">
                <div class="gmap-marker-pulse"></div>
                <div class="gmap-marker-core"></div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });

    if (STATE.mapMarker) {
        STATE.mapMarker.setLatLng([lat, lon]);
    } else {
        STATE.mapMarker = L.marker([lat, lon], { icon: customPinIcon }).addTo(STATE.mapInstance);
    }

    // Attach Google Maps style popup with live temperature & details
    if (STATE.currentWeather) {
        const city = STATE.currentWeather.name || "Target Location";
        const country = STATE.currentWeather.sys?.country || "";
        const temp = Math.round(STATE.currentWeather.main?.temp ?? 0);
        const unitSymbol = STATE.unit === "metric" ? "°C" : "°F";
        const desc = STATE.currentWeather.weather?.[0]?.description || "";
        const humidity = STATE.currentWeather.main?.humidity ?? "--";
        const wind = STATE.currentWeather.wind?.speed ?? "--";

        const popupContent = `
            <div class="gmap-popup-card">
                <div class="gmap-popup-header">
                    <span class="gmap-popup-city">📍 ${sanitizeHTML(city)}${country ? ", " + sanitizeHTML(country) : ""}</span>
                    <span class="gmap-popup-temp">${temp}${unitSymbol}</span>
                </div>
                <div class="gmap-popup-desc">${sanitizeHTML(desc)}</div>
                <div class="gmap-popup-stats">
                    <span>💧 ${humidity}% Humidity</span>
                    <span>💨 ${wind} m/s Wind</span>
                </div>
            </div>
        `;
        STATE.mapMarker.bindPopup(popupContent).openPopup();
    }
}

function updateMapWeatherTileLayer() {
    if (!STATE.mapInstance) return;

    if (STATE.weatherTileLayer) {
        STATE.mapInstance.removeLayer(STATE.weatherTileLayer);
        STATE.weatherTileLayer = null;
    }

    const layer = STATE.activeMapLayer;
    if (layer === "none") {
        DOM.activeLayerName.textContent = "Clean Street Cartography (Radar Off)";
        return;
    }

    const key = getActiveApiKey();
    const tileUrl = `https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${key}`;

    STATE.weatherTileLayer = L.tileLayer(tileUrl, {
        pane: "weatherRadarPane",
        opacity: 0.75,
        maxZoom: 18,
        tileSize: 256
    }).addTo(STATE.mapInstance);

    const layerTitles = {
        temp_new: "Surface Thermal Sensor Active",
        precipitation_new: "Precipitation & Rain Radar Active",
        clouds_new: "Cloud Mass Satellite Active",
        wind_new: "Wind Vector Isobars Active",
        pressure_new: "Atmospheric Pressure Contours Active",
        none: "Clean Map Mode"
    };

    DOM.activeLayerName.textContent = layerTitles[layer] || "Radar Active";
}

function syncWeatherMap() {
    if (!STATE.mapInstance) {
        initWeatherMap();
    }
    if (!STATE.mapInstance || !STATE.currentWeather) return;

    const { lat, lon } = STATE.currentWeather.coord;
    STATE.mapInstance.setView([lat, lon], 7, { animate: true });
    STATE.mapInstance.invalidateSize();

    // Update pin position and popup
    updateMapMarker(lat, lon);

    DOM.mapTargetName.textContent = `${STATE.currentWeather.name}, ${STATE.currentWeather.sys.country}`;
    DOM.mapTargetCoords.textContent = `${lat.toFixed(2)}° N, ${lon.toFixed(2)}° E`;
}

// Basemap Switcher (Streets, Satellite, Dark, Terrain)
DOM.mapTypeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        DOM.mapTypeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const mapType = btn.dataset.mapType;
        updateBasemapLayer(mapType);
    });
});

// Locate Me button directly inside the Map View (Google Maps style)
DOM.mapLocateBtn?.addEventListener("click", () => {
    if (!navigator.geolocation) {
        showError("Geolocation Unavailable", "Browser does not support geolocation positioning.");
        return;
    }

    showToast("Finding your GPS location...", "info");

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const coords = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };
            executeWeatherTelemetry(null, coords);
            showToast("Centered on your current location!", "info");
        },
        (error) => {
            console.warn("Map geolocation error:", error);
            showError("Location Access Denied", "Please allow location access in your browser settings to pinpoint your location.");
        },
        { timeout: 10000, enableHighAccuracy: true }
    );
});

// Map layer toggle buttons
DOM.mapLayerButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        DOM.mapLayerButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        STATE.activeMapLayer = btn.dataset.layer;
        updateMapWeatherTileLayer();
    });
});

/* ==========================================================================
   VIEW 4: SAVED CITIES REPOSITORY
   ========================================================================== */

function renderSavedCities() {
    DOM.savedCountBadge.textContent = STATE.savedCities.length;
    DOM.savedCitiesGrid.innerHTML = "";

    if (STATE.savedCities.length === 0) {
        DOM.savedCitiesGrid.innerHTML = `
            <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-tertiary); background: var(--bg-card); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
                <p style="font-size: 16px; color: var(--text-secondary); margin-bottom: 6px;">No saved stations in repository.</p>
                <small>Bookmark cities using the top-bar Save button to access fast telemetry anytime.</small>
            </div>
        `;
        return;
    }

    STATE.savedCities.forEach(city => {
        const card = document.createElement("div");
        card.className = "saved-city-card";
        card.innerHTML = `
            <div class="saved-card-left">
                <h3>${sanitizeHTML(city.name)}</h3>
                <span>${sanitizeHTML(city.country)} • ${sanitizeHTML(city.condition)}</span>
            </div>
            <div class="saved-card-right">
                <span class="saved-temp">${city.temperature}°</span>
                <button class="remove-city-btn" title="Remove station" aria-label="Remove city">✕</button>
            </div>
        `;

        // Click on card fetches city
        card.addEventListener("click", (e) => {
            if (e.target.closest(".remove-city-btn")) return;
            switchView("home");
            executeWeatherTelemetry(city.name);
        });

        // Remove button
        card.querySelector(".remove-city-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            removeSavedCity(city.name);
        });

        DOM.savedCitiesGrid.appendChild(card);
    });
}

function toggleSaveCurrentCity() {
    if (!STATE.currentWeather) return;

    const name = STATE.currentWeather.name;
    const exists = STATE.savedCities.some(c => c.name.toLowerCase() === name.toLowerCase());

    if (exists) {
        removeSavedCity(name);
    } else {
        const newCity = {
            name: STATE.currentWeather.name,
            country: STATE.currentWeather.sys.country,
            temperature: Math.round(STATE.currentWeather.main.temp),
            condition: STATE.currentWeather.weather[0].main
        };
        STATE.savedCities.push(newCity);
        localStorage.setItem("aeris_saved_cities", JSON.stringify(STATE.savedCities));
        updateSaveCityButtonState();
        renderSavedCities();
        showToast(`✓ ${name} added to saved stations`, "success");
    }
}

function removeSavedCity(cityName) {
    STATE.savedCities = STATE.savedCities.filter(c => c.name.toLowerCase() !== cityName.toLowerCase());
    localStorage.setItem("aeris_saved_cities", JSON.stringify(STATE.savedCities));
    updateSaveCityButtonState();
    renderSavedCities();
    showToast(`Removed ${cityName} from saved repository`, "info");
}

function updateSaveCityButtonState() {
    if (!STATE.currentWeather || !DOM.saveCityBtn) return;
    const name = STATE.currentWeather.name;
    const isSaved = STATE.savedCities.some(c => c.name.toLowerCase() === name.toLowerCase());

    DOM.saveCityBtn.classList.toggle("saved-active", isSaved);
    DOM.saveCityIcon.textContent = isSaved ? "♥" : "♡";
    DOM.saveCityText.textContent = isSaved ? "Saved" : "Save";
}

DOM.saveCityBtn?.addEventListener("click", toggleSaveCurrentCity);
DOM.saveCurrentCityDirectBtn?.addEventListener("click", toggleSaveCurrentCity);

/* ==========================================================================
   VIEW 5: RECENT SEARCHES & LOCALSTORAGE CACHING
   ========================================================================== */

function recordRecentSearch(data) {
    const item = {
        name: data.name,
        country: data.sys.country,
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main
    };

    STATE.recentCities = STATE.recentCities.filter(c => c.name.toLowerCase() !== item.name.toLowerCase());
    STATE.recentCities.unshift(item);
    if (STATE.recentCities.length > CONFIG.RECENT_MAX) {
        STATE.recentCities = STATE.recentCities.slice(0, CONFIG.RECENT_MAX);
    }

    localStorage.setItem("aeris_recent_cities", JSON.stringify(STATE.recentCities));
    renderRecentCities();
}

function renderRecentCities() {
    if (!DOM.recentCitiesContainer) return;
    DOM.recentCitiesContainer.innerHTML = "";

    if (STATE.recentCities.length === 0) {
        DOM.recentCitiesContainer.innerHTML = `
            <div style="padding: 8px 12px; color: var(--text-tertiary); font-size: 11px;">
                No recent searches logged.
            </div>
        `;
        return;
    }

    STATE.recentCities.forEach(city => {
        const btn = document.createElement("button");
        btn.className = "recent-city-chip";
        btn.type = "button";
        btn.innerHTML = `
            <div class="recent-city-info">
                <strong>${sanitizeHTML(city.name)}</strong>
                <span>${sanitizeHTML(city.country)} • ${city.temp}°</span>
            </div>
            <div class="recent-city-weather">
                ${getWeatherEmoji(city.condition)}
            </div>
        `;

        btn.addEventListener("click", () => {
            DOM.cityInput.value = city.name;
            executeWeatherTelemetry(city.name);
        });

        DOM.recentCitiesContainer.appendChild(btn);
    });
}

DOM.clearRecent?.addEventListener("click", () => {
    STATE.recentCities = [];
    localStorage.removeItem("aeris_recent_cities");
    renderRecentCities();
    showToast("Recent searches registry cleared", "info");
});

/* ==========================================================================
   VIEW SWITCHING ROUTER
   ========================================================================== */

function switchView(viewName) {
    STATE.activeView = viewName;

    // Update Sidebar Navigation state
    DOM.navItems.forEach(item => {
        const targetView = item.dataset.view;
        item.classList.toggle("active", targetView === viewName);
    });

    // Update Visible View Container
    Object.keys(DOM.views).forEach(key => {
        const container = DOM.views[key];
        if (container) {
            if (key === viewName) {
                container.classList.remove("hidden");
                container.classList.add("active");
            } else {
                container.classList.add("hidden");
                container.classList.remove("active");
            }
        }
    });

    // Trigger view-specific synchronizations
    if (viewName === "map") {
        setTimeout(() => syncWeatherMap(), 150);
    } else if (viewName === "saved") {
        renderSavedCities();
    } else if (viewName === "forecast") {
        renderForecastDetailedView();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

DOM.navItems.forEach(item => {
    item.addEventListener("click", () => {
        const view = item.dataset.view;
        if (view) switchView(view);
    });
});

DOM.gotoForecastViewBtn?.addEventListener("click", () => switchView("forecast"));

/* ==========================================================================
   SEARCH, AUTOCOMPLETE & GEOLOCATION
   ========================================================================== */

// Form Submission
DOM.searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = DOM.cityInput.value.trim();
    if (!query) {
        showError("Invalid Input", "Please provide a valid city name.");
        return;
    }
    closeAutocomplete();
    executeWeatherTelemetry(query);
});

// Quick probe pills
DOM.quickPills.forEach(pill => {
    pill.addEventListener("click", () => {
        const city = pill.dataset.city;
        DOM.cityInput.value = city;
        closeAutocomplete();
        executeWeatherTelemetry(city);
    });
});

// Geolocation GPS detection
DOM.geoBtn?.addEventListener("click", () => {
    if (!navigator.geolocation) {
        showError("Geolocation Unavailable", "Browser does not support geolocation positioning.");
        return;
    }

    showLoading("Acquiring GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const coords = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };
            executeWeatherTelemetry(null, coords);
        },
        (error) => {
            hideLoading();
            console.warn("Geolocation denied or failed:", error);
            showError("Location Access Denied", "Location access wasn't granted. You can search for a city manually.");
        },
        { timeout: 10000, enableHighAccuracy: true }
    );
});

// Autocomplete debounced live suggestions
let debounceTimer = null;
DOM.cityInput?.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    clearTimeout(debounceTimer);

    if (val.length < 3) {
        closeAutocomplete();
        return;
    }

    debounceTimer = setTimeout(async () => {
        try {
            const key = getActiveApiKey();
            const url = `${CONFIG.ENDPOINTS.GEOCODING}?q=${encodeURIComponent(val)}&limit=5&appid=${key}`;
            const suggestions = await fetchAPI(url);
            renderAutocomplete(suggestions);
        } catch (err) {
            console.warn("Geocoding suggestions error:", err);
            closeAutocomplete();
        }
    }, 350);
});

function renderAutocomplete(list) {
    if (!list || !list.length) {
        closeAutocomplete();
        return;
    }

    DOM.searchDropdown.innerHTML = "";
    list.forEach(item => {
        const row = document.createElement("div");
        row.className = "suggestion-item";
        row.innerHTML = `
            <span class="suggestion-name">${sanitizeHTML(item.name)}</span>
            <span class="suggestion-meta">${sanitizeHTML(item.state ? item.state + ", " : "")}${sanitizeHTML(item.country)}</span>
        `;

        row.addEventListener("click", () => {
            DOM.cityInput.value = item.name;
            closeAutocomplete();
            executeWeatherTelemetry(item.name);
        });

        DOM.searchDropdown.appendChild(row);
    });

    DOM.searchDropdown.classList.remove("hidden");
}

function closeAutocomplete() {
    if (DOM.searchDropdown) DOM.searchDropdown.classList.add("hidden");
}

document.addEventListener("click", (e) => {
    if (!e.target.closest("#searchBoxOuter")) {
        closeAutocomplete();
    }
});

/* ==========================================================================
   UNIT TOGGLE & LIVE TELEMETRY CONVERSION
   ========================================================================== */

function setUnit(newUnit) {
    if (STATE.unit === newUnit) return;
    STATE.unit = newUnit;
    localStorage.setItem("aeris_unit", newUnit);

    DOM.celsiusBtn.classList.toggle("active", newUnit === "metric");
    DOM.celsiusBtn.setAttribute("aria-pressed", newUnit === "metric");
    DOM.fahrenheitBtn.classList.toggle("active", newUnit === "imperial");
    DOM.fahrenheitBtn.setAttribute("aria-pressed", newUnit === "imperial");
    if (DOM.settingUnitSelect) DOM.settingUnitSelect.value = newUnit;

    // Refresh weather data with converted units
    if (STATE.activeCity) {
        executeWeatherTelemetry(STATE.activeCity);
    }
}

DOM.celsiusBtn?.addEventListener("click", () => setUnit("metric"));
DOM.fahrenheitBtn?.addEventListener("click", () => setUnit("imperial"));
DOM.settingUnitSelect?.addEventListener("change", (e) => setUnit(e.target.value));

DOM.refreshWeatherBtn?.addEventListener("click", () => {
    if (STATE.activeCity) {
        executeWeatherTelemetry(STATE.activeCity);
    }
});

/* ==========================================================================
   SETTINGS & AUTOMATED BACKGROUND POLLING
   ========================================================================== */

function initSettings() {
    // Theme select
    if (DOM.settingThemeSelect) {
        DOM.settingThemeSelect.value = STATE.theme;
        document.body.setAttribute("data-theme", STATE.theme);
        DOM.settingThemeSelect.addEventListener("change", (e) => {
            STATE.theme = e.target.value;
            localStorage.setItem("aeris_theme", STATE.theme);
            document.body.setAttribute("data-theme", STATE.theme);
            showToast(`Theme changed to ${STATE.theme}`, "info");
        });
    }

    // Animation toggle
    if (DOM.settingAnimToggle) {
        DOM.settingAnimToggle.checked = STATE.animationsEnabled;
        document.body.setAttribute("data-animations", STATE.animationsEnabled ? "true" : "false");
        DOM.settingAnimToggle.addEventListener("change", (e) => {
            STATE.animationsEnabled = e.target.checked;
            localStorage.setItem("aeris_animations", STATE.animationsEnabled ? "true" : "false");
            document.body.setAttribute("data-animations", STATE.animationsEnabled ? "true" : "false");
            AtmosphericEngine.createParticles();
            showToast(`Animations ${STATE.animationsEnabled ? "enabled" : "disabled"}`, "info");
        });
    }

    // Auto Refresh toggle
    if (DOM.settingAutoRefreshToggle) {
        DOM.settingAutoRefreshToggle.checked = STATE.autoRefreshEnabled;
        DOM.settingAutoRefreshToggle.addEventListener("change", (e) => {
            STATE.autoRefreshEnabled = e.target.checked;
            localStorage.setItem("aeris_auto_refresh", STATE.autoRefreshEnabled ? "true" : "false");
            setupAutoRefreshTimer();
            showToast(`Auto refresh ${STATE.autoRefreshEnabled ? "enabled" : "disabled"}`, "info");
        });
    }

    // Interval select
    if (DOM.settingIntervalSelect) {
        DOM.settingIntervalSelect.value = STATE.refreshIntervalMs.toString();
        DOM.settingIntervalSelect.addEventListener("change", (e) => {
            STATE.refreshIntervalMs = parseInt(e.target.value, 10);
            localStorage.setItem("aeris_refresh_interval", STATE.refreshIntervalMs.toString());
            setupAutoRefreshTimer();
            showToast(`Auto refresh interval updated`, "info");
        });
    }

    // Flush Local Storage
    DOM.btnFlushLocalStorage?.addEventListener("click", () => {
        if (confirm("Reset all saved cities, settings, and telemetry cache?")) {
            localStorage.clear();
            showToast("Local data flushed. Reloading...", "info");
            setTimeout(() => window.location.reload(), 1000);
        }
    });

    // Custom API Key override
    if (DOM.settingApiKeyInput) {
        DOM.settingApiKeyInput.value = localStorage.getItem("aeris_api_key_override") || "";
    }
    DOM.btnSaveApiKey?.addEventListener("click", () => {
        const val = DOM.settingApiKeyInput.value.trim();
        if (val) {
            localStorage.setItem("aeris_api_key_override", val);
            showToast("API Key updated. Refreshing telemetry...", "success");
            executeWeatherTelemetry(STATE.activeCity);
        } else {
            localStorage.removeItem("aeris_api_key_override");
            showToast("Reset to default configuration key.", "info");
        }
    });

    setupAutoRefreshTimer();
}

function setupAutoRefreshTimer() {
    if (STATE.autoRefreshTimer) {
        clearInterval(STATE.autoRefreshTimer);
        STATE.autoRefreshTimer = null;
    }

    const mins = Math.round(STATE.refreshIntervalMs / 60000);
    if (DOM.autoRefreshStatusText) {
        DOM.autoRefreshStatusText.textContent = STATE.autoRefreshEnabled
            ? `Auto-Refresh: ${mins}m`
            : "Auto-Refresh: OFF";
    }

    if (STATE.autoRefreshEnabled) {
        STATE.autoRefreshTimer = setInterval(() => {
            if (STATE.activeCity && !STATE.isFetching) {
                console.log(`[AERIS Daemon] Executing periodic refresh for ${STATE.activeCity}`);
                executeWeatherTelemetry(STATE.activeCity);
            }
        }, STATE.refreshIntervalMs);
    }
}

/* ==========================================================================
   DYNAMIC CLOCKS & ATMOSPHERIC THEMES
   ========================================================================== */

function startLocalStationClock(timezoneOffsetSec) {
    if (STATE.clockTimer) clearInterval(STATE.clockTimer);

    const updateClock = () => {
        const now = new Date();
        const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
        const stationTime = new Date(utcMs + timezoneOffsetSec * 1000);

        DOM.currentTime.textContent = stationTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });

        DOM.currentDate.textContent = stationTime.toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "short"
        });

        const offsetHours = timezoneOffsetSec / 3600;
        DOM.cityTimezoneOffset.textContent = `UTC${offsetHours >= 0 ? "+" : ""}${offsetHours}`;
    };

    updateClock();
    STATE.clockTimer = setInterval(updateClock, 1000);
}

function updateThemeAtmosphere() {
    if (!STATE.currentWeather) return;

    const condition = STATE.currentWeather.weather[0].main;
    const isNight = STATE.currentWeather.weather[0].icon.endsWith("n");

    // Remove all weather modifier classes
    document.body.classList.remove(
        "weather-clear", "weather-rain", "weather-thunderstorm",
        "weather-snow", "weather-night", "weather-clouds"
    );

    let activeClass = "weather-clear";
    if (isNight) activeClass = "weather-night";
    else if (condition === "Rain" || condition === "Drizzle") activeClass = "weather-rain";
    else if (condition === "Thunderstorm") activeClass = "weather-thunderstorm";
    else if (condition === "Snow") activeClass = "weather-snow";
    else if (condition === "Clouds") activeClass = "weather-clouds";

    document.body.classList.add(activeClass);
    AtmosphericEngine.setCondition(condition, isNight);
}

/* ==========================================================================
   UTILITIES & METEOROLOGICAL HELPERS
   ========================================================================== */

function aggregateForecastByDay(forecastList) {
    const daysMap = {};

    forecastList.forEach(item => {
        const dateObj = new Date(item.dt * 1000);
        const dayKey = dateObj.toISOString().split("T")[0];

        if (!daysMap[dayKey]) {
            daysMap[dayKey] = {
                dayName: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
                dateFormatted: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                temps: [],
                conditions: {},
                rawSlices: []
            };
        }

        daysMap[dayKey].temps.push(item.main.temp);
        daysMap[dayKey].rawSlices.push(item);

        const cond = item.weather[0].main;
        daysMap[dayKey].conditions[cond] = (daysMap[dayKey].conditions[cond] || 0) + 1;
    });

    return Object.values(daysMap).map(d => {
        let dominantCond = "Clear";
        let maxCount = 0;
        Object.entries(d.conditions).forEach(([c, cnt]) => {
            if (cnt > maxCount) {
                dominantCond = c;
                maxCount = cnt;
            }
        });

        return {
            dayName: d.dayName,
            dateFormatted: d.dateFormatted,
            maxTemp: Math.round(Math.max(...d.temps)),
            minTemp: Math.round(Math.min(...d.temps)),
            condition: dominantCond,
            iconEmoji: getWeatherEmoji(dominantCond, "01d"),
            rawSlices: d.rawSlices
        };
    });
}

function getWeatherEmoji(condition, icon = "") {
    const isNight = icon.endsWith("n");
    if (condition === "Clear") return isNight ? "☾" : "☀";
    if (condition === "Clouds") return "☁";
    if (condition === "Rain" || condition === "Drizzle") return "🌧";
    if (condition === "Thunderstorm") return "⛈";
    if (condition === "Snow") return "❄";
    if (condition === "Mist" || condition === "Fog" || condition === "Haze") return "🌫";
    return "☁";
}

function getWindDirectionCompass(deg) {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const index = Math.round(((deg || 0) % 360) / 22.5);
    return directions[index % 16];
}

function getBeaufortScale(speed) {
    if (speed < 0.5) return 0;
    if (speed < 1.6) return 1;
    if (speed < 3.4) return 2;
    if (speed < 5.5) return 3;
    if (speed < 8.0) return 4;
    if (speed < 10.8) return 5;
    if (speed < 13.9) return 6;
    if (speed < 17.2) return 7;
    return 8;
}

function getBeaufortDescription(speed) {
    const scale = getBeaufortScale(speed);
    const descriptions = [
        "Calm (Mirror Sea)", "Light Air", "Light Breeze",
        "Gentle Breeze", "Moderate Breeze", "Fresh Breeze",
        "Strong Breeze", "High Wind / Moderate Gale", "Gale Force"
    ];
    return descriptions[scale] || "Extreme Wind";
}

function formatUTCTimestamp(epoch, offsetSec) {
    const date = new Date((epoch + offsetSec) * 1000);
    return date.toISOString().substring(11, 16);
}

function capitalizeWords(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
}

function sanitizeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
}

function generateAtmosphericNarrative(condition, main) {
    if (condition === "Clear") return "Minimal tropospheric obstruction. High solar radiance index.";
    if (condition === "Rain") return "Active surface condensation and convective precipitation fronts.";
    if (condition === "Thunderstorm") return "High electromagnetic turbulence with strong convective updrafts.";
    if (condition === "Snow") return "Freezing isotherm descending with cryosphere accumulation.";
    if (condition === "Clouds") return "Moderate altocumulus layers moderating solar radiation.";
    return "Stable ambient pressure gradient with balanced relative moisture.";
}

function getCountryName(code) {
    const list = {
        IN: "India", US: "United States", GB: "United Kingdom",
        JP: "Japan", DE: "Germany", FR: "France", CA: "Canada",
        AU: "Australia", BR: "Brazil", CN: "China", AE: "United Arab Emirates",
        IS: "Iceland", SG: "Singapore"
    };
    return list[code] || code || "International";
}

/* ==========================================================================
   INITIALIZATION BOOTSTRAPPER
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    console.log("%c AERIS NEURAL CORE v2.5 INITIALIZING ", "background: #020712; color: #41d5ff; font-weight: bold; border: 1px solid #41d5ff; padding: 4px;");

    // Initialize atmospheric dynamic canvas
    AtmosphericEngine.init();

    // Initialize telemetry settings and preferences
    initSettings();

    // Render persisted registries
    renderRecentCities();
    renderSavedCities();

    // Set initial unit UI
    DOM.celsiusBtn.classList.toggle("active", STATE.unit === "metric");
    DOM.fahrenheitBtn.classList.toggle("active", STATE.unit === "imperial");

    // Sync active basemap button on load
    if (DOM.mapTypeButtons) {
        DOM.mapTypeButtons.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.mapType === STATE.activeBasemap);
        });
    }

    // Attempt geolocation on initial boot if permission is already granted, else load default city
    if (navigator.geolocation && navigator.permissions) {
        navigator.permissions.query({ name: "geolocation" }).then(res => {
            if (res.state === "granted") {
                navigator.geolocation.getCurrentPosition(
                    pos => {
                        executeWeatherTelemetry(null, {
                            lat: pos.coords.latitude,
                            lon: pos.coords.longitude
                        });
                    },
                    () => executeWeatherTelemetry(STATE.activeCity),
                    { timeout: 5000, enableHighAccuracy: true }
                );
            } else {
                executeWeatherTelemetry(STATE.activeCity);
            }
        }).catch(() => {
            executeWeatherTelemetry(STATE.activeCity);
        });
    } else {
        // Execute Initial Telemetry Boot with default city
        executeWeatherTelemetry(STATE.activeCity);
    }
});