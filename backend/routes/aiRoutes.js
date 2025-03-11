const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// AI Suggestion API (Using DeepSeek)
router.post("/ai-suggestion", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: "Prompt is required!" });
    }

    console.log("🔍 Received AI prompt request...");

    try {
        const response = await axios.post(
            "https://api.deepseek.com/v1/chat/completions",
            {
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "Based on your weather information, provide some advice to the user: 1.Possible weather forecast.2.Whether they need to bring an umbrella.3.Whether they should be cautious of high or low temperatures. Respond in fluent sentences, and keep the response under 150 words." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 200,
            },
            {
                headers: {
                    "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("DeepSeek AI Response:", response.data);
        res.json({ suggestion: response.data.choices[0].message.content });
    } catch (error) {
        console.error("Error fetching AI suggestion:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Failed to generate AI insights." });
    }
});

module.exports = router;
