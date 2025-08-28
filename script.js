const apiKey = "79c69249ae6a033c2d3355c96ce0f181"; // 🔑 Get it from https://openweathermap.org/

const historyList = document.getElementById("historyList");

// Fetch weather by city
async function getWeather(city = null, lat = null, lon = null) {
  const weatherDiv = document.getElementById("weatherResult");
  const forecastDiv = document.getElementById("forecast");
  const loader = document.getElementById("loader");

  loader.style.display = "block";
  weatherDiv.innerHTML = "";
  forecastDiv.innerHTML = "";

  let url = "";
  if (city) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  } else if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("City not found!");

    const data = await response.json();
    const { name, coord } = data;
    const { temp, humidity, feels_like } = data.main;
    const { description, icon, main } = data.weather[0];
    const { speed } = data.wind;

    setBackground(main);

    weatherDiv.innerHTML = `
      <h2>${name}</h2>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="Weather icon">
      <p>🌡 Temp: ${temp.toFixed(1)} °C (Feels like ${feels_like.toFixed(1)} °C)</p>
      <p>💧 Humidity: ${humidity}%</p>
      <p>🌬 Wind: ${speed} m/s</p>
      <p>🌥 Condition: ${description}</p>
    `;

    // Save search history
    if (city) saveHistory(city);

    // Fetch 7-day forecast
    getForecast(coord.lat, coord.lon);
  } catch (error) {
    weatherDiv.innerHTML = `<p>${error.message}</p>`;
  } finally {
    loader.style.display = "none";
  }
}

async function getForecast(lat, lon) {
  const forecastDiv = document.getElementById("forecast");
  try {
    // Use forecast API (5 days, every 3 hours)
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Unable to fetch forecast.");

    const data = await res.json();

    // Group by day (pick one forecast per day - e.g., 12:00)
    const dailyData = {};
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const day = date.toLocaleDateString("en-US", { weekday: "short" });
      const hour = date.getHours();
      if (hour === 12 && !dailyData[day]) {
        dailyData[day] = item;
      }
    });

    forecastDiv.innerHTML = Object.values(dailyData)
      .slice(0, 5) // Show 5 days
      .map(day => {
        const date = new Date(day.dt * 1000);
        return `
          <div class="forecast-day">
            <p>${date.toLocaleDateString("en-US", { weekday: "short" })}</p>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png">
            <p>${day.main.temp.toFixed(0)}°C</p>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    forecastDiv.innerHTML = "<p>Unable to fetch forecast.</p>";
  }
}


function getWeatherFromInput() {
  const city = document.getElementById("cityInput").value;
  if (city) getWeather(city);
  else document.getElementById("weatherResult").innerHTML = "<p>Please enter a city name.</p>";
}

function getLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => getWeather(null, pos.coords.latitude, pos.coords.longitude),
      () => alert("Location access denied.")
    );
  } else {
    alert("Geolocation not supported by your browser.");
  }
}

function setBackground(condition) {
  const body = document.body;
  switch (condition.toLowerCase()) {
    case "clear":
      body.style.background = "linear-gradient(to right, #56ccf2, #2f80ed)";
      break;
    case "clouds":
      body.style.background = "linear-gradient(to right, #bdc3c7, #2c3e50)";
      break;
    case "rain":
    case "drizzle":
      body.style.background = "linear-gradient(to right, #4facfe, #00f2fe)";
      break;
    case "snow":
      body.style.background = "linear-gradient(to right, #e6dada, #274046)";
      break;
    case "thunderstorm":
      body.style.background = "linear-gradient(to right, #232526, #414345)";
      break;
    default:
      body.style.background = "linear-gradient(to right, #4facfe, #00f2fe)";
  }
}

// History handling
function saveHistory(city) {
  let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  history = [city, ...history.filter(c => c !== city)].slice(0, 5);
  localStorage.setItem("weatherHistory", JSON.stringify(history));
  loadHistory();
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  historyList.innerHTML = history.map(c => `<li onclick="getWeather('${c}')">${c}</li>`).join("");
}

// Auto refresh every 10 mins
setInterval(() => {
  const city = document.getElementById("cityInput").value;
  if (city) getWeather(city);
}, 600000);

loadHistory();