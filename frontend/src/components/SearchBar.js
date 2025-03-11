import React, { useState } from "react";
import axios from "axios";

const SearchBar = ({ setWeatherData }) => {
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [locationInput, setLocationInput] = useState("");
    const [loading, setLoading] = useState(false);

    // get coordinate using lcoation name 
    const fetchCoordinates = async () => {
        if (!locationInput.trim()) {
            alert("Please enter a location.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get("http://localhost:5000/api/weather/get-location", {
                params: { location: locationInput }
            });

            console.log("Location Coordinates:", response.data);
            fetchWeatherByCoords(response.data.lat, response.data.lon);
        } catch (error) {
            console.error("Error fetching coordinates:", error);
            alert("Failed to get location coordinates.");
        }
        setLoading(false);
    };

    // get weather
    const fetchWeatherByCoords = async (lat, lon) => {
        if (!lat || !lon) {
            alert("Please provide valid latitude and longitude!");
            return;
        }

        const userId = localStorage.getItem("userId") || "default-user";

        if (!userId) {
            alert("User not logged in. Please log in to fetch weather data.");
            return;
        }

        setLoading(true);

        try {
            console.log("Sending request to backend...");
            const response = await axios.post("http://localhost:5000/api/weather/get-weather", {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                userId,
                lang: "en",
            });

            console.log("Response from backend:", response.data);
            setWeatherData(response.data);
        } catch (error) {
            console.error("Error fetching weather data:", error.response ? error.response.data : error.message);
            alert("Failed to fetch weather data.");
        } finally {
            setLoading(false);
        }
    };

    // get user's GPS coordinate
    const getLocationWeather = () => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log("GPS Location:", latitude, longitude);
                    fetchWeatherByCoords(latitude, longitude);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("Unable to retrieve your location. Please enter coordinates manually.");
                    setLoading(false);
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    return (
        <div style={styles.container}>
            {/* location name */}
            <div style={styles.inputGroup}>
                <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Enter a city (e.g., New York)"
                    style={styles.input}
                />
                <button onClick={fetchCoordinates} style={styles.button} disabled={loading}>
                    {loading ? "Loading..." : "Search by Location"}
                </button>
            </div>

            {/* coordinate query */}
            <div style={styles.inputGroup}>
                <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Enter latitude (e.g., 40.7128)"
                    style={styles.input}
                />
                <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Enter longitude (e.g., -74.006)"
                    style={styles.input}
                />
                <button onClick={() => fetchWeatherByCoords(latitude, longitude)} style={styles.button}>
                    Get Weather
                </button>
            </div>

            {/* GPS query */}
            <button onClick={getLocationWeather} style={styles.button} disabled={loading}>
                {loading ? "Fetching GPS..." : "Get Current Location Weather"}
            </button>

            {loading && <p>Fetching weather data...</p>}
        </div>
    );
};

// Styles
const styles = {
    container: {
        textAlign: "center",
        padding: "20px",
    },
    inputGroup: {
        marginBottom: "15px",
    },
    input: {
        padding: "8px",
        marginRight: "10px",
        width: "200px",
    },
    button: {
        padding: "8px",
        cursor: "pointer",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "5px",
    },
};

export default SearchBar;
