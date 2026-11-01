from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class IncidentCreate(BaseModel):
    caller_phone: str
    caller_name: Optional[str] = "Anonymous"
    location_name: str
    latitude: float
    longitude: float
    incident_type: str
    severity: str = "High"  # High, Medium, Low
    ambulances_required: int = 1
    notes: Optional[str] = ""

class IncidentLinkRequest(BaseModel):
    existing_incident_id: str
    caller_phone: str
    caller_name: Optional[str] = ""
    notes: Optional[str] = ""

class DuplicateCheckRequest(BaseModel):
    latitude: float
    longitude: float
    created_at: Optional[str] = None
    radius_meters: Optional[float] = 200.0
    time_window_minutes: Optional[float] = 10.0

class CallForwardRequest(BaseModel):
    caller_phone: str
    caller_name: Optional[str] = ""
    location_name: str
    latitude: float
    longitude: float
    incident_type: str
    severity: str = "High"
    target_control_room: str = "Coimbatore Regional 108 Command"

class DispatchConfirmRequest(BaseModel):
    incident_id: str
    ambulance_id: str
    operator_notes: Optional[str] = ""

class DriverStatusUpdateRequest(BaseModel):
    ambulance_id: str
    incident_id: Optional[str] = None
    status: str  # "En Route to Scene", "At Scene", "Patient Picked Up", "En Route to Hospital", "Completed"
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    selected_hospital_id: Optional[str] = None
    notes: Optional[str] = ""

class HospitalBedUpdate(BaseModel):
    emergency_beds: int
    icu_beds: int
    oxygen_beds: int

class AmbulanceStatusToggle(BaseModel):
    status: str  # "Available" or "Maintenance"
    notes: Optional[str] = ""
