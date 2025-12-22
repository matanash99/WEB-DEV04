const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Users storage
const usersFile = path.join(__dirname, 'users.json');
let users = [];

// Load users from JSON file at server start
if (fs.existsSync(usersFile)) {
    try {
        const fileData = fs.readFileSync(usersFile);
        users = JSON.parse(fileData);
        console.log('Loaded users from JSON file:', users.length);
    } catch (err) {
        console.error('Error reading users.json:', err);
    }
}

// Helper: save users
function saveUsers() {
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        console.log('Users saved to JSON');
    } catch (err) {
        console.error('Error saving users.json:', err);
    }
}

// --- REGISTER ---
app.post('/api/register', (req, res) => {
    const { username, password, firstName, imageURL } = req.body;

    if (!username || !password || !firstName || !imageURL) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (users.some(u => u.username === username)) {
        return res.status(409).json({ error: 'Username already exists' });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ error: 'Password does not meet requirements' });
    }

    const newUser = { username, password, firstName, imageURL };
    users.push(newUser);
    saveUsers();

    res.json({ message: 'Registration successful', user: { username, firstName, imageURL } });
});

// --- LOGIN ---
app.post('/api/login', (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Missing username or password' });
    }

    const user = users.find(
        u => u.username === username.trim() && u.password === password.trim()
    );

    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    const { password: _, ...userData } = user; // omit password
    res.json(userData);
});

// --- PLAYLISTS ---
const playlistsFile = path.join(process.cwd(), 'server/playlists.json');

// Helper functions
function readPlaylists() {
    if (!fs.existsSync(playlistsFile)) return {};
    return JSON.parse(fs.readFileSync(playlistsFile));
}

function writePlaylists(data) {
    fs.writeFileSync(playlistsFile, JSON.stringify(data, null, 2));
}

// GET playlists for a user
app.get('/api/playlists/:username', (req, res) => {
    const username = req.params.username;
    const playlists = readPlaylists();
    res.json(playlists[username] || {});
});

// POST: create/update playlist
app.post('/api/playlists/:username/:playlistName', (req, res) => {
    const username = req.params.username;
    const playlistName = req.params.playlistName;
    const videos = req.body.videos || [];

    const playlists = readPlaylists();
    if (!playlists[username]) playlists[username] = {};
    playlists[username][playlistName] = videos;
    writePlaylists(playlists);

    res.json({ success: true });
});

// DELETE a video from a playlist
app.delete('/api/playlists/:username/:playlistName/:videoId', (req, res) => {
    const { username, playlistName, videoId } = req.params;
    const playlists = readPlaylists();

    if (!playlists[username] || !playlists[username][playlistName]) {
        return res.status(404).json({ error: 'Playlist not found' });
    }

    playlists[username][playlistName] = playlists[username][playlistName].filter(
        v => v.id.videoId !== videoId
    );

    writePlaylists(playlists);
    res.json({ success: true });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Redirect root to index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
