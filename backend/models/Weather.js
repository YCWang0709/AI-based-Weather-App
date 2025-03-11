// backend/models/Weather.js
const mongoose = require("mongoose");

const WeatherSchema = new mongoose.Schema({
    location: String,
    temperature: Number,
    humidity: Number,
    wind_speed: Number,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Weather", WeatherSchema);