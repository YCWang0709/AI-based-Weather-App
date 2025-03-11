import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import axios from "axios";

const Home = ({ user, setUser }) => {
    const [weatherData, setWeatherData] = useState(null);
    const [aiSuggestion, setAiSuggestion] = useState("");
    const [aiTourism, setAiTourism] = useState("");
    const [loadingAi, setLoadingAi] = useState(false);
    const [loadingTourism, setLoadingTourism] = useState(false);
    const [locationInput, setLocationInput] = useState(""); // city name 
    const [loadingLocation, setLoadingLocation] = useState(false);
    const navigate = useNavigate();

    // delete account
    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            try {
                await axios.delete(`http://localhost:5000/api/users/${user.id}`);
                localStorage.removeItem("user");
                setUser(null);
                navigate("/register");
            } catch (error) {
                console.error("Error deleting account:", error);
                alert("Failed to delete account.");
            }
        }
    };

    // get coordinate by location
    const fetchCoordinates = async () => {
        if (!locationInput.trim()) {
            alert("Please enter a location.");
            return;
        }
        setLoadingLocation(true);
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
        setLoadingLocation(false);
    };

    // get weather
    const fetchWeatherByCoords = async (lat, lon) => {
        try {
            const response = await axios.post("http://localhost:5000/api/weather/get-weather", {
                lat,
                lon,
                lang: "en",
                userId: user?.id || "default-user",
            });
            console.log("Weather Data:", response.data);
            setWeatherData(response.data);
        } catch (error) {
            console.error("Error fetching weather data:", error);
            alert("Failed to fetch weather data.");
        }
    };

    // get AI-rec info
    const fetchAiSuggestion = async () => {
        if (!weatherData) {
            alert("Please fetch the weather data first.");
            return;
        }

        const weatherPrompt = `
            Current Weather: ${weatherData.current_weather.weather}, 
            Temperature: ${weatherData.current_weather.temperature}°C, 
            Wind Speed: ${weatherData.current_weather.wind_speed} km/h, 
            Humidity: ${weatherData.current_weather.humidity}%

            Past Weather: 
            ${weatherData.past_weather.map((day) => 
                `${day.date}: Max Temp ${day.temperature_max}°C, Min Temp ${day.temperature_min}°C, Precipitation ${day.precipitation}mm`
            ).join("\n")}

            Future Forecast:
            ${weatherData.future_weather.map((day) => 
                `${day.date}: ${day.weather}, Temperature: ${day.temperature}°C, Wind Speed: ${day.wind_speed} km/h, Humidity: ${day.humidity}%`
            ).join("\n")}
        `;

        setLoadingAi(true);
        try {
            const response = await axios.post("http://localhost:5000/api/ai/ai-suggestion", {
                prompt: weatherPrompt
            });
            console.log("AI Response:", response.data);
            setAiSuggestion(response.data.suggestion);
        } catch (error) {
            console.error("Error fetching AI suggestion:", error);
            alert("Failed to get AI suggestion.");
        }
        setLoadingAi(false);
    };

    // get AI-travel info
    const fetchAiTourism = async () => {
        if (!weatherData) {
            alert("Please fetch the weather data first.");
            return;
        }
        const tourismPrompt = `Based on the location "${weatherData.location}", provide 5 travel recommendations including attractions, historical sites, and outdoor activities.`;
        setLoadingTourism(true);
        try {
            const response = await axios.post("http://localhost:5000/api/ai/ai-suggestion", {
                prompt: tourismPrompt
            });
            console.log("Tourism AI Response:", response.data);
            setAiTourism(response.data.suggestion);
        } catch (error) {
            console.error("Error fetching AI tourism suggestion:", error);
            alert("Failed to get AI tourism suggestion.");
        }
        setLoadingTourism(false);
    };

    return (
        <div style={styles.container}>
            {/* top navigator */}
            <div style={styles.navbar}>
                <button onClick={handleDeleteAccount} style={styles.deleteButton}>🚨 Delete Account</button>
            </div>

            {/* main body */}
            <div style={styles.content}>
                <h1>Weather App</h1>
                <h4>Developed by Yucheng Wang</h4>
        
                {/* coordinate query */}
                <SearchBar setWeatherData={setWeatherData} />
        
                {weatherData && weatherData.current_weather ? (
                    <div>
                        <h2>{weatherData.location || "Unknown Location"}'s Weather</h2>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Weather</th>
                                    <th>Temperature (°C)</th>
                                    <th>Wind Speed (km/h)</th>
                                    <th>Humidity (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Current weather */}
                                <tr>
                                    <td><b>Now</b></td>
                                    <td>{weatherData.current_weather.weather || "N/A"}</td>
                                    <td>{weatherData.current_weather.temperature ?? "N/A"}°C</td>
                                    <td>{weatherData.current_weather.wind_speed ?? "N/A"} km/h</td>
                                    <td>{weatherData.current_weather.humidity ?? "N/A"}%</td>
                                </tr>
                    
                                {/* Past Weather */}
                                {weatherData.past_weather.map((day, index) => (
                                    <tr key={index}>
                                        <td>{day.date} (Past)</td>
                                        <td>Code: {day.weather_code}</td>
                                        <td>{day.temperature_max} / {day.temperature_min}°C</td>
                                        <td>N/A</td>
                                        <td>N/A</td>
                                    </tr>
                                ))}
                    
                                {/* Future Weather */}
                                {weatherData.future_weather.map((day, index) => (
                                    <tr key={index}>
                                        <td>{day.date} (Future)</td>
                                        <td>{day.weather}</td>
                                        <td>{day.temperature}°C</td>
                                        <td>{day.wind_speed} km/h</td>
                                        <td>{day.humidity}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                
                        {/* AI suggestions */}
                        <div style={styles.aiContainer}>
                            <h3>💡 AI Suggestion</h3>
                            <button onClick={fetchAiSuggestion} style={styles.button} disabled={loadingAi}>
                                {loadingAi ? "Generating..." : "Generate AI Insights"}
                            </button>
                            {aiSuggestion && <p style={styles.aiText}>{aiSuggestion}</p>}
                        </div>
                
                        {/* Travel recommendations */}
                        <div style={styles.aiContainer}>
                            <h3>🌍 AI Travel Recommendations</h3>
                            <button onClick={fetchAiTourism} style={styles.button} disabled={loadingTourism}>
                                {loadingTourism ? "Generating..." : "Get Travel Suggestions"}
                            </button>
                            {aiTourism && <p style={styles.aiText}>{aiTourism}</p>}
                        </div>
                    </div>
                ) : (
                    <p>Enter a location or coordinates and fetch weather data.</p>
                )}
            </div>

            {/* bottom section */}
            <div style={styles.footer}>
                <p><b>About Product Manager Accelerator</b></p>
                <p>
                    The Product Manager Accelerator Program supports PM professionals at all career stages, 
                    from students seeking entry-level roles to Directors advancing into leadership.
                </p>
                <p>
                    Our community is ambitious and committed. Participants have honed key PM and leadership 
                    skills, building a strong foundation for future success.
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        textAlign: "center",
        padding: "20px",
    },
    navbar: {
        marginBottom: "20px",
    },
    deleteButton: {
        padding: "8px",
        cursor: "pointer",
        backgroundColor: "#ff4d4f",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
    },
    content: {
        flex: 1,
    },
    table: {
        width: "80%",
        margin: "auto",
        borderCollapse: "collapse",
        marginBottom: "20px",
        border: "1px solid #ddd",
    },
    aiContainer: {
        marginTop: "20px",
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        background: "#f9f9f9",
        display: "inline-block",
    },
    aiText: {
        fontStyle: "italic",
        marginTop: "10px",
    },
    button: {
        margin: "5px",
        padding: "8px",
        cursor: "pointer",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "5px",
    },
    footer: {
        marginTop: "auto",
        width: "100%",
        backgroundColor: "#f1f1f1",
        padding: "10px 0",
        textAlign: "center",
        fontSize: "12px",
        borderTop: "1px solid #ddd",
    },
};

export default Home;
