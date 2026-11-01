# 108 Emergency Ambulance Dispatch System
### Perundurai & Erode District Control Command Hub (தமிழ்நாடு 108 அவசர ஊர்தி சேவை)

A full-stack, real-time emergency dispatch management platform built with:
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Primary Active Backend:** Java (JDK 21) Native HTTP REST Server + MySQL JDBC Connector/J
- **Secondary Backend:** Python FastAPI (Uvicorn)
- **Database:** MySQL Database (`smart_emergency_ambulance_dispatcher`)
- **GIS & Mapping:** OpenStreetMap (Leaflet) with Haversine spatial routing & Google Maps integration

---

## 🚑 Project Architecture & Workflow

### 1. Multi-Role Authentication & Access Portals
Designed with strict operational isolation and independent credentials:

- **Control Room Portal (கண்ட்ரோல் ரூம் லாகின்)**:
  - Central emergency call registration, 200m duplicate call detection, min-heap priority queue, ambulance dispatching, driver telemetry, and fleet management.
  - *Passcode*: `108` or `control108`

- **Ambulance Driver Portal (ஆம்புலன்ஸ் டிரைவர் லாகின்)**:
  - Individual driver console with turn-by-turn Google Maps GPS routing, live status state machine, audio siren synthesizer, and nearest hospital finder with bed availability.
  - *Individual PINs*: `drv-101` to `drv-107` (or master PIN `driver108`)

- **Hospital Emergency Portal (ஹாஸ்பிடல் லாகின்)**:
  - Dedicated facility console for independent bed capacity management (Emergency Beds, ICU Beds, and Oxygen Beds) saved directly to MySQL, with incoming ambulance triage tracking.
  - *Individual PINs*: `hosp-01` to `hosp-07` (or master PIN `hospital108`)

---

## 📍 Geographic Focus: Perundurai & Erode District

### The 7 Registered Erode Regional Hospitals:
1. **Govt Medical College Hospital & IRT, Perundurai** (`ERODE-HOSP-01`) — Sanatorium Campus, NH 544
2. **Erode Government Headquarters Hospital (GH)** (`ERODE-HOSP-02`) — Brough Road, Near Clock Tower, Erode
3. **Lotus Hospital & Research Centre** (`ERODE-HOSP-03`) — Poondurai Road, Kollampalayam, Erode
4. **Care 24 Hospital / Maruthi Medical Center** (`ERODE-HOSP-04`) — Perundurai Road, Near Collectorate, Erode
5. **Sudha Hospitals (Trauma & Critical Care)** (`ERODE-HOSP-05`) — Perundurai Road, Erode
6. **Thangam Hospital & Emergency Center** (`ERODE-HOSP-06`) — Bhavani Road, Perundurai
7. **Government Hospital, Bhavani** (`ERODE-HOSP-07`) — Mettur Main Road, Varnapuram, Bhavani

### The 7 Stationed 108 Ambulances & Drivers:
1. `AMB-101` (`TN 01 G 1081`) — Driver: **Murugan R.** (`DRV-101`) | Advanced Life Support (ALS) | Perundurai Old Bus Stand Hub
2. `AMB-102` (`TN 01 G 1082`) — Driver: **Senthil Kumar** (`DRV-102`) | Basic Life Support (BLS) | Chithode Bypass Toll Hub
3. `AMB-103` (`TN 02 G 1083`) — Driver: **Karthik Raja** (`DRV-103`) | Advanced Cardiac Life Support | Erode Railway Station / GH Post
4. `AMB-104` (`TN 02 G 1084`) — Driver: **Venkatesh S.** (`DRV-104`) | Basic Life Support (BLS) | Thindal Ring Road Post
5. `AMB-105` (`TN 03 G 1085`) — Driver: **Praveen Anand** (`DRV-105`) | Basic Life Support (BLS) | Modakkurichi / Solar Post
6. `AMB-106` (`TN 03 G 1086`) — Driver: **Deepak Natarajan** (`DRV-106`) | Advanced Life Support (ALS) | Bhavani New Bus Stand Hub
7. `AMB-107` (`TN-33-G-1087`) — Driver: **Ramesh Kumar** (`DRV-107`) | Advanced Life Support (ALS) | IRT Medical College Campus, Perundurai

---

## ⚙️ Core Technical Features

### 1. Haversine Duplicate Call Detection
- Calculates great-circle distance between incoming emergency registrations and active incidents.
- Configurable **200-metre radius** and **10-minute time window**.
- Prompts operator to either Link Call (Corroborate duplicate report) or Register Separate Incident.

### 2. Priority Queue using Min-Heap
- **Primary key**: Severity (`High` = Rank 1, `Medium` = Rank 2, `Low` = Rank 3).
- **Secondary key**: Registration timestamp (earlier waiting calls prioritized).
- Recommends the highest-priority incident for immediate dispatch.

### 3. Separate Distance & Nearest Ambulance Recommendation
- Kept strictly decoupled from the incident priority queue.
- Scans all ambulances with `Available` status.
- Calculates road distance using Haversine formula and estimates ETA in minutes.
- Prevents double dispatching (dispatched or maintenance ambulances cannot receive another emergency).

### 4. Ambulance Driver Workflow State Machine
1. `Accept Dispatch` &rarr; Status: **En Route to Scene**
2. `Arrived at Scene` &rarr; Status: **At Scene**
3. `Patient Picked Up` &rarr; Status: **Patient Picked Up** (Triggers nearest hospital recommendation with available beds)
4. `Start Hospital Trip` &rarr; Status: **En Route to Hospital**
5. `Trip Completed` &rarr; Status: **Completed** (Reverts ambulance to **Available**, creates trip audit record in MySQL).

### 5. Web Audio API Emergency Siren
- Built-in two-tone emergency siren synthesizer using standard browser Web Audio API.
- Operates client-side without external media assets.

---

## 🚀 How to Run the Project

### Prerequisites
- Java JDK 17+ or JDK 21+
- Node.js 18+ (Node v20+)
- MySQL Database Server (e.g. XAMPP on localhost:3306)

### 1. Database Setup
1. Start MySQL in XAMPP (Port 3306).
2. Create or verify database: `smart_emergency_ambulance_dispatcher`.
3. Import `smart_emergency_ambulance_dispatcher.sql` and `schema_patch.sql`.

### 2. Single-Click Launch (Recommended)
Double-click:
```bat
start_all.bat
```
This automatically starts both the Java Backend on port 8001 and the Vite Frontend on port 5173.

### 3. Manual Startup

**Backend (Java):**
```bat
run_backend.bat
```
Backend API runs at: `http://localhost:8001/`

**Frontend (React + Vite):**
```bat
run_frontend.bat
```
Frontend Web Application runs at: `http://localhost:5173/`

---

## 🧪 Automated System Verification
Run the automated verification suite to test all 7 hospitals, 7 drivers, dispatch isolation, double-dispatch prevention, and independent bed management:
```powershell
powershell.exe -ExecutionPolicy Bypass -File test_verification.ps1
```
