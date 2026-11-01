import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth using the Haversine formula.
    Result in kilometers.
    """
    R = 6371.0  # Earth's radius in kilometers

    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)

    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(d_lon / 2.0) ** 2)
    
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 3)

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the Haversine distance in meters.
    """
    return round(haversine_distance_km(lat1, lon1, lat2, lon2) * 1000.0, 1)

def parse_iso_datetime(dt_str: str) -> datetime:
    """Safely parse ISO string with or without Z/offset."""
    clean_str = dt_str.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(clean_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return datetime.now(timezone.utc)

def check_duplicate_incident(
    new_lat: float,
    new_lon: float,
    new_time_iso: str,
    active_incidents: List[Dict[str, Any]],
    radius_meters: float = 200.0,
    time_window_minutes: float = 10.0
) -> Optional[Dict[str, Any]]:
    """
    Compare incoming call location and timestamp against recent active incidents.
    A duplicate is flagged if:
    1. Distance <= radius_meters (default 200m)
    2. Time difference <= time_window_minutes (default 10 mins)
    """
    new_dt = parse_iso_datetime(new_time_iso)

    for incident in active_incidents:
        # Ignore completed or cancelled incidents
        if incident.get("status") in ["Completed", "Cancelled"]:
            continue

        inc_lat = incident.get("latitude")
        inc_lon = incident.get("longitude")
        if inc_lat is None or inc_lon is None:
            continue

        inc_time_str = incident.get("created_at")
        if not inc_time_str:
            continue
        inc_dt = parse_iso_datetime(inc_time_str)

        # Check time window
        time_diff_sec = abs((new_dt - inc_dt).total_seconds())
        time_diff_min = time_diff_sec / 60.0

        if time_diff_min <= time_window_minutes:
            dist_m = haversine_distance_m(new_lat, new_lon, inc_lat, inc_lon)
            if dist_m <= radius_meters:
                return {
                    "is_duplicate": True,
                    "existing_incident_id": incident.get("id"),
                    "incident_type": incident.get("incident_type"),
                    "location_name": incident.get("location_name"),
                    "distance_meters": dist_m,
                    "time_diff_minutes": round(time_diff_min, 1),
                    "current_status": incident.get("status"),
                    "caller_phone": incident.get("caller_phone")
                }

    return None
