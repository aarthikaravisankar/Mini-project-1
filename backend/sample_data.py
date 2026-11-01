from datetime import datetime, timezone, timedelta

def get_initial_hospitals():
    return [
        {
            "id": "HOSP-01",
            "name": "Govt Medical College Hospital & IRT, Perundurai",
            "location_name": "Sanatorium, Perundurai, Erode District",
            "latitude": 11.2652,
            "longitude": 77.5855,
            "emergency_beds": 45,
            "icu_beds": 18,
            "oxygen_beds": 35,
            "total_beds": 120,
            "contact_phone": "+91 4294 220912",
            "type": "Government Medical College / Trauma Care",
            "simulated": True
        },
        {
            "id": "HOSP-02",
            "name": "Erode Government Headquarters Hospital (GH)",
            "location_name": "Brough Road, Erode",
            "latitude": 11.3410,
            "longitude": 77.7280,
            "emergency_beds": 50,
            "icu_beds": 22,
            "oxygen_beds": 40,
            "total_beds": 150,
            "contact_phone": "+91 424 225 8333",
            "type": "District Headquarters Hospital",
            "simulated": True
        },
        {
            "id": "HOSP-03",
            "name": "Lotus Hospital & Research Centre",
            "location_name": "Poondurai Road, Kollampalayam, Erode",
            "latitude": 11.3325,
            "longitude": 77.7245,
            "emergency_beds": 24,
            "icu_beds": 12,
            "oxygen_beds": 20,
            "total_beds": 75,
            "contact_phone": "+91 424 228 2828",
            "type": "Multi-Speciality & Cardiac Care",
            "simulated": True
        },
        {
            "id": "HOSP-04",
            "name": "Care 24 Hospital / Maruthi Medical Center",
            "location_name": "Perundurai Road, Near Collectorate, Erode",
            "latitude": 11.3392,
            "longitude": 77.7058,
            "emergency_beds": 20,
            "icu_beds": 8,
            "oxygen_beds": 15,
            "total_beds": 60,
            "contact_phone": "+91 424 226 2266",
            "type": "24/7 Emergency & Critical Care",
            "simulated": True
        },
        {
            "id": "HOSP-05",
            "name": "Sudha Hospitals (Trauma & Critical Care)",
            "location_name": "Perundurai Road, Erode",
            "latitude": 11.3435,
            "longitude": 77.7112,
            "emergency_beds": 18,
            "icu_beds": 10,
            "oxygen_beds": 16,
            "total_beds": 55,
            "contact_phone": "+91 424 226 5500",
            "type": "Trauma & Multispeciality",
            "simulated": True
        },
        {
            "id": "HOSP-06",
            "name": "Thangam Hospital & Emergency Center",
            "location_name": "Bhavani Road, Perundurai",
            "latitude": 11.2750,
            "longitude": 77.5920,
            "emergency_beds": 16,
            "icu_beds": 6,
            "oxygen_beds": 12,
            "total_beds": 40,
            "contact_phone": "+91 4294 221234",
            "type": "Emergency Care & Surgical Unit",
            "simulated": True
        }
    ]

def get_initial_ambulances():
    return [
        {
            "id": "AMB-108-01",
            "vehicle_no": "TN-33-G-1081",
            "type": "Advanced Life Support (ALS)",
            "driver_name": "Ramesh Kumar",
            "driver_phone": "+91 98421 10801",
            "base_station": "Perundurai Bus Stand Hub",
            "latitude": 11.2780,
            "longitude": 77.5840,
            "status": "Available",
            "assigned_incident_id": None,
            "assigned_incident": None,
            "last_updated": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "AMB-108-02",
            "vehicle_no": "TN-33-G-1082",
            "type": "Basic Life Support (BLS)",
            "driver_name": "Senthil Nathan",
            "driver_phone": "+91 98421 10802",
            "base_station": "Chithode Bypass Toll Hub",
            "latitude": 11.3780,
            "longitude": 77.6710,
            "status": "Available",
            "assigned_incident_id": None,
            "assigned_incident": None,
            "last_updated": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "AMB-108-03",
            "vehicle_no": "TN-33-G-1083",
            "type": "ALS Trauma Unit",
            "driver_name": "Murugesan P.",
            "driver_phone": "+91 98421 10803",
            "base_station": "Erode Railway Station / GH Post",
            "latitude": 11.3400,
            "longitude": 77.7250,
            "status": "Available",
            "assigned_incident_id": None,
            "assigned_incident": None,
            "last_updated": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "AMB-108-04",
            "vehicle_no": "TN-33-G-1084",
            "type": "Neonatal / BLS",
            "driver_name": "Karthik Raja",
            "driver_phone": "+91 98421 10804",
            "base_station": "Thindal Ring Road Post",
            "latitude": 11.3250,
            "longitude": 77.6750,
            "status": "Available",
            "assigned_incident_id": None,
            "assigned_incident": None,
            "last_updated": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "AMB-108-05",
            "vehicle_no": "TN-33-G-1085",
            "type": "Basic Life Support (BLS)",
            "driver_name": "Vijay Anand",
            "driver_phone": "+91 98421 10805",
            "base_station": "Modakkurichi / Solar Post",
            "latitude": 11.2950,
            "longitude": 77.7400,
            "status": "Maintenance",
            "assigned_incident_id": None,
            "assigned_incident": None,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    ]

def get_initial_incidents():
    now = datetime.now(timezone.utc)
    return [
        {
            "id": "INC-10801",
            "caller_phone": "9842234567",
            "caller_name": "Prakash M",
            "location_name": "Perundurai Old Bus Stand, Perundurai",
            "latitude": 11.2785,
            "longitude": 77.5835,
            "incident_type": "Road Traffic Accident",
            "severity": "High",
            "ambulances_required": 1,
            "status": "Registered",
            "assigned_ambulance_id": None,
            "created_at": (now - timedelta(minutes=6)).isoformat(),
            "notes": "Two-wheeler collision, head injury reported."
        },
        {
            "id": "INC-10802",
            "caller_phone": "9443312345",
            "caller_name": "Revathi S",
            "location_name": "Kongu Engineering College Gate 2, Perundurai",
            "latitude": 11.2720,
            "longitude": 77.6070,
            "incident_type": "Severe Trauma / Fracture",
            "severity": "Medium",
            "ambulances_required": 1,
            "status": "Registered",
            "assigned_ambulance_id": None,
            "created_at": (now - timedelta(minutes=3)).isoformat(),
            "notes": "Pedestrian slip with ankle and knee trauma."
        }
    ]

def get_initial_trips():
    now = datetime.now(timezone.utc)
    return [
        {
            "trip_id": "TRIP-10801",
            "incident_id": "INC-10799",
            "incident_type": "Cardiac Arrest",
            "ambulance_id": "AMB-108-01",
            "vehicle_no": "TN-33-G-1081",
            "driver_name": "Ramesh Kumar",
            "caller_phone": "9789012345",
            "patient_location": "Bhavani Road, Perundurai",
            "hospital_name": "Govt Medical College Hospital & IRT, Perundurai",
            "dispatch_time": (now - timedelta(hours=2, minutes=15)).isoformat(),
            "pickup_time": (now - timedelta(hours=2)).isoformat(),
            "completion_time": (now - timedelta(hours=1, minutes=30)).isoformat(),
            "duration_minutes": 45,
            "distance_km": 6.8,
            "outcome": "Patient safely admitted to ICU"
        },
        {
            "trip_id": "TRIP-10802",
            "incident_id": "INC-10800",
            "incident_type": "Pregnancy / Emergency Labor",
            "ambulance_id": "AMB-108-03",
            "vehicle_no": "TN-33-G-1083",
            "driver_name": "Murugesan P.",
            "caller_phone": "9944056789",
            "patient_location": "Thindal Hill Road, Erode",
            "hospital_name": "Erode Government Headquarters Hospital (GH)",
            "dispatch_time": (now - timedelta(hours=4, minutes=10)).isoformat(),
            "pickup_time": (now - timedelta(hours=3, minutes=50)).isoformat(),
            "completion_time": (now - timedelta(hours=3, minutes=15)).isoformat(),
            "duration_minutes": 55,
            "distance_km": 8.4,
            "outcome": "Safe delivery unit admission"
        }
    ]
