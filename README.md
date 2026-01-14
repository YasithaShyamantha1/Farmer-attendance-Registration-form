# QR Entry App

Simple Node.js + Express app that opens a QR scanner and shows a conditional form (Farmer or Officer). Submissions are stored in a local SQLite database or MySQL.

Quick start (Windows PowerShell):

```powershell
cd "d:\Intern Office\QR code"
npm install
npm start
```

Open http://localhost:3000 in your browser. The form appears with role options; fill and submit to save.

Features:
- Responsive Bootstrap 5 UI with logo
- Role-based form (Farmer or Officer) with conditional fields
- SQLite (default) or MySQL database support
- Admin page to view all entries
- CSV export functionality
- Environment variable configuration for database switching

Admin:
- View saved entries at http://localhost:3000/admin.html
- Export all entries as CSV at http://localhost:3000/export.csv

Database Setup:
- **SQLite (default)**: Works out of the box, stored in `data/entries.db`
- **MySQL**: Set env vars and start:
  ```powershell
  $env:DB_TYPE='mysql'
  $env:MYSQL_HOST='localhost'
  $env:MYSQL_USER='youruser'
  $env:MYSQL_PASSWORD='yourpass'
  $env:MYSQL_DATABASE='qr_entry_db'
  npm start
  ```

