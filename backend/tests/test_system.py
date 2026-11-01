import unittest
from datetime import datetime, timezone, timedelta
import sys
import os

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from haversine import haversine_distance_km, haversine_distance_m, check_duplicate_incident
from priority_queue import IncidentPriorityQueue
from database import Database

class TestEmergencyDispatchSystem(unittest.TestCase):

    def setUp(self):
        self.db = Database()

    def test_haversine_distance(self):
        """Test Haversine distance between Perundurai and Erode GH (~20 km)"""
        # Perundurai Sanatorium
        lat1, lon1 = 11.2652, 77.5855
        # Erode GH
        lat2, lon2 = 11.3410, 77.7280
        dist_km = haversine_distance_km(lat1, lon1, lat2, lon2)
        # Should be roughly 17-21 km
        self.assertTrue(15.0 < dist_km < 25.0, f"Distance was {dist_km} km")

    def test_duplicate_call_detection(self):
        """Test 200m radius and 10min duplicate call detection"""
        now = datetime.now(timezone.utc)
        active_incidents = [
            {
                "id": "INC-TEST-1",
                "latitude": 11.2780,
                "longitude": 77.5840,
                "created_at": now.isoformat(),
                "status": "Registered",
                "incident_type": "Road Accident",
                "location_name": "Perundurai Stand",
                "caller_phone": "9842100000"
            }
        ]

        # Call within 100 meters and 2 minutes -> Duplicate!
        dup = check_duplicate_incident(
            new_lat=11.2785,
            new_lon=77.5845,
            new_time_iso=(now + timedelta(minutes=2)).isoformat(),
            active_incidents=active_incidents,
            radius_meters=200.0,
            time_window_minutes=10.0
        )
        self.assertIsNotNone(dup)
        self.assertTrue(dup["is_duplicate"])
        self.assertEqual(dup["existing_incident_id"], "INC-TEST-1")

        # Call 3 km away -> Not a duplicate
        dup_far = check_duplicate_incident(
            new_lat=11.3100,
            new_lon=77.6200,
            new_time_iso=(now + timedelta(minutes=2)).isoformat(),
            active_incidents=active_incidents,
            radius_meters=200.0,
            time_window_minutes=10.0
        )
        self.assertIsNone(dup_far)

    def test_priority_queue_min_heap(self):
        """Test min-heap ordering: High > Medium > Low, tie-break by timestamp"""
        pq = IncidentPriorityQueue()
        now = datetime.now(timezone.utc)

        inc_low = {
            "id": "INC-LOW",
            "severity": "Low",
            "created_at": (now - timedelta(minutes=15)).isoformat()
        }
        inc_high_recent = {
            "id": "INC-HIGH-RECENT",
            "severity": "High",
            "created_at": (now - timedelta(minutes=2)).isoformat()
        }
        inc_high_older = {
            "id": "INC-HIGH-OLDER",
            "severity": "High",
            "created_at": (now - timedelta(minutes=10)).isoformat()
        }
        inc_med = {
            "id": "INC-MED",
            "severity": "Medium",
            "created_at": (now - timedelta(minutes=5)).isoformat()
        }

        pq.push(inc_low)
        pq.push(inc_high_recent)
        pq.push(inc_med)
        pq.push(inc_high_older)

        # High-older should come FIRST (High severity, waited longer)
        first = pq.pop()
        self.assertEqual(first["id"], "INC-HIGH-OLDER")

        # High-recent should come SECOND
        second = pq.pop()
        self.assertEqual(second["id"], "INC-HIGH-RECENT")

        # Medium should come THIRD
        third = pq.pop()
        self.assertEqual(third["id"], "INC-MED")

        # Low should come LAST
        fourth = pq.pop()
        self.assertEqual(fourth["id"], "INC-LOW")

    def test_ambulance_dispatch_and_trip_completion(self):
        """Test complete dispatch workflow and trip completion lifecycle"""
        # 1. Register incident
        now_iso = datetime.now(timezone.utc).isoformat()
        new_inc = self.db.create_incident({
            "id": "INC-UNIT-01",
            "caller_phone": "9842199999",
            "caller_name": "Test User",
            "location_name": "Perundurai Test Point",
            "latitude": 11.2780,
            "longitude": 77.5840,
            "incident_type": "Trauma",
            "severity": "High",
            "status": "Registered",
            "created_at": now_iso
        })
        self.assertEqual(new_inc["status"], "Registered")

        # 2. Dispatch ambulance AMB-108-01
        amb = self.db.get_ambulance("AMB-108-01")
        self.assertIsNotNone(amb)

        self.db.update_ambulance("AMB-108-01", {
            "status": "Dispatched",
            "assigned_incident_id": new_inc["id"]
        })
        self.db.update_incident(new_inc["id"], {
            "status": "Dispatched",
            "assigned_ambulance_id": "AMB-108-01"
        })

        amb_after = self.db.get_ambulance("AMB-108-01")
        self.assertEqual(amb_after["status"], "Dispatched")

        # 3. Complete trip
        self.db.create_trip({
            "trip_id": "TRIP-UNIT-01",
            "incident_id": new_inc["id"],
            "ambulance_id": "AMB-108-01",
            "hospital_name": "Govt Medical College Hospital, Perundurai",
            "completion_time": now_iso
        })
        self.db.update_incident(new_inc["id"], {"status": "Completed"})
        self.db.update_ambulance("AMB-108-01", {
            "status": "Available",
            "assigned_incident_id": None
        })

        # Verify ambulance is Available again
        amb_final = self.db.get_ambulance("AMB-108-01")
        self.assertEqual(amb_final["status"], "Available")
        self.assertIsNone(amb_final["assigned_incident_id"])

        inc_final = self.db.get_incident(new_inc["id"])
        self.assertEqual(inc_final["status"], "Completed")

if __name__ == "__main__":
    unittest.main()
