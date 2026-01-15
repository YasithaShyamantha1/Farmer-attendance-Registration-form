require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/submit', async (req, res) => {
  const d = req.body || {};
  console.log('POST /submit received:', JSON.stringify(d));
  try {
    const sql = `INSERT INTO entries (role, name, nic, address, phone, designation, institution, scanned_data) VALUES (?,?,?,?,?,?,?,?)`;
    const params = [
      d.role || null,
      d.name || null,
      d.nic || null,
      d.address || null,
      d.phone || null,
      d.designation || null,
      d.institution || null,
      d.scannedData || null,
    ];
    const result = await db.query(sql, params);
    console.log('DB insert result:', result && (result.insertId || result.lastID) ? (result.insertId || result.lastID) : result);
    let id = null;
    try { id = db.type === 'mysql' ? result.insertId : result.lastID; } catch (e) { id = null; }
    res.json({ success: true, id });
  } catch (err) {
    console.error('DB insert error', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

app.get('/entries', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM entries ORDER BY created_at DESC LIMIT 200');
    res.json(rows);
  } catch (err) {
    console.error('DB select error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// CSV export endpoint
app.get('/export.csv', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM entries ORDER BY created_at DESC');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="entries.csv"');

    const headers = ['id','role','name','nic','address','phone','designation','institution','scanned_data','created_at'];
    res.write(headers.join(',') + '\n');
    for (const r of rows) {
      const line = headers.map(h => {
        let v = r[h] == null ? '' : String(r[h]);
        if (v.includes(',') || v.includes('"') || v.includes('\n')) {
          v = '"' + v.replace(/"/g, '""') + '"';
        }
        return v;
      }).join(',');
      res.write(line + '\n');
    }
    res.end();
  } catch (err) {
    console.error('DB export error', err);
    res.status(500).send('Database error');
  }
});

const PORT = process.env.PORT || 3000;
(async () => {
  try {
    await db.init();
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT} (db: ${db.type})`));
  } catch (err) {
    console.error('Failed to initialize database', err);
    process.exit(1);
  }
})();
