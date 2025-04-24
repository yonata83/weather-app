const API_KEY = 'a1a5213cce61fbae1f676b98b3dcf525';
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const cityElement = document.getElementById('city');
const tempElement = document.getElementById('temp');
const weatherIcon = document.getElementById('weather-icon');
const weatherDesc = document.getElementById('weather-desc');
const humidityElement = document.getElementById('humidity');
const windSpeedElement = document.getElementById('wind-speed');
const citySelectionContainer = document.getElementById('city-selection');
const cityOptionsContainer = document.getElementById('city-options');
const themeSwitch = document.getElementById('theme-switch');
const tempToggle = document.getElementById('temp-toggle');
const sunriseElement = document.getElementById('sunrise');
const sunsetElement = document.getElementById('sunset');
const weatherBackground = document.querySelector('.weather-background');

let currentTemp = 0;
let isMetric = true;

// Theme toggle
themeSwitch.addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeSwitch.innerHTML = `<i class="fas fa-${isDark ? 'moon' : 'sun'}"></i>`;
});

// Temperature toggle
tempToggle.addEventListener('click', () => {
    isMetric = !isMetric;
    const temp = isMetric ? currentTemp : (currentTemp * 9/5) + 32;
    tempElement.textContent = `${Math.round(temp)}°${isMetric ? 'C' : 'F'}`;
    tempToggle.textContent = `Switch to °${isMetric ? 'F' : 'C'}`;
});

// Weather icon mapping
const weatherIcons = {
    'Clear': 'fa-sun',                    // Clear sky
    'Clouds': 'fa-cloud',                 // Cloudy conditions
    'Rain': 'fa-cloud-rain',              // Rainy conditions
    'Snow': 'fa-snowflake',               // Snowy conditions
    'Thunderstorm': 'fa-bolt',            // Thunderstorm
    'Drizzle': 'fa-cloud-rain',           // Light rain/drizzle
    'Mist': 'fa-smog',                    // Misty conditions
    'Fog': 'fa-smog',                     // Foggy conditions
    'Haze': 'fa-smog',                    // Hazy conditions
    'Dust': 'fa-wind',                    // Dusty conditions
    'Sand': 'fa-wind',                    // Sandy conditions
    'Ash': 'fa-smog',                     // Volcanic ash
    'Squall': 'fa-wind',                  // Strong winds
    'Tornado': 'fa-tornado',              // Tornado
    'Few clouds': 'fa-cloud-sun',         // Partly cloudy
    'Scattered clouds': 'fa-cloud-sun',   // Scattered clouds
    'Broken clouds': 'fa-cloud',          // Mostly cloudy
    'Overcast clouds': 'fa-cloud'         // Completely cloudy
};

// Function to update weather background
function updateWeatherBackground(weatherMain) {
    weatherBackground.className = 'weather-background';
    
    switch(weatherMain) {
        case 'Clear':
            weatherBackground.classList.add('clear-sky');
            break;
        case 'Rain':
        case 'Drizzle':
            weatherBackground.classList.add('rain');
            break;
        case 'Snow':
            weatherBackground.classList.add('snow');
            break;
        case 'Thunderstorm':
            weatherBackground.classList.add('thunderstorm');
            break;
    }
}

// Function to format time
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Function to get coordinates from location name
async function getCoordinates(location) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=5&appid=${API_KEY}`
        );
        const data = await response.json();
        
        if (data.length === 0) {
            throw new Error('Location not found');
        }
        
        if (data.length === 1) {
            citySelectionContainer.style.display = 'none';
            return {
                lat: data[0].lat,
                lon: data[0].lon,
                name: `${data[0].name}, ${data[0].country}`
            };
        }
        
        // Show city selection if multiple results
        showCityOptions(data);
        return null;
    } catch (error) {
        console.error('Error getting coordinates:', error);
        alert('Could not find the location. Please try again.');
        throw error;
    }
}

// Function to show city options
function showCityOptions(cities) {
    cityOptionsContainer.innerHTML = '';
    citySelectionContainer.style.display = 'block';
    
    cities.forEach(city => {
        const cityOption = document.createElement('div');
        cityOption.className = 'city-option';
        
        const statePart = city.state ? `, ${city.state}` : '';
        cityOption.innerHTML = `
            <span class="city-name">${city.name}${statePart}</span>
            <span class="country">${city.country}</span>
        `;
        
        cityOption.addEventListener('click', async () => {
            try {
                const weatherData = await getWeatherData(city.lat, city.lon);
                updateUI(weatherData, `${city.name}, ${city.country}`);
                citySelectionContainer.style.display = 'none';
                
                // Save to previous searches
                savePreviousSearch(`${city.name}, ${city.country}`);
            } catch (error) {
                // Error handling is done in getWeatherData
            }
        });
        
        cityOptionsContainer.appendChild(cityOption);
    });
}

// Function to save previous search
function savePreviousSearch(cityName) {
    let searches = JSON.parse(localStorage.getItem('previousSearches') || '[]');
    if (!searches.includes(cityName)) {
        searches.unshift(cityName);
        searches = searches.slice(0, 5); // Keep only last 5 searches
        localStorage.setItem('previousSearches', JSON.stringify(searches));
        updatePreviousSearches();
    }
}

// Function to update previous searches display
function updatePreviousSearches() {
    const searches = JSON.parse(localStorage.getItem('previousSearches') || '[]');
    const container = document.getElementById('previous-searches-list');
    container.innerHTML = '';
    
    searches.forEach(city => {
        const searchItem = document.createElement('div');
        searchItem.className = 'previous-search-item';
        searchItem.textContent = city;
        searchItem.addEventListener('click', () => {
            locationInput.value = city;
            searchBtn.click();
        });
        container.appendChild(searchItem);
    });
}

// Function to get weather data
async function getWeatherData(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting weather data:', error);
        alert('Could not fetch weather data. Please try again later.');
        throw error;
    }
}

// Function to update sun position
function updateSunPosition(sunrise, sunset) {
    const sunIndicator = document.querySelector('.sun-indicator');
    
    // Reset classes
    sunIndicator.classList.remove('day', 'sunset', 'night');
    
    const now = new Date().getTime() / 1000;
    const hour = new Date().getHours();
    
    // Determine the sun's state based on time of day
    if (hour >= 6 && hour < 8) { // Sunrise
        sunIndicator.classList.add('sunset');
    } else if (hour >= 8 && hour < 17) { // Day
        sunIndicator.classList.add('day');
    } else if (hour >= 17 && hour < 19) { // Sunset
        sunIndicator.classList.add('sunset');
    } else { // Night
        sunIndicator.classList.add('night');
    }
}

// Function to update the UI
function updateUI(weatherData, cityName) {
    const mainWeather = weatherData.weather[0].main;
    currentTemp = weatherData.main.temp;
    
    // Clear city selection
    citySelectionContainer.style.display = 'none';
    cityOptionsContainer.innerHTML = '';
    
    cityElement.textContent = cityName;
    tempElement.textContent = `${Math.round(currentTemp)}°${isMetric ? 'C' : 'F'}`;
    
    // Update weather icon and description
    weatherIcon.className = 'fas';
    weatherIcon.classList.add(weatherIcons[mainWeather] || 'fa-cloud');
    weatherDesc.textContent = weatherData.weather[0].description;
    
    // Update humidity and wind speed
    const humidityHtml = `
        <div class="info-item">
            <i class="fas fa-tint"></i>
            <div>
                <p>Humidity</p>
                <span>${weatherData.main.humidity}%</span>
            </div>
        </div>`;
    
    const windHtml = `
        <div class="info-item">
            <i class="fas fa-wind"></i>
            <div>
                <p>Wind Speed</p>
                <span>${Math.round(weatherData.wind.speed * 3.6)} km/h</span>
            </div>
        </div>`;
    
    const sunriseHtml = `
        <div class="info-item">
            <i class="fas fa-sun fa-rise"></i>
            <div>
                <p>Sunrise</p>
                <span>${formatTime(weatherData.sys.sunrise)}</span>
            </div>
        </div>`;
    
    const sunsetHtml = `
        <div class="info-item">
            <i class="fas fa-sun fa-set"></i>
            <div>
                <p>Sunset</p>
                <span>${formatTime(weatherData.sys.sunset)}</span>
            </div>
        </div>`;
    
    document.querySelector('.info-container').innerHTML = 
        humidityHtml + windHtml + sunriseHtml + sunsetHtml;
    
    // Update weather background
    updateWeatherBackground(mainWeather);
    
    // Update last updated time
    document.getElementById('last-updated').textContent = 
        `Last updated: ${new Date().toLocaleTimeString()}`;
}

// Event listener for search button
searchBtn.addEventListener('click', async () => {
    const location = locationInput.value.trim();
    
    if (!location) {
        alert('Please enter a location');
        return;
    }
    
    try {
        const coordinates = await getCoordinates(location);
        if (coordinates) { // Only proceed if a single city was found
            const weatherData = await getWeatherData(coordinates.lat, coordinates.lon);
            updateUI(weatherData, coordinates.name);
            savePreviousSearch(coordinates.name);
        }
    } catch (error) {
        // Error handling is done in the respective functions
    }
});

// Event listener for Enter key
locationInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchBtn.click();
    }
});

// Load previous searches on page load
updatePreviousSearches();

// Initial location (optional) - you can remove this if you want
window.addEventListener('load', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const weatherData = await getWeatherData(
                    position.coords.latitude,
                    position.coords.longitude
                );
                
                // Get city name from coordinates
                const response = await fetch(
                    `https://api.openweathermap.org/geo/1.0/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&limit=1&appid=${API_KEY}`
                );
                const data = await response.json();
                const cityName = `${data[0].name}, ${data[0].country}`;
                
                updateUI(weatherData, cityName);
                savePreviousSearch(cityName);
            } catch (error) {
                // Error handling is done in the respective functions
            }
        });
    }
}); 