# QR Entry App

Simple Node.js + Express app that opens a QR scanner and shows a conditional form (Farmer or Officer). Submissions are stored in a local SQLite database.

Quick start (Windows PowerShell):

```powershell
cd "d:\Intern Office\QR code"
npm install
npm start
```

Open http://localhost:3000 in your browser. Click "Start Scanner" and scan a QR code. The form appears with role options; fill and submit to save.

Notes:
- Uses `html5-qrcode` client-side library for camera scanning.
- Data stored in `data/entries.db` (SQLite).

Admin:
- View saved entries at http://localhost:3000/admin.html
- Export all entries as CSV at http://localhost:3000/export.csv
