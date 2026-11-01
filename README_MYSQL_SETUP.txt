===================================================================================
108 EMERGENCY AMBULANCE DISPATCH SYSTEM - PERUNDURAI & ERODE CONTROL COMMAND HUB
MYSQL DATABASE SETUP, CONFIGURATION, AND TARGETED ARCHITECTURE GUIDE
===================================================================================

This document provides complete instructions for running the 108 Emergency Ambulance 
Dispatch System connected directly to your existing MySQL database:
Database Name: smart_emergency_ambulance_dispatcher

-----------------------------------------------------------------------------------
1. THE 7 ACTIVE ERODE REGIONAL HOSPITALS
-----------------------------------------------------------------------------------
Only the 7 hospitals located in and around Perundurai and Erode District are shown 
in the active operational interfaces (Hospital Dashboard, Control Room, Driver Dashboard, 
and dropdowns). Other hospitals remain completely preserved in MySQL:

1. ERODE-HOSP-01: Govt Medical College Hospital & IRT, Perundurai
   - Address: Sanatorium Campus, NH 544, Perundurai, Erode District - 638053
   - Login PIN: hosp-01 (or master PIN: hospital108)
2. ERODE-HOSP-02: Erode Government Headquarters Hospital (GH)
   - Address: Brough Road, Near Clock Tower, Erode - 638001
   - Login PIN: hosp-02 (or master PIN: hospital108)
3. ERODE-HOSP-03: Lotus Hospital & Research Centre
   - Address: Poondurai Road, Kollampalayam, Erode - 638002
   - Login PIN: hosp-03 (or master PIN: hospital108)
4. ERODE-HOSP-04: Care 24 Hospital / Maruthi Medical Center
   - Address: Perundurai Road, Near Collectorate, Erode - 638011
   - Login PIN: hosp-04 (or master PIN: hospital108)
5. ERODE-HOSP-05: Sudha Hospitals (Trauma & Critical Care)
   - Address: Perundurai Road, Erode - 638011
   - Login PIN: hosp-05 (or master PIN: hospital108)
6. ERODE-HOSP-06: Thangam Hospital & Emergency Center
   - Address: Bhavani Road, Perundurai - 638052
   - Login PIN: hosp-06 (or master PIN: hospital108)
7. ERODE-HOSP-07: Government Hospital, Bhavani
   - Address: Mettur Main Road, Varnapuram, Bhavani, Erode District - 638301
   - Login PIN: hosp-07 (or master PIN: hospital108)

Independent Bed Management:
- Each hospital logs into its own dedicated console.
- Each hospital views and adjusts its own Emergency, ICU, and Oxygen beds independently.
- Updating one hospital updates only that hospital's database record in MySQL.
- Other hospitals cannot be accidentally overwritten.

-----------------------------------------------------------------------------------
2. THE 7 ACTIVE DRIVERS & AMBULANCES
-----------------------------------------------------------------------------------
The system features exactly 7 active drivers and their associated ambulances throughout:

1. Murugan R. (ALS Pilot)
   - Ambulance ID: AMB-101 | Driver ID: DRV-101 | Vehicle No: TN 01 G 1081
   - Base Station: Perundurai Old Bus Stand Hub (11.2780, 77.5840)
   - Login PIN: drv-101 (or master PIN: driver108)
2. Senthil Kumar (BLS Pilot)
   - Ambulance ID: AMB-102 | Driver ID: DRV-102 | Vehicle No: TN 01 G 1082
   - Base Station: Chithode Bypass Toll Hub (11.3910, 77.6830)
   - Login PIN: drv-102 (or master PIN: driver108)
3. Karthik Raja (ACLS Pilot)
   - Ambulance ID: AMB-103 | Driver ID: DRV-103 | Vehicle No: TN 02 G 1083
   - Base Station: Erode Railway Station / GH Post (11.3400, 77.7250)
   - Login PIN: drv-103 (or master PIN: driver108)
4. Venkatesh S. (BLS Pilot)
   - Ambulance ID: AMB-104 | Driver ID: DRV-104 | Vehicle No: TN 02 G 1084
   - Base Station: Thindal Ring Road Post (11.3250, 77.6750)
   - Login PIN: drv-104 (or master PIN: driver108)
5. Praveen Anand (BLS Pilot)
   - Ambulance ID: AMB-105 | Driver ID: DRV-105 | Vehicle No: TN 03 G 1085
   - Base Station: Modakkurichi / Solar Post (11.2950, 77.7400)
   - Login PIN: drv-105 (or master PIN: driver108)
6. Deepak Natarajan (ALS Pilot)
   - Ambulance ID: AMB-106 | Driver ID: DRV-106 | Vehicle No: TN 03 G 1086
   - Base Station: Bhavani New Bus Stand Hub (11.4480, 77.6830)
   - Login PIN: drv-106 (or master PIN: driver108)
7. Ramesh Kumar (ALS Pilot)
   - Ambulance ID: AMB-107 | Driver ID: DRV-107 | Vehicle No: TN-33-G-1087
   - Base Station: IRT Medical College Campus, Perundurai (11.2650, 77.5850)
   - Login PIN: drv-107 (or master PIN: driver108)

Independent Dispatch & Status Logic:
- If Murugan (AMB-101) is dispatched, only Murugan's assignment and status change to 'Dispatched'.
- The other 6 drivers retain their exact statuses (Available/Maintenance).
- When Murugan completes his trip, only his record and status return to Available.
- If an ambulance is under Maintenance, it is not marked Available upon trip completion.
- Double-dispatch prevention: an ambulance that is Dispatched or under Maintenance cannot be assigned another call.

-----------------------------------------------------------------------------------
3. INDEPENDENT AUTHENTICATION CREDENTIALS
-----------------------------------------------------------------------------------
A. Control Room Command Center:
   - Passcode: 108 or control108

B. Ambulance Drivers:
   - Murugan R. (AMB-101 / DRV-101): drv-101 or driver101 or driver108
   - Senthil Kumar (AMB-102 / DRV-102): drv-102 or driver102 or driver108
   - Karthik Raja (AMB-103 / DRV-103): drv-103 or driver103 or driver108
   - Venkatesh S. (AMB-104 / DRV-104): drv-104 or driver104 or driver108
   - Praveen Anand (AMB-105 / DRV-105): drv-105 or driver105 or driver108
   - Deepak Natarajan (AMB-106 / DRV-106): drv-106 or driver106 or driver108
   - Ramesh Kumar (AMB-107 / DRV-107): drv-107 or driver107 or driver108

C. Hospital Administration Desks:
   - Govt Medical College & IRT Perundurai: hosp-01 or hospital108
   - Erode Government Headquarters Hospital: hosp-02 or hospital108
   - Lotus Hospital & Research Centre: hosp-03 or hospital108
   - Care 24 Hospital / Maruthi Medical: hosp-04 or hospital108
   - Sudha Hospitals (Trauma & Critical): hosp-05 or hospital108
   - Thangam Hospital & Emergency Center: hosp-06 or hospital108
   - Government Hospital, Bhavani: hosp-07 or hospital108

-----------------------------------------------------------------------------------
4. HOW TO RUN THE PROJECT
-----------------------------------------------------------------------------------
Single-Click Start (Runs both Backend and Frontend):
   Double click: start_all.bat

Or start individually:
1. Start XAMPP MySQL (Port 3306).
2. Backend (Java):
   Double-click: run_backend.bat
   Backend runs at: http://localhost:8001/
3. Frontend (React + Vite):
   Double-click: run_frontend.bat
   Frontend runs at: http://localhost:5173/

-----------------------------------------------------------------------------------
5. AUTOMATED VERIFICATION SCRIPT
-----------------------------------------------------------------------------------
To run the automated end-to-end verification test suite:
   powershell.exe -ExecutionPolicy Bypass -File test_verification.ps1

The script verifies:
1. Exactly 7 Erode hospitals are displayed (Chennai excluded).
2. Exactly 7 drivers/ambulances are returned.
3. KPI statistics reflect fleet and hospital counts.
4. Dispatching Murugan changes only AMB-101; other 6 remain Available.
5. Double dispatching is strictly blocked.
6. Trip completion returns only the relevant ambulance to Available.
7. Independent hospital bed updates modify only the target hospital in MySQL.

===================================================================================
End of Setup Guide.
===================================================================================
