const COUNTRY_API_BASE = "https://restcountries.com/v3.1/name/";
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast?hourly=temperature_2m,rain&forecast_days=1";

const selectElement = document.getElementById('countrySelect');
const loadingOverlay = document.getElementById('loadingOverlay');
const errorBox = document.getElementById('errorBox');
const errorMessage = document.getElementById('errorMessage');

const dataCells = {
    countryName: document.getElementById('countryName'),
    officialName: document.getElementById('officialName'),
    capitalCity: document.getElementById('capitalCity'),
    languagesDisplay: document.getElementById('languagesDisplay'),
    mapLink: document.getElementById('mapLink'),
    populationDisplay: document.getElementById('populationDisplay'),
    flagDisplay: document.getElementById('flagDisplay'),
    latLngDisplay: document.getElementById('latLngDisplay'),
    rainfallDisplay: document.getElementById('rainfallDisplay'),
    tempDisplay: document.getElementById('tempDisplay')
};

// --- Utility Functions ---
function clearAllData() {
    for (const key in dataCells) dataCells[key].innerHTML = '';
    errorBox.classList.add('hidden');
}

function showLoading() {
    loadingOverlay.classList.add('is-loading');
}

function hideLoading() {
    loadingOverlay.classList.remove('is-loading');
}

function handleError(message) {
    errorMessage.textContent = message;
    errorBox.classList.remove('hidden');
    hideLoading();
}

// --- API Calls ---
async function fetchCountryData(countryName) {
    try {
        const response = await fetch(`${COUNTRY_API_BASE}${countryName}`);
        if (!response.ok) throw new Error(`Failed to find data for ${countryName}.`);
        const data = await response.json();
        return data[0];
    } catch (error) {
        console.error("Country API Error:", error);
        handleError(`Could not fetch country details: ${error.message}`);
        return null;
    }
}

async function fetchWeatherData(lat, lng) {
    try {
        const url = `${WEATHER_API_URL}&latitude=${lat}&longitude=${lng}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Weather API returned an error.");
        return await response.json();
    } catch (error) {
        console.error("Weather API Error:", error);
        handleError(`Could not fetch weather data: ${error.message}`);
        return null;
    }
}

function calculateWeatherStats(data) {
    const rain = data.hourly.rain || [];
    const temp = data.hourly.temperature_2m || [];

    const totalRainfall = rain.reduce((sum, v) => sum + v, 0).toFixed(2);
    const totalTemp = temp.reduce((sum, v) => sum + v, 0);
    const avgTemp = (temp.length > 0 ? totalTemp / temp.length : 0).toFixed(1);

    return {
        rainfall: `${totalRainfall} ${data.hourly_units.rain || 'mm'}`,
        temp: `${avgTemp} ${data.hourly_units.temperature_2m || '°C'}`
    };
}

function updateTable(country, weatherStats) {
    const capital = country.capital?.[0] || 'N/A';
    const [lat, lng] = country.latlng || [0, 0];
    const languages = Object.values(country.languages || {}).join(', ') || 'N/A';

    dataCells.countryName.textContent = country.name.common || 'N/A';
    dataCells.officialName.textContent = country.name.official || 'N/A';
    dataCells.capitalCity.textContent = capital;
    dataCells.languagesDisplay.textContent = languages;
    dataCells.populationDisplay.textContent = country.population.toLocaleString() || 'N/A';
    dataCells.mapLink.innerHTML = `<a href="${country.maps.googleMaps}" target="_blank" class="text-blue-600 hover:underline">View Map</a>`;
    dataCells.flagDisplay.innerHTML = `<img src="${country.flags.png}" alt="${country.name.common} flag">`;
    dataCells.latLngDisplay.textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    dataCells.rainfallDisplay.textContent = weatherStats.rainfall;
    dataCells.tempDisplay.textContent = weatherStats.temp;
}

// --- Main Logic ---
async function handleCountrySelect() {
    const selectedCountry = selectElement.value;
    clearAllData();

    if (!selectedCountry) {
        hideLoading();
        return;
    }

    showLoading();

    const countryData = await fetchCountryData(selectedCountry);
    if (!countryData) return;

    const [lat, lng] = countryData.latlng;
    const weatherData = await fetchWeatherData(lat, lng);
    if (!weatherData) return;

    const weatherStats = calculateWeatherStats(weatherData);
    updateTable(countryData, weatherStats);

    hideLoading();
}

selectElement.addEventListener('change', handleCountrySelect);
document.addEventListener('DOMContentLoaded', hideLoading);
