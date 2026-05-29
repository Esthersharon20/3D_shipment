# 3DSHIPMENT - Setup Instructions

## Project Structure
```
3DSHIPMENT/
├── src/                          ← React Frontend (DO NOT CHANGE STRUCTURE)
│   ├── Pages/
│   │   ├── Login/               ← Login page
│   │   ├── Dashboard/           ← Dashboard
│   │   ├── CargoConfig/         ← PAGE 1: Configure Cargo Item
│   │   ├── CargoList/           ← PAGE 2: Cargo Item List + Calculate
│   │   └── ThreeDViewer/        ← PAGE 3: 3D Viewer Results
│   ├── Components/Layout/       ← Sidebar layout
│   └── Navigation/              ← Routes
│
└── backend/                     ← Node.js + Express API
    ├── server.js                ← Main API server
    ├── db.js                    ← MySQL connection
    └── schema.sql               ← Database schema (run this first!)
```

## Database Setup (MySQL)

1. Open MySQL and run:
```sql
source /path/to/backend/schema.sql
```
Or paste the contents of `backend/schema.sql` into MySQL Workbench.

This creates:
- `cargo_db` database
- `cargo_items` table  ← from Excel: Section 1 (Cargo Data)
- `containers` table   ← from Excel: Section 2 (Container/Equipment Data)
- Sample container data (20GP, 40GP, 40HC, 45HC, Flat Rack, Open Top)

2. Edit `backend/db.js` and set your MySQL password:
```js
password: "your_password_here",
```

## Backend Setup

```bash
cd backend
npm install
node server.js
# Server runs on http://localhost:5000
```

## Frontend Setup

```bash
# (in root 3DSHIPMENT folder)
npm install
npm start
# App runs on http://localhost:3000
```

## Flow

1. **Login** → enter any email + password
2. **Dashboard** → click "New Shipment" 
3. **Configure Cargo** (Page 1) → fill in product details → click "Add Cargo →"
   - Saves to `cargo_items` table in DB
4. **Cargo List** (Page 2) → see all cargo from DB → select container → click "Calculate"
   - Fetches from DB, runs packing algorithm
5. **3D Viewer** (Page 3) → interactive 3D visualization of packed container
   - Drag to rotate, scroll to zoom

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/cargo | Get all cargo items |
| POST | /api/cargo | Add new cargo item |
| DELETE | /api/cargo/:id | Delete cargo item |
| GET | /api/containers | Get all containers |
| POST | /api/calculate | Run packing calculation |
