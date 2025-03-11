const express = require("express");
const User = require("../models/User");

const router = express.Router();

// User register
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        user = new User({ username, email, password });
        await user.save();

        res.json({ message: "User registered successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// User login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("Received login request:", email, password);

    try {
        const user = await User.findOne({ 
            $or: [{ email: email }, { username: email }] // Log in with Email / Username
        });

        console.log("Found user in DB:", user);

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (user.password !== password) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        res.json({ message: "Login successful", user });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
