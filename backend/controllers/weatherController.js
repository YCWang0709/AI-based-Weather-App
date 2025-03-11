const axios = require("axios");

exports.getWeather = async (req, res) => {
    const { lat, lon } = req.query;
    const API_KEY = process.env.WEATHER_API_KEY;

    if (!lat || !lon) {
        return res.status(400).json({ message: "Latitude and Longitude are required" });
    }

    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        res.json(response.data);
    } catch (error) {
        console.error("OpenWeather API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Error fetching weather data", error: error.response ? error.response.data : error.message });
    }
};
