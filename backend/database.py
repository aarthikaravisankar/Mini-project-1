import json
import os
import sys
import threading
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sample_data import (
    get_initial_ambulances,
    get_initial_hospitals,
    get_initial_incidents,
    get_initial_trips
)

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DATA_FILE = os.path.join(DATA_DIR, "database.json")

class Database:
    def __init__(self):
        self._lock = threading.RLock()
        self.use_mongo = False
        self.mongo_client = None
        self.db = None
        self._cache = {
            "ambulances": [],
            "incidents": [],
            "hospitals": [],
            "trips": [],
            "notifications": []
        }
        
        # Try connecting to MongoDB first
        try:
            import pymongo
            client = pymongo.MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=1000)
            client.server_info()  # trigger connection check
            self.mongo_client = client
            self.db = client["ambulance_108_dispatch"]
            self.use_mongo = True
            print("[Database] Successfully connected to local MongoDB instance.")
        except Exception as e:
            self.use_mongo = False
            print(f"[Database] MongoDB not reachable ({e}). Using persistent JSON storage at {DATA_FILE}")

        self._init_data()

    def _init_data(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        if self.use_mongo:
            # Check if collections are populated
            if self.db["hospitals"].count_documents({}) == 0:
                self.db["hospitals"].insert_many(get_initial_hospitals())
            if self.db["ambulances"].count_documents({}) == 0:
                self.db["ambulances"].insert_many(get_initial_ambulances())
            if self.db["incidents"].count_documents({}) == 0:
                self.db["incidents"].insert_many(get_initial_incidents())
            if self.db["trips"].count_documents({}) == 0:
                self.db["trips"].insert_many(get_initial_trips())
        else:
            # JSON file fallback
            if os.path.exists(DATA_FILE):
                try:
                    with open(DATA_FILE, "r", encoding="utf-8") as f:
                        self._cache = json.load(f)
                except Exception:
                    self._load_defaults()
                    self._save_to_disk()
            else:
                self._load_defaults()
                self._save_to_disk()

    def _load_defaults(self):
        self._cache = {
            "ambulances": get_initial_ambulances(),
            "incidents": get_initial_incidents(),
            "hospitals": get_initial_hospitals(),
            "trips": get_initial_trips(),
            "notifications": [
                {
                    "id": "NOTIF-01",
                    "title": "System Initialized",
                    "message": "108 Emergency Ambulance Dispatch System online for Perundurai & Erode region.",
                    "type": "info",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            ]
        }

    def _save_to_disk(self):
        if not self.use_mongo:
            try:
                with open(DATA_FILE, "w", encoding="utf-8") as f:
                    json.dump(self._cache, f, indent=2, default=str)
            except Exception as e:
                print(f"[Database Error saving to disk] {e}")

    # --- AMBULANCES ---
    def get_ambulances(self) -> List[Dict[str, Any]]:
        with self._lock:
            if self.use_mongo:
                docs = list(self.db["ambulances"].find({}, {"_id": 0}))
                return docs
            return [dict(a) for a in self._cache.get("ambulances", [])]

    def get_ambulance(self, ambulance_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            if self.use_mongo:
                doc = self.db["ambulances"].find_one({"id": ambulance_id}, {"_id": 0})
                return doc
            for a in self._cache.get("ambulances", []):
                if a["id"] == ambulance_id:
                    return dict(a)
            return None

    def update_ambulance(self, ambulance_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with self._lock:
            updates["last_updated"] = datetime.now(timezone.utc).isoformat()
            if self.use_mongo:
                self.db["ambulances"].update_one({"id": ambulance_id}, {"$set": updates})
                return self.db["ambulances"].find_one({"id": ambulance_id}, {"_id": 0})
            
            for i, a in enumerate(self._cache.get("ambulances", [])):
                if a["id"] == ambulance_id:
                    self._cache["ambulances"][i].update(updates)
                    self._save_to_disk()
                    return dict(self._cache["ambulances"][i])
            return None

    # --- INCIDENTS ---
    def get_incidents(self, active_only: bool = False) -> List[Dict[str, Any]]:
        with self._lock:
            if self.use_mongo:
                query = {"status": {"$nin": ["Completed", "Cancelled"]}} if active_only else {}
                return list(self.db["incidents"].find(query, {"_id": 0}))
            
            incidents = self._cache.get("incidents", [])
            if active_only:
                return [dict(i) for i in incidents if i.get("status") not in ["Completed", "Cancelled"]]
            return [dict(i) for i in incidents]

    def get_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            if self.use_mongo:
                return self.db["incidents"].find_one({"id": incident_id}, {"_id": 0})
            for inc in self._cache.get("incidents", []):
                if inc["id"] == incident_id:
                    return dict(inc)
            return None

    def create_incident(self, incident: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            if "id" not in incident or not incident["id"]:
                inc_num = len(self._cache.get("incidents", [])) + 10801
                incident["id"] = f"INC-{inc_num}"
            if "created_at" not in incident:
                incident["created_at"] = datetime.now(timezone.utc).isoformat()
            if "status" not in incident:
                incident["status"] = "Registered"

            if self.use_mongo:
                self.db["incidents"].insert_one(dict(incident))
                incident.pop("_id", None)
            else:
                self._cache["incidents"].insert(0, incident)
                self._save_to_disk()
            
            # Add notification
            self.add_notification_internal(
                title=f"New Incident {incident['id']}",
                message=f"Registered: {incident.get('incident_type')} at {incident.get('location_name')} ({incident.get('severity')} Priority)",
                notif_type="urgent" if incident.get("severity") == "High" else "info"
            )
            return incident

    def update_incident(self, incident_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with self._lock:
            if self.use_mongo:
                self.db["incidents"].update_one({"id": incident_id}, {"$set": updates})
                return self.db["incidents"].find_one({"id": incident_id}, {"_id": 0})
            
            for i, inc in enumerate(self._cache.get("incidents", [])):
                if inc["id"] == incident_id:
                    self._cache["incidents"][i].update(updates)
                    self._save_to_disk()
                    return dict(self._cache["incidents"][i])
            return None

    # --- HOSPITALS ---
    def get_hospitals(self) -> List[Dict[str, Any]]:
        with self._lock:
            if self.use_mongo:
                return list(self.db["hospitals"].find({}, {"_id": 0}))
            return [dict(h) for h in self._cache.get("hospitals", [])]

    def get_hospital(self, hospital_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            if self.use_mongo:
                return self.db["hospitals"].find_one({"id": hospital_id}, {"_id": 0})
            for h in self._cache.get("hospitals", []):
                if h["id"] == hospital_id:
                    return dict(h)
            return None

    def update_hospital_beds(self, hospital_id: str, beds: Dict[str, int]) -> Optional[Dict[str, Any]]:
        with self._lock:
            if self.use_mongo:
                self.db["hospitals"].update_one({"id": hospital_id}, {"$set": beds})
                return self.db["hospitals"].find_one({"id": hospital_id}, {"_id": 0})
            
            for i, h in enumerate(self._cache.get("hospitals", [])):
                if h["id"] == hospital_id:
                    self._cache["hospitals"][i].update(beds)
                    self._save_to_disk()
                    return dict(self._cache["hospitals"][i])
            return None

    # --- TRIPS ---
    def get_trips(self) -> List[Dict[str, Any]]:
        with self._lock:
            if self.use_mongo:
                return list(self.db["trips"].find({}, {"_id": 0}))
            return [dict(t) for t in self._cache.get("trips", [])]

    def create_trip(self, trip: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            if "trip_id" not in trip or not trip["trip_id"]:
                trip_num = len(self._cache.get("trips", [])) + 10801
                trip["trip_id"] = f"TRIP-{trip_num}"
            if "completion_time" not in trip:
                trip["completion_time"] = datetime.now(timezone.utc).isoformat()

            if self.use_mongo:
                self.db["trips"].insert_one(dict(trip))
                trip.pop("_id", None)
            else:
                self._cache["trips"].insert(0, trip)
                self._save_to_disk()
            return trip

    # --- NOTIFICATIONS ---
    def add_notification_internal(self, title: str, message: str, notif_type: str = "info"):
        notif = {
            "id": f"NOTIF-{len(self._cache.get('notifications', [])) + 1}",
            "title": title,
            "message": message,
            "type": notif_type,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        if self.use_mongo:
            self.db["notifications"].insert_one(dict(notif))
            notif.pop("_id", None)
        else:
            if "notifications" not in self._cache:
                self._cache["notifications"] = []
            self._cache["notifications"].insert(0, notif)
            if len(self._cache["notifications"]) > 50:
                self._cache["notifications"] = self._cache["notifications"][:50]
            self._save_to_disk()

    def get_notifications(self) -> List[Dict[str, Any]]:
        with self._lock:
            if self.use_mongo:
                return list(self.db["notifications"].find({}, {"_id": 0}).sort("timestamp", -1).limit(30))
            return [dict(n) for n in self._cache.get("notifications", [])]

    # --- STATS ---
    def get_stats(self) -> Dict[str, Any]:
        with self._lock:
            ambulances = self.get_ambulances()
            incidents = self.get_incidents()
            hospitals = self.get_hospitals()
            trips = self.get_trips()

            total_amb = len(ambulances)
            avail_amb = sum(1 for a in ambulances if a.get("status") == "Available")
            disp_amb = sum(1 for a in ambulances if a.get("status") in ["Dispatched", "En Route to Scene", "At Scene", "Patient Picked Up", "En Route to Hospital"])
            maint_amb = sum(1 for a in ambulances if a.get("status") in ["Maintenance", "Unavailable"])
            
            active_inc = sum(1 for i in incidents if i.get("status") not in ["Completed", "Cancelled"])
            completed_trips = len(trips)
            
            total_emergency_beds = sum(h.get("emergency_beds", 0) for h in hospitals)
            total_icu_beds = sum(h.get("icu_beds", 0) for h in hospitals)
            total_oxygen_beds = sum(h.get("oxygen_beds", 0) for h in hospitals)

            return {
                "total_ambulances": total_amb,
                "available_ambulances": avail_amb,
                "dispatched_ambulances": disp_amb,
                "maintenance_ambulances": maint_amb,
                "active_incidents": active_inc,
                "completed_trips": completed_trips,
                "hospital_bed_availability": {
                    "total_emergency_beds": total_emergency_beds,
                    "total_icu_beds": total_icu_beds,
                    "total_oxygen_beds": total_oxygen_beds,
                    "total_beds": total_emergency_beds + total_icu_beds + total_oxygen_beds
                },
                "storage_mode": "MongoDB" if self.use_mongo else "Persistent JSON"
            }

    def reset(self):
        with self._lock:
            self._load_defaults()
            self._save_to_disk()
            if self.use_mongo:
                self.db["ambulances"].drop()
                self.db["incidents"].drop()
                self.db["hospitals"].drop()
                self.db["trips"].drop()
                self._init_data()

db = Database()
