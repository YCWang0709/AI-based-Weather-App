import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import WeatherHistory from "./pages/WeatherHistory";

const App = () => {
    const [user, setUser] = useState(null);

    // check Login state
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <Router>
            {user && (
                <nav>
                    <Link to="/">Home</Link> | <Link to="/history">Weather History</Link> |{" "}
                    <button onClick={() => { localStorage.removeItem("user"); setUser(null); }}>Logout</button>
                </nav>
            )}

            <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login setUser={setUser} />} />
                <Route path="/" element={user ? <Home user={user} setUser={setUser} /> : <Navigate to="/login" />} />
                <Route path="/history" element={user ? <WeatherHistory /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
};

export default App;
