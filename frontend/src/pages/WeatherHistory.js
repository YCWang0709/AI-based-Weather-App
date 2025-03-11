import React, { useState, useEffect } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";

const API_BASE = "http://localhost:5000/api/weather";

const WeatherHistory = () => {
    const [records, setRecords] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchType, setSearchType] = useState("recent");
    const [loading, setLoading] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [exportOption, setExportOption] = useState(""); // 新增导出格式 state

    // New record state
    const [newRecord, setNewRecord] = useState({
        location: "",
        weather: "",
        temperature: "",
        wind_speed: "",
        humidity: "",
        userId: "default-user",
    });

    useEffect(() => {
        fetchWeatherHistory();
    }, []);

    // Fetch weather history
    const fetchWeatherHistory = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE}/history`;
            if (searchType !== "recent" && searchTerm.trim() !== "") {
                url = `${API_BASE}/history?${searchType}=${searchTerm}`;
            }
            const response = await axios.get(url);
            setRecords(response.data);
        } catch (error) {
            alert("Failed to fetch weather history.");
        }
        setLoading(false);
    };

    // Delete record
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this record?")) {
            try {
                await axios.delete(`${API_BASE}/${id}`);
                fetchWeatherHistory();
            } catch (error) {
                alert("Failed to delete the record.");
            }
        }
    };

    // Edit record
    const handleEdit = (record) => {
        setEditingRecord({ ...record });
    };

    // Cancel edit
    const cancelEdit = () => {
        setEditingRecord(null);
    };

    // Update record
    const handleUpdate = async () => {
        if (!editingRecord) return;
        try {
            await axios.put(`${API_BASE}/${editingRecord._id}`, editingRecord);
            setEditingRecord(null);
            fetchWeatherHistory();
        } catch (error) {
            alert("Failed to update the record.");
        }
    };

    // Add new record
    const handleAdd = async () => {
        if (!newRecord.location || !newRecord.weather || !newRecord.temperature) {
            alert("Please fill in required fields.");
            return;
        }
        try {
            await axios.post(API_BASE, newRecord);
            setNewRecord({
                location: "",
                weather: "",
                temperature: "",
                wind_speed: "",
                humidity: "",
                userId: "default-user",
            });
            fetchWeatherHistory();
        } catch (error) {
            alert("Failed to add a new record.");
        }
    };

    // Export JSON file
    const exportJSON = () => {
        const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
        saveAs(blob, "weather_data.json");
    };

    // Export CSV file
    const exportCSV = () => {
        if (records.length === 0) {
            alert("No data to export.");
            return;
        }
        let csvContent = "Queried At,Location,Weather,Temperature (°C),Wind Speed (km/h),Humidity (%)\n";
        records.forEach(record => {
            
            const dateObj = new Date(record.queriedAt);
            
            const queriedAt = isNaN(dateObj.getTime()) ? record.queriedAt : dateObj.toLocaleString();
            csvContent += `${queriedAt},${record.location},${record.current_weather.weather},${record.current_weather.temperature},${record.current_weather.wind_speed},${record.current_weather.humidity}\n`;
        });
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "weather_data.csv");
    };

    // Export PDF file
    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Weather History", 10, 10);
        let y = 20;
        records.forEach((record, index) => {
            doc.text(`${index + 1}. ${record.location} - ${new Date(record.queriedAt).toLocaleString()}`, 10, y);
            doc.text(`Weather: ${record.current_weather.weather}`, 10, y + 5);
            doc.text(`Temperature: ${record.current_weather.temperature}°C`, 10, y + 10);
            doc.text(`Wind Speed: ${record.current_weather.wind_speed} km/h`, 10, y + 15);
            doc.text(`Humidity: ${record.current_weather.humidity}%`, 10, y + 20);
            y += 30;
        });
        doc.save("weather_data.pdf");
    };

    const handleExportChange = (e) => {
        const option = e.target.value;
        setExportOption(option);
        if (option === "csv") {
            exportCSV();
        } else if (option === "json") {
            exportJSON();
        } else if (option === "pdf") {
            exportPDF();
        }
        setExportOption("");
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Weather History</h2>

            {/* Search Bar */}
            <div style={styles.searchContainer}>
                <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    style={styles.input}
                >
                    <option value="recent">Recent 10</option>
                    <option value="user">By Username</option>
                    <option value="date">By Date</option>
                    <option value="location">By Location</option>
                </select>
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="Enter search term" 
                    disabled={searchType === "recent"} 
                    style={styles.input}
                />
                <button onClick={fetchWeatherHistory} style={styles.button}>Search</button>
                {/* dropout bar */}
                <select value={exportOption} onChange={handleExportChange} style={styles.input}>
                    <option value="">Export</option>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="pdf">PDF</option>
                </select>
            </div>

            {/* Add New Record */}
            <h3 style={styles.subTitle}>Add New Record</h3>
            <div style={styles.addContainer}>
                {Object.keys(newRecord).map((key) => (
                    key !== "userId" && (
                        <input 
                            key={key}
                            type="text"
                            placeholder={key}
                            value={newRecord[key]}
                            onChange={(e) => setNewRecord({ ...newRecord, [key]: e.target.value })}
                            style={styles.input}
                        />
                    )
                ))}
                <button onClick={handleAdd} style={styles.button}>Add</button>
            </div>

            {/* Weather Data Table */}
            {loading ? <p>Loading...</p> : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th>Queried At</th>
                            <th>Location</th>
                            <th>Weather</th>
                            <th>Temperature (°C)</th>
                            <th>Wind Speed (km/h)</th>
                            <th>Humidity (%)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record) => (
                            <tr key={record._id}>
                                <td>{new Date(record.queriedAt).toLocaleString()}</td>
                                {editingRecord && editingRecord._id === record._id ? (
                                    <>
                                        <td>
                                            <input
                                                type="text"
                                                value={editingRecord.location}
                                                onChange={(e) =>
                                                    setEditingRecord({
                                                        ...editingRecord,
                                                        location: e.target.value,
                                                    })
                                                }
                                                style={styles.input}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={editingRecord.current_weather.weather}
                                                onChange={(e) =>
                                                    setEditingRecord({
                                                        ...editingRecord,
                                                        current_weather: {
                                                            ...editingRecord.current_weather,
                                                            weather: e.target.value,
                                                        },
                                                    })
                                                }
                                                style={styles.input}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={editingRecord.current_weather.temperature}
                                                onChange={(e) =>
                                                    setEditingRecord({
                                                        ...editingRecord,
                                                        current_weather: {
                                                            ...editingRecord.current_weather,
                                                            temperature: e.target.value,
                                                        },
                                                    })
                                                }
                                                style={styles.input}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={editingRecord.current_weather.wind_speed}
                                                onChange={(e) =>
                                                    setEditingRecord({
                                                        ...editingRecord,
                                                        current_weather: {
                                                            ...editingRecord.current_weather,
                                                            wind_speed: e.target.value,
                                                        },
                                                    })
                                                }
                                                style={styles.input}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={editingRecord.current_weather.humidity}
                                                onChange={(e) =>
                                                    setEditingRecord({
                                                        ...editingRecord,
                                                        current_weather: {
                                                            ...editingRecord.current_weather,
                                                            humidity: e.target.value,
                                                        },
                                                    })
                                                }
                                                style={styles.input}
                                            />
                                        </td>
                                        <td>
                                            <button onClick={handleUpdate} style={styles.button}>Save</button>
                                            <button onClick={cancelEdit} style={styles.button}>Cancel</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td>{record.location}</td>
                                        <td>{record.current_weather.weather}</td>
                                        <td>{record.current_weather.temperature}°C</td>
                                        <td>{record.current_weather.wind_speed} km/h</td>
                                        <td>{record.current_weather.humidity}%</td>
                                        <td>
                                            <button onClick={() => handleEdit(record)} style={styles.button}>Edit</button>
                                            <button onClick={() => handleDelete(record._id)} style={styles.button}>Delete</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

// Styles
const styles = {
    container: { textAlign: "center", padding: "20px" },
    title: { fontSize: "24px", fontWeight: "bold" },
    searchContainer: { marginBottom: "20px", display: "flex", justifyContent: "center", gap: "10px" },
    addContainer: { display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" },
    table: { width: "100%", borderCollapse: "collapse", marginTop: "20px" },
    input: { margin: "5px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" },
    button: { margin: "5px", padding: "8px", cursor: "pointer", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "4px" },
    subTitle: { fontSize: "20px", fontWeight: "bold", marginBottom: "10px" },
};

export default WeatherHistory;
