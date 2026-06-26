# Campus Lost & Found - Local Start

This project now runs locally without PostgreSQL by default. The backend uses a local SQLite database file and seeds useful starter data automatically.

## Start backend

```powershell
cd "C:\Users\sandh\.devin\full stack"
.\start-backend.ps1
```

Backend URL: http://localhost:8000

API docs: http://localhost:8000/api/docs

## Start frontend

Open a second PowerShell window:

```powershell
cd "C:\Users\sandh\.devin\full stack"
.\start-frontend.ps1
```

Frontend URL: http://localhost:5173

## Test accounts

Password for all seeded accounts: `password123`

- `admin@campus.edu`
- `student1@campus.edu`
- `staff1@campus.edu`

## PostgreSQL

SQLite is the easiest local default. To use PostgreSQL instead, change `backend\.env`:

```env
DATABASE_URL=postgresql+psycopg://campus_lost_found:CampusLostFound123@localhost:5432/campus_lost_found
```
