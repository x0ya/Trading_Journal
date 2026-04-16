const express = require('express');//import and store the express package
const app = express();//create express app. use to define routes and start listening

const cors = require('cors');//
app.use(cors());//

app.use(express.json({ limit: '10mb' }));//When your frontend sends trade data to the server, it sends it as a JSON string: & Without express.json(), Express receives this as raw text — it doesn't know it's JSON. You'd have to manually convert it every time.note: it used to be app.use(express.json())

//database
const Database = require('better-sqlite3');
const db = new Database('trades.db');

//create trade table if it doesn't exits
//CREATE TABLE IF NOT EXISTS trades only create table if doesn't already exists so it won't wipe out data
//id INTEGER is defining its type and so on for TEXT
//autoincrement 1,2,3,..
//db.exec()     → run SQL with no return value (setup commands)
db.exec(`
    CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT,
    type TEXT,
    direction TEXT,
    entry REAL,
    exit REAL,
    size REAL,
    date TEXT,
    notes TEXT,
    screenshot TEXT
    )
`);
//database

app.get('/trades', function(req, res) {//it gets triggered when /trades is requested by http
    const trades = db.prepare('SELECT * FROM trades ORDER BY date DESC').all();//
    res.json(trades);
});//req get everything browser sent and res sends it back//
// JSON.stringify  → pack object into string   (sending)
// JSON.parse      → unpack string into object (receiving)
// express.json()  → does JSON.parse automatically on incoming requests
// res.json()      → does JSON.stringify automatically on outgoing responses

app.post('/trades', function(req, res) {
    const {symbol, type, direction, entry, exit, size, date, notes, screenshot } = req.body;
    if (!symbol || !entry || !exit || !date) {
        return res.status(400).json({ error: 'Missing required fields.' })
    }
    const stmt = db.prepare(`
        INSERT INTO trades (symbol, type, direction, entry, exit, size, date, notes, screenshot)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
    const result = stmt.run(symbol, type, direction, entry, exit, size, date, notes, screenshot || null);
    const newTrade = db.prepare('SELECT * FROM trades WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newTrade);
});

app.delete('/trades/:id', function(req, res){
    const id = parseInt(req.params.id);
    db.prepare('DELETE FROM trades WHERE id = ?').run(id);
    res.json({ success: true});
})

app.listen(3000, function() {
    console.log('Server running on http://localhost:3000');
});//Start the server on port 3000. The function runs once when the server starts — just logs a message so we know it's running.