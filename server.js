import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fetchShips from './scraper.js'; // Scraping logic (implemented)
import { fetchAniListShips, fetchMALShips } from './scraper_sources.js'; // Additional sources
import axios from 'axios';
import puppeteer from 'puppeteer';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    shipLists: [{ name: String, ships: Object }],
});
const User = mongoose.model('User', UserSchema);

app.get("/", (req, res) => {
    res.send("🚀 Backend is Live! Use /ships/:character to fetch ship data.");
});

// User Signup
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, shipLists: [] });
    await user.save();
    res.json({ message: 'User created' });
});

// User Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
});

// Fetch Ships for a Character from Multiple Sources
app.get('/ships/:character', async (req, res) => {
    const character = req.params.character;
    try {
        const [fandomShips, aniListShips, malShips] = await Promise.all([
            fetchShips(character),
            fetchAniListShips(character),
            fetchMALShips(character),
        ]);
        res.json({
            fandomWiki: fandomShips,
            aniList: aniListShips,
            myAnimeList: malShips,
        });
    } catch (error) {
        console.error("Error fetching ships:", error);
        res.status(500).json({ message: 'Error fetching ships', error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

