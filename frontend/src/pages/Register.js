import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate(); // for page jumping

    const handleRegister = async () => {
        try {
            await axios.post("http://localhost:5000/api/users/register", {
                username,
                email,
                password,
            });
            alert("Registration successful! Please login.");
            navigate("/login"); // Jump to LOGIN
        } catch (error) {
            console.error("Registration error:", error);
            alert("Registration failed");
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.registerBox}>
                <h2 style={styles.title}>Register</h2>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={styles.input}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                />
                <button onClick={handleRegister} style={styles.button}>Register</button>
                <p style={styles.text}>
                    Already have an account? <a href="/login" style={styles.link}>Login</a>
                </p>
            </div>
        </div>
    );
};

// Styles
const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f5f5f5",
    },
    registerBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
        width: "300px",
    },
    title: {
        marginBottom: "20px",
    },
    input: {
        width: "100%",
        padding: "10px",
        marginBottom: "15px",
        borderRadius: "5px",
        border: "1px solid #ccc",
    },
    button: {
        width: "100%",
        padding: "10px",
        borderRadius: "5px",
        border: "none",
        backgroundColor: "#28a745",
        color: "white",
        cursor: "pointer",
        fontSize: "16px",
    },
    text: {
        marginTop: "15px",
    },
    link: {
        color: "#007bff",
        textDecoration: "none",
        fontWeight: "bold",
    },
};

export default Register;
