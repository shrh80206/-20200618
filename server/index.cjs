const express = require('express');
const cors = require('cors');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'database.sqlite');

let db;

(async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS chess_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                winner TEXT NOT NULL,
                moves_count INTEGER,
                played_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Chess Database initialized');
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
})();

app.get('/api/records', async (req, res) => {
    try {
        const records = await db.all('SELECT * FROM chess_records ORDER BY played_at DESC LIMIT 10');
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/records', async (req, res) => {
    try {
        const { winner, moves_count } = req.body;
        const result = await db.run(
            'INSERT INTO chess_records (winner, moves_count) VALUES (?, ?)', 
            [winner, moves_count]
        );
        res.json({ id: result.lastID, winner, moves_count, played_at: new Date() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Chess Server is running on http://localhost:${PORT}`);
});
