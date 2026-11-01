import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from database import db
from haversine import haversine_distance_km, haversine_distance_m, check_duplicate_incident
from priority_queue import IncidentPriorityQueue
from models import (
    IncidentCreate,
    IncidentLinkRequest,
    DuplicateCheckRequest,
    CallForwardRequest,
    DispatchConfirmRequest,
    DriverStatusUpdateRequest,
    HospitalBedUpdate,
    AmbulanceStatusToggle
)

app = FastAPI(
    title="108 Emergency Ambulance Dispatch System API",
    description="Emergency dispatch control room, priority queue, driver navigation, and hospital coordination.",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "system": "108 Emergency Ambulance Dispatch System",
        "region": "Perundurai & Erode District, Tamil Nadu",
        "status": "Operational",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health_check():
    stats = db.get_stats()
    return {
        "status": "Healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "storage": stats.get("storage_mode", "Persistent JSON")
    }

# ==========================================
# 1. CONTROL ROOM DASHBOARD & STATS
# ==========================================

@app.get("/api/stats")
def get_dashboard_stats():
    return db.get_stats()

@app.get("/api/notifications")
def get_notifications():
    return db.get_notifications()

# ==========================================
# 2. EMERGENCY CALL REGISTRATION & DUPLICATE DETECTION
# ==========================================

@app.post("/api/duplicate-check")
def check_duplicate(payload: DuplicateCheckRequest):
    """
    Check if a call at given coordinates is within configurable radius (200m)
    and time window (10 mins) of an active incident using Haversine formula.
    """
    now_iso = payload.created_at or datetime.now(timezone.utc).isoformat()
    active_incidents = db.get_incidents(active_only=True)
    duplicate_info = check_duplicate_incident(
        new_lat=payload.latitude,
        new_lon=payload.longitude,
        new_time_iso=now_iso,
        active_incidents=active_incidents,
        radius_meters=payload.radius_meters or 200.0,
        time_window_minutes=payload.time_window_minutes or 10.0
    )
    if duplicate_info:
        return {"is_duplicate": True, "duplicate_data": duplicate_info}
    return {"is_duplicate": False, "duplicate_data": None}

@app.post("/api/incidents")
def register_incident(payload: IncidentCreate, bypass_duplicate_check: bool = False):
    """
    Register a new emergency call and generate unique Incident ID (e.g. INC-10801).
    Performs duplicate check unless bypassed by the operator.
    """
    now_iso = datetime.now(timezone.utc).isoformat()

    if not bypass_duplicate_check:
        active_incidents = db.get_incidents(active_only=True)
        dup = check_duplicate_incident(
            new_lat=payload.latitude,
            new_lon=payload.longitude,
            new_time_iso=now_iso,
            active_incidents=active_incidents,
            radius_meters=200.0,
            time_window_minutes=10.0
        )
        if dup:
            return {
                "status": "duplicate_detected",
                "message": "Potential duplicate incident detected within 200m and 10 mins window.",
                "duplicate_data": dup,
                "incident": None
            }

    # Generate unique Incident ID
    all_incidents = db.get_incidents()
    next_num = 10801 + len(all_incidents)
    inc_id = f"INC-{next_num}"

    new_incident = {
        "id": inc_id,
        "caller_phone": payload.caller_phone,
        "caller_name": payload.caller_name or "Anonymous Caller",
        "location_name": payload.location_name,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "incident_type": payload.incident_type,
        "severity": payload.severity,  # High, Medium, Low
        "ambulances_required": payload.ambulances_required,
        "status": "Registered",
        "assigned_ambulance_id": None,
        "assigned_ambulance_details": None,
        "created_at": now_iso,
        "notes": payload.notes or "",
        "caller_logs": [
            {
                "caller_phone": payload.caller_phone,
                "caller_name": payload.caller_name,
                "timestamp": now_iso,
                "note": "Primary registration"
            }
        ]
    }

    created = db.create_incident(new_incident)
    return {
        "status": "success",
        "message": f"Incident {inc_id} successfully registered.",
        "incident": created
    }

@app.post("/api/incidents/{incident_id}/link")
def link_duplicate_call(incident_id: str, payload: IncidentLinkRequest):
    """
    Operator chooses to link an incoming call to an existing active incident.
    """
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    now_iso = datetime.now(timezone.utc).isoformat()
    logs = incident.get("caller_logs", [])
    logs.append({
        "caller_phone": payload.caller_phone,
        "caller_name": payload.caller_name,
        "timestamp": now_iso,
        "note": f"Linked call: {payload.notes or 'Duplicate caller corroborating incident'}"
    })
    
    existing_notes = incident.get("notes", "")
    updated_notes = f"{existing_notes} | Linked Call from {payload.caller_phone}: {payload.notes}".strip(" | ")

    updated = db.update_incident(incident_id, {
        "caller_logs": logs,
        "notes": updated_notes
    })

    db.add_notification_internal(
        title=f"Call Linked to {incident_id}",
        message=f"Additional caller {payload.caller_phone} linked to incident {incident_id}.",
        notif_type="info"
    )

    return {"status": "success", "message": f"Call linked to {incident_id}", "incident": updated}

@app.get("/api/incidents")
def list_incidents(active_only: bool = False):
    return db.get_incidents(active_only=active_only)

@app.get("/api/incidents/{incident_id}")
def get_incident(incident_id: str):
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

# ==========================================
# 3. CONTROL ROOM CALL FORWARDING
# ==========================================

@app.post("/api/call-forward")
def forward_call(payload: CallForwardRequest):
    """
    Simulate forwarding an incoming call to a configured neighbouring control room.
    Displays receiving control room and forwarding status immediately without normal queue.
    """
    forward_id = f"FWD-108-{int(datetime.now(timezone.utc).timestamp()) % 10000}"
    timestamp = datetime.now(timezone.utc).isoformat()

    db.add_notification_internal(
        title=f"Call Forwarded to {payload.target_control_room}",
        message=f"Caller {payload.caller_phone} ({payload.incident_type} at {payload.location_name}) rerouted successfully. Operator busy.",
        notif_type="urgent"
    )

    return {
        "status": "Forwarded",
        "forward_id": forward_id,
        "receiving_control_room": payload.target_control_room,
        "caller_phone": payload.caller_phone,
        "location": payload.location_name,
        "timestamp": timestamp,
        "message": f"Emergency call successfully forwarded to {payload.target_control_room} (External Telephony Simulated)."
    }

# ==========================================
# 4. PRIORITY QUEUE (MIN-HEAP)
# ==========================================

@app.get("/api/priority-queue")
def get_priority_queue():
    """
    Organise registered active incidents using Min-Heap:
    1. Emergency Severity: High (1), Medium (2), Low (3).
    2. Waiting time: Earlier registered timestamp gets higher priority.
    Returns the ordered queue and highlights the highest-priority incident.
    """
    active_incidents = db.get_incidents(active_only=True)
    # Only incidents waiting for dispatch or registered
    pending_incidents = [i for i in active_incidents if i.get("status") in ["Registered", "Pending Dispatch"]]

    pq = IncidentPriorityQueue()
    for inc in pending_incidents:
        pq.push(inc)

    ordered_list = pq.get_ordered_list()
    top_recommendation = pq.peek()

    return {
        "total_queued": len(ordered_list),
        "recommended_for_dispatch": top_recommendation,
        "priority_queue": ordered_list
    }

# ==========================================
# 5. AMBULANCE DISTANCE & DISPATCH RECOMMENDATION
# ==========================================

@app.get("/api/dispatch/recommend/{incident_id}")
def recommend_ambulance(incident_id: str):
    """
    For a given incident:
    1. Find available ambulances.
    2. Calculate distance from incident using Haversine formula.
    3. Recommend the nearest available ambulance.
    Priority scheduling is kept strictly separate from distance calculation.
    """
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    ambulances = db.get_ambulances()
    available_ambs = [a for a in ambulances if a.get("status") == "Available"]

    if not available_ambs:
        return {
            "incident": incident,
            "available_ambulances_count": 0,
            "recommended_ambulance": None,
            "ranked_ambulances": [],
            "message": "No ambulances currently available in fleet."
        }

    inc_lat = incident["latitude"]
    inc_lon = incident["longitude"]

    ranked = []
    for amb in available_ambs:
        dist_km = haversine_distance_km(inc_lat, inc_lon, amb["latitude"], amb["longitude"])
        # Estimate ETA assuming average emergency speed of 45 km/h in city/semi-urban Perundurai-Erode
        eta_minutes = round((dist_km / 45.0) * 60, 1) + 2  # 2 min dispatch mobilization
        ranked.append({
            **amb,
            "distance_km": dist_km,
            "eta_minutes": max(eta_minutes, 3.0)
        })

    # Sort by nearest distance
    ranked.sort(key=lambda x: x["distance_km"])
    recommended = ranked[0]

    return {
        "incident": incident,
        "available_ambulances_count": len(ranked),
        "recommended_ambulance": recommended,
        "ranked_ambulances": ranked
    }

@app.post("/api/dispatch/confirm")
def confirm_dispatch(payload: DispatchConfirmRequest):
    """
    Operator confirms ambulance dispatch:
    - Update ambulance status to 'Dispatched'
    - Update incident status to 'Dispatched'
    - Assign incident details to ambulance
    - Send in-app notification to driver
    """
    incident = db.get_incident(payload.incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    ambulance = db.get_ambulance(payload.ambulance_id)
    if not ambulance:
        raise HTTPException(status_code=404, detail="Ambulance not found")

    now_iso = datetime.now(timezone.utc).isoformat()

    # Update ambulance
    updated_amb = db.update_ambulance(payload.ambulance_id, {
        "status": "Dispatched",
        "assigned_incident_id": payload.incident_id,
        "assigned_incident": {
            "id": incident["id"],
            "location_name": incident["location_name"],
            "latitude": incident["latitude"],
            "longitude": incident["longitude"],
            "incident_type": incident["incident_type"],
            "severity": incident["severity"],
            "caller_phone": incident["caller_phone"],
            "notes": incident.get("notes", "")
        },
        "dispatch_time": now_iso
    })

    # Update incident
    updated_inc = db.update_incident(payload.incident_id, {
        "status": "Dispatched",
        "assigned_ambulance_id": payload.ambulance_id,
        "assigned_ambulance_details": {
            "vehicle_no": ambulance["vehicle_no"],
            "driver_name": ambulance["driver_name"],
            "driver_phone": ambulance["driver_phone"]
        },
        "dispatched_at": now_iso
    })

    # Add driver alert notification
    db.add_notification_internal(
        title=f"Dispatch Alert: {payload.ambulance_id}",
        message=f"{ambulance['vehicle_no']} dispatched to {incident['location_name']} for {incident['incident_type']}.",
        notif_type="urgent"
    )

    return {
        "status": "success",
        "message": f"Ambulance {payload.ambulance_id} dispatched to incident {payload.incident_id}.",
        "ambulance": updated_amb,
        "incident": updated_inc
    }

# ==========================================
# 6. AMBULANCE FLEET MANAGEMENT
# ==========================================

@app.get("/api/ambulances")
def list_ambulances():
    return db.get_ambulances()

@app.get("/api/ambulances/{ambulance_id}")
def get_ambulance(ambulance_id: str):
    amb = db.get_ambulance(ambulance_id)
    if not amb:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    return amb

@app.post("/api/ambulances/{ambulance_id}/status")
def toggle_ambulance_status(ambulance_id: str, payload: AmbulanceStatusToggle):
    """
    Allow administrator to mark an ambulance Available or Maintenance/Unavailable.
    """
    amb = db.get_ambulance(ambulance_id)
    if not amb:
        raise HTTPException(status_code=404, detail="Ambulance not found")

    if payload.status not in ["Available", "Maintenance", "Unavailable"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    updated = db.update_ambulance(ambulance_id, {
        "status": payload.status,
        "maintenance_notes": payload.notes or ""
    })

    db.add_notification_internal(
        title=f"Fleet Update: {ambulance_id}",
        message=f"Status set to {payload.status}.",
        notif_type="info"
    )

    return {"status": "success", "ambulance": updated}

# ==========================================
# 7. DRIVER WORKFLOW & STATUS UPDATES
# ==========================================

@app.post("/api/driver/status")
def update_driver_status(payload: DriverStatusUpdateRequest):
    """
    Ambulance Driver status progression:
    1. 'En Route to Scene' (Accept Dispatch)
    2. 'At Scene' (Arrived at Scene)
    3. 'Patient Picked Up' (triggers Hospital Recommendation)
    4. 'En Route to Hospital' (Start Hospital Trip)
    5. 'Completed' (Trip Completed) -> Updates stats & makes ambulance Available
    """
    amb = db.get_ambulance(payload.ambulance_id)
    if not amb:
        raise HTTPException(status_code=404, detail="Ambulance not found")

    now_iso = datetime.now(timezone.utc).isoformat()
    inc_id = payload.incident_id or amb.get("assigned_incident_id")
    incident = db.get_incident(inc_id) if inc_id else None

    updates: Dict[str, Any] = {"status": payload.status}

    if payload.current_latitude is not None and payload.current_longitude is not None:
        updates["latitude"] = payload.current_latitude
        updates["longitude"] = payload.current_longitude

    if payload.selected_hospital_id:
        updates["target_hospital_id"] = payload.selected_hospital_id

    # Handle Trip Completion
    if payload.status in ["Completed", "Trip Completed"]:
        # Mark Incident Completed
        if incident:
            db.update_incident(incident["id"], {
                "status": "Completed",
                "completed_at": now_iso
            })

        # Calculate trip metrics
        target_hosp = db.get_hospital(payload.selected_hospital_id or amb.get("target_hospital_id", "HOSP-01"))
        hosp_name = target_hosp["name"] if target_hosp else "Govt Medical College Hospital & IRT, Perundurai"

        # Create Trip record
        all_trips = db.get_trips()
        trip_id = f"TRIP-{10801 + len(all_trips)}"
        trip_record = {
            "trip_id": trip_id,
            "incident_id": inc_id or "INC-UNKNOWN",
            "incident_type": incident.get("incident_type", "Emergency") if incident else "Medical",
            "ambulance_id": amb["id"],
            "vehicle_no": amb["vehicle_no"],
            "driver_name": amb["driver_name"],
            "caller_phone": incident.get("caller_phone", "N/A") if incident else "N/A",
            "patient_location": incident.get("location_name", "Perundurai/Erode") if incident else "Perundurai",
            "hospital_name": hosp_name,
            "dispatch_time": amb.get("dispatch_time", now_iso),
            "completion_time": now_iso,
            "duration_minutes": 25,
            "distance_km": 7.2,
            "outcome": "Patient transported safely to hospital care unit."
        }
        db.create_trip(trip_record)

        # Set ambulance status back to Available
        updates["status"] = "Available"
        updates["assigned_incident_id"] = None
        updates["assigned_incident"] = None
        updates["target_hospital_id"] = None

        db.add_notification_internal(
            title=f"Trip Completed: {amb['id']}",
            message=f"{amb['vehicle_no']} completed trip to {hosp_name}. Ambulance is now Available for next dispatch.",
            notif_type="success"
        )
    else:
        # Update incident status to mirror ambulance progression
        if incident:
            db.update_incident(incident["id"], {"status": payload.status})

        # Specific notification for driver acceptance
        if payload.status == "En Route to Scene":
            db.add_notification_internal(
                title="Ambulance Dispatched & Driver Accepted",
                message=f"Driver {amb['driver_name']} ({amb['vehicle_no']}) has accepted the dispatch for {incident.get('id', 'Incident')}!",
                notif_type="driver_accepted"
            )
        else:
            db.add_notification_internal(
                title=f"Driver Update: {amb['vehicle_no']}",
                message=f"Driver status changed to '{payload.status}'.",
                notif_type="info"
            )

    updated_amb = db.update_ambulance(payload.ambulance_id, updates)
    return {
        "status": "success",
        "ambulance": updated_amb,
        "driver_status": payload.status,
        "is_completed": payload.status in ["Completed", "Trip Completed"]
    }

# ==========================================
# 8. HOSPITAL MANAGEMENT & BED AVAILABILITY
# ==========================================

@app.get("/api/hospitals")
def list_hospitals():
    return db.get_hospitals()

@app.get("/api/hospitals/recommend/{incident_id}")
def recommend_hospital_for_patient(incident_id: str, require_icu: bool = False):
    """
    When patient is picked up, calculate distances from the patient's incident
    to hospitals in Perundurai and Erode with available emergency/ICU beds.
    Recommends the nearest suitable hospital!
    """
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    hospitals = db.get_hospitals()
    inc_lat = incident["latitude"]
    inc_lon = incident["longitude"]

    scored_hospitals = []
    for h in hospitals:
        # Check bed availability
        beds_ok = (h.get("emergency_beds", 0) > 0)
        if require_icu or incident.get("severity") == "High":
            beds_ok = beds_ok and (h.get("icu_beds", 0) > 0)

        dist_km = haversine_distance_km(inc_lat, inc_lon, h["latitude"], h["longitude"])
        scored_hospitals.append({
            **h,
            "distance_km": dist_km,
            "eta_minutes": max(round((dist_km / 40.0) * 60, 1), 3.0),
            "beds_available": beds_ok
        })

    # Sort primarily by bed availability, then by nearest distance
    scored_hospitals.sort(key=lambda x: (not x["beds_available"], x["distance_km"]))
    recommended = scored_hospitals[0] if scored_hospitals else None

    return {
        "incident": incident,
        "recommended_hospital": recommended,
        "all_hospitals": scored_hospitals
    }

@app.put("/api/hospitals/{hospital_id}/beds")
def update_hospital_beds(hospital_id: str, payload: HospitalBedUpdate):
    """
    Allow hospital bed counts to be updated in real-time.
    """
    hosp = db.get_hospital(hospital_id)
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found")

    updated = db.update_hospital_beds(hospital_id, {
        "emergency_beds": max(0, payload.emergency_beds),
        "icu_beds": max(0, payload.icu_beds),
        "oxygen_beds": max(0, payload.oxygen_beds)
    })

    db.add_notification_internal(
        title=f"Bed Update: {hosp['name'][:25]}...",
        message=f"Emergency: {payload.emergency_beds}, ICU: {payload.icu_beds}, O2: {payload.oxygen_beds}",
        notif_type="info"
    )

    return {"status": "success", "hospital": updated}

# ==========================================
# 9. TRIP HISTORY & REPORTS
# ==========================================

@app.get("/api/trips")
def list_trips(
    ambulance_id: Optional[str] = None,
    incident_type: Optional[str] = None,
    search: Optional[str] = None
):
    trips = db.get_trips()
    filtered = trips

    if ambulance_id:
        filtered = [t for t in filtered if t.get("ambulance_id") == ambulance_id]

    if incident_type:
        filtered = [t for t in filtered if incident_type.lower() in t.get("incident_type", "").lower()]

    if search:
        s = search.lower()
        filtered = [
            t for t in filtered
            if s in t.get("trip_id", "").lower()
            or s in t.get("incident_id", "").lower()
            or s in t.get("driver_name", "").lower()
            or s in t.get("hospital_name", "").lower()
            or s in t.get("patient_location", "").lower()
        ]

    return filtered

# ==========================================
# 10. SYSTEM RESET FOR DEMO
# ==========================================

@app.post("/api/reset")
def reset_system():
    """Reset system to initial clean state with sample data."""
    db.reset()
    return {"status": "success", "message": "System reset to sample state."}
