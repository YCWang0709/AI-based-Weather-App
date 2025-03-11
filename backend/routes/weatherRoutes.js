require("dotenv").config();

const express = require("express");
const axios = require("axios");
const WeatherData = require("../models/WeatherData");
const { Parser } = require("json2csv");
const fs = require("fs");

const router = express.Router();
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY;

// get current weather
// openweather API
const getCurrentWeather = async (lat, lon, lang = "en") => {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=${lang}&appid=${WEATHER_API_KEY}`;
        console.log(`Fetching Current Weather: ${url}`);
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching current weather:", error.message);
        return null;
    }
};

// get past three days weather
// Open-meteo API 
const getPastWeather = async (lat, lon) => {
    try {
        const now = new Date();
        let validWeatherData = [];
        let daysChecked = 0;

        while (validWeatherData.length < 3 && daysChecked < 10) { 
            const start_date = new Date(now);
            start_date.setDate(now.getDate() - (daysChecked + 3));
            const end_date = new Date(now);
            end_date.setDate(now.getDate() - daysChecked);

            const start_date_str = start_date.toISOString().split("T")[0];
            const end_date_str = end_date.toISOString().split("T")[0];

            const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${start_date_str}&end_date=${end_date_str}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto`;

            console.log(`Fetching Historical Weather Data from Open-Meteo: ${url}`);

            const response = await axios.get(url);
            console.log("Open-Meteo API Response:", response.data);

            if (!response.data.daily || response.data.daily.time.length === 0) {
                console.error("No past weather data available!");
                return [{ date: "N/A", temperature_max: "No Data", temperature_min: "No Data", precipitation: "No Data", weather_code: "No Data" }];
            }

            // skip "null" and traceback
            const pastWeatherData = response.data.daily.time.map((date, index) => {
                const maxTemp = response.data.daily.temperature_2m_max[index];
                const minTemp = response.data.daily.temperature_2m_min[index];
                const precipitation = response.data.daily.precipitation_sum[index];
                const weatherCode = response.data.daily.weathercode[index];

                // store all "non-null" value
                if (maxTemp !== null && minTemp !== null && weatherCode !== null) {
                    return {
                        date,
                        temperature_max: maxTemp,
                        temperature_min: minTemp,
                        precipitation: precipitation !== null ? precipitation : 0, // default precipitation : 0
                        weather_code: weatherCode,
                    };
                }
                return null;
            }).filter(item => item !== null); // filter item (all null)

            validWeatherData = [...validWeatherData, ...pastWeatherData].slice(0, 3); // last three days weather
            daysChecked += 1; // make sure have at least three days
        }

        return validWeatherData.length > 0 ? validWeatherData : [{ date: "N/A", temperature_max: "No Data", temperature_min: "No Data", precipitation: "No Data", weather_code: "No Data" }];
    } catch (error) {
        console.error("Error fetching past weather from Open-Meteo:", error.response ? error.response.data : error.message);
        return [{ date: "N/A", temperature_max: "No Data", temperature_min: "No Data", precipitation: "No Data", weather_code: "No Data" }];
    }
};


// get future two days weather
// Openweather
const getFutureWeather = async (lat, lon, lang = "en") => {
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=${lang}&appid=${WEATHER_API_KEY}`;
        console.log(`Fetching Future Weather: ${url}`);

        const response = await axios.get(url);

        // get 12:00 weather 
        const futureWeatherData = response.data.list
            .filter((item) => item.dt_txt.includes("12:00:00"))
            .slice(0, 2)
            .map((item) => ({
                date: item.dt_txt.split(" ")[0],
                weather: item.weather[0].description,
                temperature: item.main.temp,
                humidity: item.main.humidity,
                wind_speed: item.wind.speed,
            }));

        return futureWeatherData;
    } catch (error) {
        console.error("Error fetching future weather:", error.message);
        return [];
    }
};

// get weather and store in MongoDB
router.post("/get-weather", async (req, res) => {
    const { lat, lon, lang = "en", userId } = req.body;

    if (!lat || !lon || !userId) {
        return res.status(400).json({ message: "Latitude, longitude, and userId are required!" });
    }

    console.log(`Fetching weather for user ${userId}, lat=${lat}, lon=${lon}`);

    try {
        const currentWeather = await getCurrentWeather(lat, lon, lang);
        if (!currentWeather) {
            return res.status(500).json({ message: "Failed to retrieve current weather data" });
        }

        let pastWeather = await getPastWeather(lat, lon);
        let futureWeather = await getFutureWeather(lat, lon, lang);

        console.log("Raw Past Weather Data (Before Filtering):", pastWeather);

        // filter "null" value
        pastWeather = pastWeather.filter(day => day.temperature_max !== null && day.temperature_min !== null);

        console.log("Filtered Past Weather Data (No Nulls):", pastWeather);

        const windSpeed = (typeof currentWeather.wind?.speed === "number") ? currentWeather.wind.speed : 0;

        const weatherRecord = new WeatherData({
            user: userId,
            location: currentWeather.name || "Unknown",
            coordinates: { lat, lon },
            current_weather: {
                weather: currentWeather.weather?.[0]?.description || "No Data",
                temperature: currentWeather.main?.temp || 0,
                humidity: currentWeather.main?.humidity || 0,
                wind_speed: currentWeather.wind?.speed || 0.7,
            },
            past_weather: pastWeather,  
            future_weather: futureWeather.length > 0 ? futureWeather : [{ date: "N/A", weather: "No Data" }],
            queriedAt: new Date(),
        });

        await weatherRecord.save();

        console.log("Weather data stored in MongoDB:", weatherRecord);
        res.json(weatherRecord);
    } catch (error) {
        console.error("Error fetching or saving weather data:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});


// get weather query history (username, time, location)
router.get("/history", async (req, res) => {
    try {
        const { user, date, location } = req.query;
        let query = {};

        if (user) {
            query.user = user;
        }
        if (date) {
            query.queriedAt = { 
                $gte: new Date(date), 
                $lt: new Date(new Date(date).getTime() + 86400000) 
            };
        }
        if (location) {
            query.location = { $regex: new RegExp(location, "i") }; // Fuzzy search
        }

        let weatherData;
        if (Object.keys(query).length > 0) {
            console.log(`Fetching filtered history: ${JSON.stringify(query)}`);
            weatherData = await WeatherData.find(query).sort({ queriedAt: -1 }).limit(50);
        } else {
            console.log("Fetching recent 10 records...");
            weatherData = await WeatherData.find().sort({ queriedAt: -1 }).limit(10);
        }

        res.json(weatherData);
    } catch (error) {
        console.error("Error fetching weather history:", error.message);
        res.status(500).json({ message: "Error retrieving weather history" });
    }
});

// Add weather record (Manually)
router.post("/", async (req, res) => {
    try {
        const { location, temperature, weather, wind_speed, humidity, userId } = req.body;

        if (!location || !temperature || !weather || !userId) {
            return res.status(400).json({ message: "Location, weather, temperature, and userId are required!" });
        }

        const newWeather = new WeatherData({
            user: userId,
            location,
            coordinates: { lat: 0, lon: 0 }, 
            current_weather: { weather, temperature, wind_speed, humidity },
            past_weather: [],
            future_weather: [],
            queriedAt: new Date(),
        });

        await newWeather.save();
        res.status(201).json(newWeather);
    } catch (error) {
        res.status(500).json({ message: "Error saving weather data." });
    }
});

// Update weather history record (Manually)
router.put("/:id", async (req, res) => {
    try {
        const updatedWeather = await WeatherData.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedWeather) {
            return res.status(404).json({ message: "Record not found." });
        }

        res.json(updatedWeather);
    } catch (error) {
        res.status(500).json({ message: "Error updating weather data." });
    }
});

// Delete weather record
router.delete("/:id", async (req, res) => {
    try {
        const deletedWeather = await WeatherData.findByIdAndDelete(req.params.id);
        if (!deletedWeather) {
            return res.status(404).json({ message: "Record not found." });
        }
        res.json({ message: "Weather record deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting weather data." });
    }
});

// Get city's location
router.get("/get-location", async (req, res) => {
    const { location } = req.query;

    if (!location) {
        return res.status(400).json({ message: "Location name is required!" });
    }

    try {
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${GEOCODING_API_KEY}&limit=1`;
        console.log(`Fetching Coordinates: ${url}`);

        const response = await axios.get(url);
        if (response.data.results.length === 0) {
            return res.status(404).json({ message: "Location not found!" });
        }

        const { lat, lng } = response.data.results[0].geometry;
        res.json({ lat, lon: lng });
    } catch (error) {
        console.error("Error fetching location:", error.message);
        res.status(500).json({ message: "Failed to get location coordinates." });
    }
});

// export database info
router.get("/export", async (req, res) => {
    try {
        const weatherData = await WeatherData.find();
        if (!weatherData || weatherData.length === 0) {
            return res.status(404).json({ message: "No weather data available for export." });
        }

        const fields = ["queriedAt", "location", "current_weather.weather", "current_weather.temperature", "current_weather.wind_speed", "current_weather.humidity"];
        const opts = { fields };
        const parser = new Parser(opts);
        const csv = parser.parse(weatherData);

        res.header("Content-Type", "text/csv");
        res.attachment("weather_data.csv");
        res.send(csv);
    } catch (error) {
        console.error("Error exporting weather data:", error.message);
        res.status(500).json({ message: "Failed to export weather data." });
    }
});

// AI Assistant Travel Recommendation
router.post("/ai-tourism-suggestion", async (req, res) => {
    const { location, weather, temperature, wind_speed, humidity } = req.body;

    if (!location || !weather || !temperature || !wind_speed || !humidity) {
        return res.status(400).json({ message: "Missing required weather information!" });
    }

    console.log(`Fetching AI-generated tourism suggestions for ${location}...`);

    try {
        const response = await axios.post(
            "https://api.deepseek.com/v1/chat/completions",
            {
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "Provide detailed travel recommendations based on the given weather and location. Historical landmarks should be given top priority in recommendations. Up to 300 words and 5 recommendations." },
                    { 
                        role: "user", 
                        content: `I am currently in ${location}. The weather is ${weather}, with a temperature of ${temperature}°C, wind speed ${wind_speed} km/h, and humidity ${humidity}%. Based on this weather, please recommend 5 tourist attractions near this location and provide relevant advice.` 
                    }
                ],
                max_tokens: 400,
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("AI Response:", response.data);
        res.json({ suggestions: response.data.choices[0].message.content });
    } catch (error) {
        console.error("Error fetching AI tourism suggestion:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Failed to generate AI tourism suggestions." });
    }
});

module.exports = router;
