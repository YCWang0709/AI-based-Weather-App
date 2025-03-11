const mongoose = require("mongoose");

const WeatherDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.Mixed, required: true },  // ObjectId or String allowed
    location: String,
    coordinates: {
        lat: Number,
        lon: Number,
    },
    current_weather: {
        weather: String,
        temperature: Number,
        humidity: Number,
        wind_speed: Number,
    },
    past_weather: [
        {
            date: String,
            temperature_max: Number,
            temperature_min: Number,
            precipitation: Number,
            weather_code: Number,
        },
    ],
    future_weather: [
        {
            date: String,
            weather: String,
            temperature: Number,
            humidity: Number,
            wind_speed: Number,
        },
    ],
    queriedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WeatherData", WeatherDataSchema);
