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

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    shipLists: [{ name: String, ships: Object }],
});
const User = mongoose.model('User', UserSchema);

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

// Save a Ship List
app.post('/shiplist', async (req, res) => {
    const { token, name, ships } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        user.shipLists.push({ name, ships });
        await user.save();
        res.json({ message: 'Ship list saved' });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Generate Bulk Mudae Command Grouped by Series
app.get('/mudae-command', async (req, res) => {
    const token = req.headers.authorization;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || user.shipLists.length === 0) {
            return res.status(400).json({ message: 'No ship lists found' });
        }
        
        const commandsBySeries = {};
        user.shipLists.forEach(list => {
            Object.entries(list.ships).forEach(([category, shipList]) => {
                shipList.forEach(ship => {
                    const series = ship.series || 'Unknown'; // Assume each ship has a series property
                    if (!commandsBySeries[series]) {
                        commandsBySeries[series] = [];
                    }
                    commandsBySeries[series].push(`$sm ${ship.name}`);
                });
            });
        });
        
        const formattedCommands = Object.entries(commandsBySeries)
            .map(([series, commands]) => `# ${series}\n${commands.join(' ')}`)
            .join('\n\n');
        
        res.json({ mudaeCommand: formattedCommands });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Get User's Ship Lists
app.get('/shiplist', async (req, res) => {
    const token = req.headers.authorization;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        res.json(user.shipLists);
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Delete a Ship List
app.delete('/shiplist/:name', async (req, res) => {
    const token = req.headers.authorization;
    const { name } = req.params;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        user.shipLists = user.shipLists.filter(list => list.name !== name);
        await user.save();
        res.json({ message: 'Ship list deleted' });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
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
        res.status(500).json({ message: 'Error fetching ships', error });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
