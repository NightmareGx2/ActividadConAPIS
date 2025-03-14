
const API_KEY = '4d8fb5b93d4af21d66a2948710284366';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const ICON_URL = 'https://openweathermap.org/img/wn/';


const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const errorMessage = document.getElementById('error-message');
const loader = document.getElementById('loader');
const cityName = document.getElementById('city-name');
const dateTime = document.getElementById('date-time');
const currentTemp = document.getElementById('current-temp');
const weatherIcon = document.getElementById('weather-icon');
const weatherDescription = document.getElementById('weather-description');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const forecast = document.getElementById('forecast');
const cityList = document.getElementById('city-list');
const uvMarker = document.getElementById('uv-marker');


const popularCities = [
    { name: 'Nueva York', country: 'US' },
    { name: 'Londres', country: 'GB' },
    { name: 'Tokyo', country: 'JP' },
    { name: 'Paris', country: 'FR' },
    { name: 'Sydney', country: 'AU' },
    { name: 'Ciudad de México', country: 'MX' }
];


window.addEventListener('DOMContentLoaded', () => {
  
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoordinates(latitude, longitude);
            },
            error => {
               
                getWeatherByCity('Madrid');
            }
        );
    } else {
     
        getWeatherByCity('Madrid');
    }

    
    loadPopularCities();
});


searchButton.addEventListener('click', () => {
    searchCity();
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchCity();
    }
});


function showLoader() {
    loader.style.display = 'block';
    errorMessage.style.display = 'none';
}

function hideLoader() {
    loader.style.display = 'none';
}

function showError() {
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function searchCity() {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherByCity(city);
    }
}

async function getWeatherByCity(city) {
    showLoader();
    try {
      
        const weatherResponse = await fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}&lang=es`);
        
        if (!weatherResponse.ok) {
            throw new Error('Ciudad no encontrada');
        }
        
        const weatherData = await weatherResponse.json();
        
   
        const forecastResponse = await fetch(`${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}&lang=es`);
        const forecastData = await forecastResponse.json();
        
    
        const { lat, lon } = weatherData.coord;
        const uvResponse = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&units=metric&appid=${API_KEY}`);
        const uvData = await uvResponse.json();
        

        updateCurrentWeather(weatherData, uvData);
        updateForecast(forecastData);
        hideLoader();
        hideError();
        
    } catch (error) {
        console.error('Error:', error);
        hideLoader();
        showError();
    }
}

async function getWeatherByCoordinates(lat, lon) {
    showLoader();
    try {
      
        const weatherResponse = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=es`);
        const weatherData = await weatherResponse.json();
        
      
        const forecastResponse = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=es`);
        const forecastData = await forecastResponse.json();
        
        
        const uvResponse = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&units=metric&appid=${API_KEY}`);
        const uvData = await uvResponse.json();
        
     
        updateCurrentWeather(weatherData, uvData);
        updateForecast(forecastData);
        hideLoader();
        hideError();
        
    } catch (error) {
        console.error('Error:', error);
        hideLoader();
        showError();
    }
}

function updateCurrentWeather(data, uvData) {
    
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    
 
    const timestamp = data.dt * 1000; 
    const date = new Date(timestamp);
    dateTime.textContent = date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
  
    currentTemp.textContent = Math.round(data.main.temp);
    feelsLike.textContent = Math.round(data.main.feels_like);
    
 
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `${ICON_URL}${iconCode}@2x.png`;
    weatherDescription.textContent = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
    
    
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // Convertir m/s a km/h
    pressure.textContent = `${data.main.pressure} hPa`;
    visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    
    
    const sunriseTime = new Date(data.sys.sunrise * 1000);
    const sunsetTime = new Date(data.sys.sunset * 1000);
    sunrise.textContent = sunriseTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    sunset.textContent = sunsetTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
  
    if (uvData && uvData.current && uvData.current.uvi !== undefined) {
        const uvIndex = uvData.current.uvi;
        const uvPercentage = Math.min(uvIndex / 12 * 100, 100); // 0-12 escala
        uvMarker.style.left = `${uvPercentage}%`;
    }
}

function updateForecast(data) {
    forecast.innerHTML = '';
    
   
    const dailyForecasts = {};
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('es-ES', { weekday: 'short' });
        const hour = date.getHours();
        
      
        if (hour >= 9 && hour <= 15) {
            if (!dailyForecasts[day] || Math.abs(hour - 12) < Math.abs(dailyForecasts[day].hour - 12)) {
                dailyForecasts[day] = {
                    data: item,
                    hour: hour
                };
            }
        }
    });
    
   
    Object.keys(dailyForecasts).slice(0, 5).forEach(day => {
        const item = dailyForecasts[day].data;
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
        const temp = Math.round(item.main.temp);
        const iconCode = item.weather[0].icon;
        
        forecastCard.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <img src="${ICON_URL}${iconCode}.png" alt="Clima" class="forecast-icon">
            <div class="forecast-temp">${temp}°C</div>
        `;
        
        forecast.appendChild(forecastCard);
    });
}

async function loadPopularCities() {
    try {
        
        const promises = popularCities.map(city => 
            fetch(`${BASE_URL}/weather?q=${city.name},${city.country}&units=metric&appid=${API_KEY}`)
            .then(response => response.json())
        );
        
        const results = await Promise.all(promises);
        
        cityList.innerHTML = '';
        
        results.forEach(data => {
            const cityItem = document.createElement('li');
            cityItem.className = 'city-item';
            
            const temp = Math.round(data.main.temp);
            const iconCode = data.weather[0].icon;
            
            cityItem.innerHTML = `
                <div class="city-info">
                    <img src="${ICON_URL}${iconCode}.png" alt="Clima" class="city-icon">
                    <span class="city-name">${data.name}</span>
                </div>
                <span class="city-temp">${temp}°C</span>
            `;
            
            cityItem.addEventListener('click', () => {
                getWeatherByCity(data.name);
            });
            
            cityList.appendChild(cityItem);
        });
        
    } catch (error) {
        console.error('Error al cargar ciudades populares:', error);
    }
}