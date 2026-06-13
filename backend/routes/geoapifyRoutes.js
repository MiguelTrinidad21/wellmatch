import express from "express";
import axios from "axios";
import rateLimit from "express-rate-limit";

const router = express.Router();

const geoapifyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {
        error: "Too many location requests. Please slow down."
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.get("/autocomplete", geoapifyLimiter, async (req, res) => {
    try {
        const { text } = req.query;

        if (!text || text.length < 4) {
            return res.status(400).json({
                error: "Please type at least 4 characters."
            });
        }

        const response = await axios.get(
            "https://api.geoapify.com/v1/geocode/autocomplete",
            {
                params: {
                    text,
                    filter: "countrycode:ph",
                    format: "json",
                    limit: 5,
                    apiKey: process.env.GEOAPIFY_API_KEY
                }
            }
        );

        const suggestions = response.data.results.map((place) => ({
            placeId: place.place_id,
            formatted: place.formatted,
            city: place.city || "",
            state: place.state || "",
            country: place.country || "",
            street: place.street || "",
            lat: place.lat,
            lon: place.lon
        }));

        return res.json({ suggestions });
    } catch (error) {
        console.error(error.response?.data || error.message);

        res.status(500).json({
            error: "Failed to fetch address suggestions."
        });
    }
});

export default router;