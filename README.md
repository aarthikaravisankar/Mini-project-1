# 108 Emergency Ambulance Dispatch System
### Perundurai & Erode District Control Command Hub (தமிழ்நாடு 108 அவசர ஊர்தி சேவை)

A full-stack, real-time emergency dispatch management platform built with:
- **Active Backend:** **Java (JDK 17/21/26)** Native HTTP Server with MySQL JDBC Connector/J (`com.mysql.cj.jdbc.Driver`)
- **Database:** MySQL Database (`smart_emergency_ambulance_dispatcher`)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **GIS & Mapping:** OpenStreetMap (Leaflet) with Haversine spatial routing & Google Maps integration
- **Legacy Reference:** Python FastAPI backend preserved in `backend/` for archival reference (no longer required for operation)

---

## ☕ Java Backend Architecture

The application backend runs completely on **Java**:
- **Zero Heavy Framework Overhead:** Runs directly on Java's high-performance multi-threaded `com.sun.net.httpserver.HttpServer` with an elastic thread pool.
- **Direct MySQL Persistence:** All hospitals, drivers, ambulances, emergencies, dispatches, trips, and notifications are stored directly in MySQL (`smart_emergency_ambulance_dispatcher`). JSON files are eliminated from the active application flow.
- **Port:** Runs on `http://localhost:8001/`
- **Configurable Database Credentials:** Configured via `backend-java/config/db.properties` or standard environment variables (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_URL`).

---

## 🚑 Project Architecture & Workflow

### 1. Multi-Role Authentication & Access Portals
Designed with strict operational isolation and independent credentials:

| Portal | Role | Identifier / Username | Default Passcode | Scope & Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Control Room Hub** | Operator | `operator1` / `admin` | `108` or `control108` | Emergency call intake, 200m duplicate detection, min-heap priority queue, ambulance dispatching, driver telemetry, fleet statistics. |
| **Driver 1 (ALS)** | Driver | `driver101` (`AMB-101`) | `driver123` or `drv-101` | Murugan R. — Perundurai Old Bus Stand Hub |
| **Driver 2 (BLS)** | Driver | `driver102` (`AMB-102`) | `driver123` or `drv-102` | Senthil Kumar — Chithode Bypass Toll Hub |
| **Driver 3 (ACLS)** | Driver | `driver103` (`AMB-103`) | `driver123` or `drv-103` | Karthik Raja — Erode Railway Station / GH Post |
| **Driver 4 (BLS)** | Driver | `driver104` (`AMB-104`) | `driver123` or `drv-104` | Venkatesh S. — Thindal Ring Road Post |
| **Driver 5 (BLS)** | Driver | `driver105` (`AMB-105`) | `driver123` or `drv-105` | Praveen Anand — Modakkurichi / Solar Post |
| **Driver 6 (ALS)** | Driver | `driver106` (`AMB-106`) | `driver123` or `drv-106` | Deepak Natarajan — Bhavani New Bus Stand Hub |
| **Driver 7 (ALS)** | Driver | `driver107` (`AMB-107`) | `driver123` or `drv-107` | Ramesh Kumar — IRT Medical College Campus, Perundurai |
| **Hospital 1** | Hospital | `hosp-01` (`ERODE-HOSP-01`) | `hospital123` or `hosp-01` | Govt Medical College Hospital & IRT, Perundurai |
| **Hospital 2** | Hospital | `hosp-02` (`ERODE-HOSP-02`) | `hospital123` or `hosp-02` | Erode Government Headquarters Hospital (GH) |
| **Hospital 3** | Hospital | `hosp-03` (`ERODE-HOSP-03`) | `hospital123` or `hosp-03` | Lotus Hospital & Research Centre |
| **Hospital 4** | Hospital | `hosp-04` (`ERODE-HOSP-04`) | `hospital123` or `hosp-04` | Care 24 Hospital / Maruthi Medical Center |
| **Hospital 5** | Hospital | `hosp-05` (`ERODE-HOSP-05`) | `hospital123` or `hosp-05` | Sudha Hospitals (Trauma & Critical Care) |
| **Hospital 6** | Hospital | `hosp-06` (`ERODE-HOSP-06`) | `hospital123` or `hosp-06` | Thangam Hospital & Emergency Center |
| **Hospital 7** | Hospital | `hosp-07` (`ERODE-HOSP-07`) | `hospital123` or `hosp-07` | Government Hospital, Bhavani |

---

## 📍 Geographic Focus: Perundurai & Erode District

### The Exactly 7 Registered Erode Regional Hospitals:
1. **Govt Medical College Hospital & IRT, Perundurai** (`ERODE-HOSP-01`) — Sanatorium Campus, NH 544
2. **Erode Government Headquarters Hospital (GH)** (`ERODE-HOSP-02`) — Brough Road, Near Clock Tower, Erode
3. **Lotus Hospital & Research Centre** (`ERODE-HOSP-03`) — Poondurai Road, Kollampalayam, Erode
4. **Care 24 Hospital / Maruthi Medical Center** (`ERODE-HOSP-04`) — Perundurai Road, Near Collectorate, Erode
5. **Sudha Hospitals (Trauma & Critical Care)** (`ERODE-HOSP-05`) — Perundurai Road, Erode
6. **Thangam Hospital & Emergency Center** (`ERODE-HOSP-06`) — Bhavani Road, Perundurai
7. **Government Hospital, Bhavani** (`ERODE-HOSP-07`) — Mettur Main Road, Varnapuram, Bhavani

*(Hospitals from Chennai or other unrelated districts are strictly filtered out).*

### The Exactly 7 Stationed 108 Ambulances & Drivers:
1. `AMB-101` (`TN 01 G 1081`) — Driver: **Murugan R.** (`DRV-101`) | Advanced Life Support (ALS) | Perundurai Old Bus Stand Hub
2. `AMB-102` (`TN 01 G 1082`) — Driver: **Senthil Kumar** (`DRV-102`) | Basic Life Support (BLS) | Chithode Bypass Toll Hub
3. `AMB-103` (`TN 02 G 1083`) — Driver: **Karthik Raja** (`DRV-103`) | Advanced Cardiac Life Support | Erode Railway Station / GH Post
4. `AMB-104` (`TN 02 G 1084`) — Driver: **Venkatesh S.** (`DRV-104`) | Basic Life Support (BLS) | Thindal Ring Road Post
5. `AMB-105` (`TN 03 G 1085`) — Driver: **Praveen Anand** (`DRV-105`) | Basic Life Support (BLS) | Modakkurichi / Solar Post
6. `AMB-106` (`TN 03 G 1086`) — Driver: **Deepak Natarajan** (`DRV-106`) | Advanced Life Support (ALS) | Bhavani New Bus Stand Hub
7. `AMB-107` (`TN-33-G-1087`) — Driver: **Ramesh Kumar** (`DRV-107`) | Advanced Life Support (ALS) | IRT Medical College Campus, Perundurai

---

## 📡 REST API Specifications (Java Backend)

All endpoints run on `http://localhost:8001`:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check & MySQL connection verification |
| `/api/stats` | `GET` | Central Control Room KPIs (fleet status, beds, active emergencies) |
| `/api/login` | `POST` | Role-based authentication (Control Room, Drivers, Hospitals) |
| `/api/users` | `GET` | System user directory |
| `/api/hospitals` | `GET` | Lists all 7 Erode regional hospitals |
| `/api/hospitals/recommend/{inc_id}` | `GET` | Recommends nearest hospital with bed availability |
| `/api/hospitals/{hosp_id}/beds` | `GET` | Queries hospital emergency, ICU, and oxygen bed counts |
| `/api/hospitals/{hosp_id}/beds` | `PUT` | Real-time bed count update saved to MySQL |
| `/api/drivers` | `GET` | Dedicated drivers list with mapped ambulances |
| `/api/drivers/{driver_id}` | `GET` | Specific driver profile |
| `/api/ambulances` | `GET` | Lists 7 ambulances with real-time GPS & dispatch status |
| `/api/ambulances/{id}` | `GET` | Specific ambulance telemetry |
| `/api/ambulances/{id}/status` | `POST` | Toggles ambulance status (`Available`, `Maintenance`) |
| `/api/duplicate-check` | `POST` | Spatial & temporal duplicate call check (200m / 10min) |
| `/api/incidents` | `POST` | Registers new emergency incident in MySQL |
| `/api/incidents` | `GET` | Lists incidents (supports `active_only=true`) |
| `/api/incidents/{id}` | `GET` | Incident record by ID |
| `/api/incidents/{id}/link` | `POST` | Links duplicate call to existing active incident |
| `/api/call-forward` | `POST` | Forwards call to neighbouring command center |
| `/api/priority-queue` | `GET` | Min-heap ordered queue of pending emergency requests |
| `/api/dispatch/recommend/{id}` | `GET` | Distance-ranked available ambulances |
| `/api/dispatch/confirm` | `POST` | Dispatches ambulance (updates both ambulance & incident in MySQL) |
| `/api/driver/status` | `POST` | 5-state driver trip progression & trip completion |
| `/api/routes` | `POST`/`GET`| Road waypoint generator and travel time estimator |
| `/api/trips` | `GET` | History of completed patient transport dispatches |
| `/api/notifications` | `GET` | Real-time event notifications from MySQL |
| `/api/clean-session` | `POST` | Resets active state while preserving database history |

---

## 🚀 How to Run the Project

### Prerequisites
1. **Java JDK 17+ or JDK 21+** (Verify with `javac -version` and `java -version`)
2. **Node.js 18+ or 20+** (Verify with `node -v` and `npm -v`)
3. **MySQL Server** (e.g. XAMPP running on `localhost:3306`)

> **Note:** Python is **NOT** required to run this application. The Java backend handles all application logic and database interactions.

### 1. Database Setup
1. Start MySQL in XAMPP (Port 3306).
2. Open phpMyAdmin or MySQL CLI:
   ```sql
   CREATE DATABASE IF NOT EXISTS `smart_emergency_ambulance_dispatcher`;
   ```
3. Import the database schemas:
   - `smart_emergency_ambulance_dispatcher.sql`
   - `schema_patch.sql`

### 2. Single-Click Launch (Recommended)
Double-click:
```bat
start_all.bat
```
This automatically frees port 8001 if occupied, compiles and launches the Java backend on `http://localhost:8001`, and launches the Vite React frontend on `http://localhost:5173`.

### 3. Manual Startup Options

#### Option A: Running Java Backend with Batch Script (Zero Maven Required)
```bat
run_backend.bat
```

#### Option B: Running Java Backend with Maven
```bash
cd backend-java
mvn compile exec:java
```

#### Option C: Running Frontend
```bat
run_frontend.bat
```
*(or navigate to `frontend` and run `npm run dev`).*

Open `http://localhost:5173/` in your browser.

---

## 🧪 Automated System Verification

An automated PowerShell verification suite is included to validate the entire Java + MySQL backend:

```powershell
powershell.exe -ExecutionPolicy Bypass -File test_verification.ps1
```

### Verified Test Cases (All 11 Passing):
- **Test 1:** Exactly 7 Erode regional hospitals loaded from MySQL.
- **Test 2:** Exactly 7 active ambulances and drivers loaded with 1:1 mapping.
- **Test 3:** Accurate Control Room KPI stats calculated from live MySQL tables.
- **Test 4:** Ambulance dispatch isolation (dispatching Murugan `AMB-101` leaves all 6 other drivers unaffected).
- **Test 5:** Prevention of double-dispatching already occupied ambulances.
- **Test 6:** Trip completion isolation (completing trip returns only the relevant ambulance to `Available`).
- **Test 7:** Independent hospital bed management (updating Erode GH beds does not affect Perundurai beds).
- **Test 8:** Multi-role authentication API (`/api/login`) for Control Room, Drivers, and Hospitals.
- **Test 9:** Dedicated drivers API (`/api/drivers` and `/api/drivers/DRV-101`).
- **Test 10:** Road routing and waypoint generation API (`/api/routes`).
- **Test 11:** Specific hospital bed query API (`/api/hospitals/{id}/beds`).
