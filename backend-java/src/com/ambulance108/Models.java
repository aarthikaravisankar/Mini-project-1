package com.ambulance108;

import java.util.*;

public class Models {

    public static class DuplicateResult {
        public boolean isDuplicate;
        public String existingIncidentId;
        public String incidentType;
        public String locationName;
        public double distanceMeters;
        public double timeDiffMinutes;
        public String currentStatus;
        public String callerPhone;

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("is_duplicate", isDuplicate);
            m.put("existing_incident_id", existingIncidentId);
            m.put("incident_type", incidentType);
            m.put("location_name", locationName);
            m.put("distance_meters", distanceMeters);
            m.put("time_diff_minutes", timeDiffMinutes);
            m.put("current_status", currentStatus);
            m.put("caller_phone", callerPhone);
            return m;
        }
    }

    public static class CallerLog {
        public String callerPhone;
        public String callerName;
        public String timestamp;
        public String note;

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("caller_phone", callerPhone);
            m.put("caller_name", callerName);
            m.put("timestamp", timestamp);
            m.put("note", note);
            return m;
        }

        public static CallerLog fromMap(Map<String, Object> m) {
            if (m == null) return null;
            CallerLog l = new CallerLog();
            l.callerPhone = (String) m.get("caller_phone");
            l.callerName = (String) m.get("caller_name");
            l.timestamp = (String) m.get("timestamp");
            l.note = (String) m.get("note");
            return l;
        }
    }

    public static class Incident {
        public String id;
        public String callerPhone;
        public String callerName = "Citizen Caller";
        public String locationName;
        public double latitude;
        public double longitude;
        public String incidentType;
        public String severity = "High"; // High, Medium, Low
        public int ambulancesRequired = 1;
        public String status = "Registered"; // Registered, Dispatched, En Route to Scene, At Scene, Patient Picked Up, En Route to Hospital, Completed, Cancelled
        public String assignedAmbulanceId;
        public Map<String, Object> assignedAmbulanceDetails;
        public String targetHospitalId;
        public String targetHospitalName;
        public String linkedIncidentId;
        public int duplicateCallsCount = 0;
        public String createdAt;
        public String updatedAt;
        public String notes = "";
        public String completedAt;
        public List<CallerLog> callerLogs = new ArrayList<>();

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", id);
            m.put("incident_id", id);
            m.put("caller_phone", callerPhone);
            m.put("caller_name", callerName);
            m.put("location_name", locationName);
            m.put("latitude", latitude);
            m.put("longitude", longitude);
            m.put("incident_type", incidentType);
            m.put("severity", severity);
            m.put("ambulances_required", ambulancesRequired);
            m.put("status", status);
            m.put("assigned_ambulance_id", assignedAmbulanceId);
            m.put("assigned_ambulance_details", assignedAmbulanceDetails);
            m.put("target_hospital_id", targetHospitalId);
            m.put("target_hospital_name", targetHospitalName);
            m.put("linked_incident_id", linkedIncidentId);
            m.put("duplicate_calls_count", duplicateCallsCount);
            m.put("created_at", createdAt);
            m.put("updated_at", updatedAt);
            m.put("notes", notes);
            m.put("completed_at", completedAt);
            List<Map<String, Object>> logs = new ArrayList<>();
            for (CallerLog cl : callerLogs) {
                logs.add(cl.toMap());
            }
            m.put("caller_logs", logs);
            return m;
        }

        @SuppressWarnings("unchecked")
        public static Incident fromMap(Map<String, Object> m) {
            if (m == null) return null;
            Incident inc = new Incident();
            inc.id = (String) m.get("id");
            if (inc.id == null) inc.id = (String) m.get("incident_id");
            inc.callerPhone = (String) m.get("caller_phone");
            inc.callerName = (String) m.get("caller_name");
            inc.locationName = (String) m.get("location_name");
            if (m.get("latitude") instanceof Number) inc.latitude = ((Number) m.get("latitude")).doubleValue();
            if (m.get("longitude") instanceof Number) inc.longitude = ((Number) m.get("longitude")).doubleValue();
            inc.incidentType = (String) m.get("incident_type");
            if (m.get("severity") != null) inc.severity = (String) m.get("severity");
            if (m.get("ambulances_required") instanceof Number) inc.ambulancesRequired = ((Number) m.get("ambulances_required")).intValue();
            if (m.get("status") != null) inc.status = (String) m.get("status");
            inc.assignedAmbulanceId = (String) m.get("assigned_ambulance_id");
            if (m.get("assigned_ambulance_details") instanceof Map) inc.assignedAmbulanceDetails = (Map<String, Object>) m.get("assigned_ambulance_details");
            inc.targetHospitalId = (String) m.get("target_hospital_id");
            inc.targetHospitalName = (String) m.get("target_hospital_name");
            inc.linkedIncidentId = (String) m.get("linked_incident_id");
            if (m.get("duplicate_calls_count") instanceof Number) inc.duplicateCallsCount = ((Number) m.get("duplicate_calls_count")).intValue();
            inc.createdAt = (String) m.get("created_at");
            inc.updatedAt = (String) m.get("updated_at");
            if (m.get("notes") != null) inc.notes = (String) m.get("notes");
            inc.completedAt = (String) m.get("completed_at");
            if (m.get("caller_logs") instanceof List) {
                for (Object item : (List<?>) m.get("caller_logs")) {
                    if (item instanceof Map) inc.callerLogs.add(CallerLog.fromMap((Map<String, Object>) item));
                }
            }
            return inc;
        }
    }

    public static class Ambulance {
        public String id;
        public String vehicleNo;
        public String type = "Advanced Life Support (ALS)";
        public String driverId = "DRV-101";
        public String driverName;
        public String driverPhone;
        public String baseStation;
        public double latitude;
        public double longitude;
        public String status = "Available"; // Available, Dispatched, En Route to Scene, At Scene, Patient Picked Up, En Route to Hospital, Maintenance, Unavailable
        public String assignedIncidentId;
        public Map<String, Object> assignedIncident;
        public String dispatchTime;
        public String targetHospitalId;
        public String maintenanceNotes = "";
        public String lastUpdated;

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", id);
            m.put("ambulance_id", id);
            m.put("vehicle_no", vehicleNo);
            m.put("vehicle_number", vehicleNo);
            m.put("type", type);
            m.put("driver_id", driverId);
            m.put("driver_name", driverName);
            m.put("driver_phone", driverPhone);
            m.put("base_station", baseStation);
            m.put("latitude", latitude);
            m.put("longitude", longitude);
            m.put("status", status);
            m.put("assigned_incident_id", assignedIncidentId);
            m.put("assigned_incident", assignedIncident);
            m.put("dispatch_time", dispatchTime);
            m.put("target_hospital_id", targetHospitalId);
            m.put("maintenance_notes", maintenanceNotes);
            m.put("last_updated", lastUpdated);
            return m;
        }

        @SuppressWarnings("unchecked")
        public static Ambulance fromMap(Map<String, Object> m) {
            if (m == null) return null;
            Ambulance a = new Ambulance();
            a.id = (String) m.get("id");
            if (a.id == null) a.id = (String) m.get("ambulance_id");
            a.vehicleNo = (String) m.get("vehicle_no");
            if (a.vehicleNo == null) a.vehicleNo = (String) m.get("vehicle_number");
            if (m.get("type") != null) a.type = (String) m.get("type");
            a.driverId = (String) m.get("driver_id");
            a.driverName = (String) m.get("driver_name");
            a.driverPhone = (String) m.get("driver_phone");
            a.baseStation = (String) m.get("base_station");
            if (m.get("latitude") instanceof Number) a.latitude = ((Number) m.get("latitude")).doubleValue();
            if (m.get("longitude") instanceof Number) a.longitude = ((Number) m.get("longitude")).doubleValue();
            if (m.get("status") != null) a.status = (String) m.get("status");
            a.assignedIncidentId = (String) m.get("assigned_incident_id");
            if (a.assignedIncidentId == null) a.assignedIncidentId = (String) m.get("current_incident_id");
            if (m.get("assigned_incident") instanceof Map) a.assignedIncident = (Map<String, Object>) m.get("assigned_incident");
            a.dispatchTime = (String) m.get("dispatch_time");
            a.targetHospitalId = (String) m.get("target_hospital_id");
            if (m.get("maintenance_notes") != null) a.maintenanceNotes = (String) m.get("maintenance_notes");
            a.lastUpdated = (String) m.get("last_updated");
            return a;
        }
    }

    public static class Hospital {
        public String id;
        public String name;
        public String locationName;
        public double latitude;
        public double longitude;
        public int emergencyBeds;
        public int icuBeds;
        public int oxygenBeds;
        public int totalBeds;
        public String contactPhone;
        public String type;
        public String traumaLevel;
        public String specialties;
        public boolean simulated = true;

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", id);
            m.put("hospital_id", id);
            m.put("name", name);
            m.put("location_name", locationName);
            m.put("address", locationName);
            m.put("latitude", latitude);
            m.put("longitude", longitude);
            m.put("emergency_beds", emergencyBeds);
            m.put("icu_beds", icuBeds);
            m.put("oxygen_beds", oxygenBeds);
            m.put("total_beds", totalBeds);
            m.put("contact_phone", contactPhone);
            m.put("type", type);
            m.put("hospital_type", type);
            m.put("trauma_level", traumaLevel != null ? traumaLevel : type);
            m.put("specialties", specialties != null ? specialties : "");
            m.put("simulated", simulated);
            return m;
        }

        public static Hospital fromMap(Map<String, Object> m) {
            if (m == null) return null;
            Hospital h = new Hospital();
            h.id = (String) m.get("id");
            if (h.id == null) h.id = (String) m.get("hospital_id");
            h.name = (String) m.get("name");
            h.locationName = (String) m.get("location_name");
            if (h.locationName == null) h.locationName = (String) m.get("address");
            if (m.get("latitude") instanceof Number) h.latitude = ((Number) m.get("latitude")).doubleValue();
            if (m.get("longitude") instanceof Number) h.longitude = ((Number) m.get("longitude")).doubleValue();
            if (m.get("emergency_beds") instanceof Number) h.emergencyBeds = ((Number) m.get("emergency_beds")).intValue();
            if (m.get("icu_beds") instanceof Number) h.icuBeds = ((Number) m.get("icu_beds")).intValue();
            if (m.get("oxygen_beds") instanceof Number) h.oxygenBeds = ((Number) m.get("oxygen_beds")).intValue();
            if (m.get("total_beds") instanceof Number) h.totalBeds = ((Number) m.get("total_beds")).intValue();
            h.contactPhone = (String) m.get("contact_phone");
            h.type = (String) m.get("type");
            if (h.type == null) h.type = (String) m.get("hospital_type");
            h.traumaLevel = (String) m.get("trauma_level");
            h.specialties = (String) m.get("specialties");
            if (m.get("simulated") instanceof Boolean) h.simulated = (Boolean) m.get("simulated");
            return h;
        }
    }

    public static class Trip {
        public String id;
        public String tripId;
        public String incidentId;
        public String incidentType;
        public String ambulanceId;
        public String vehicleNo;
        public String driverName;
        public String callerPhone;
        public String patientLocation;
        public String hospitalName;
        public String dispatchTime;
        public String pickupTime;
        public String completionTime;
        public int durationMinutes = 25;
        public double distanceKm = 7.2;
        public String outcome = "Patient transported safely to hospital care unit.";
        public String status = "Completed";

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", id != null ? id : tripId);
            m.put("trip_id", tripId);
            m.put("incident_id", incidentId);
            m.put("incident_type", incidentType);
            m.put("ambulance_id", ambulanceId);
            m.put("vehicle_no", vehicleNo);
            m.put("driver_name", driverName);
            m.put("caller_phone", callerPhone);
            m.put("patient_location", patientLocation);
            m.put("location_name", patientLocation);
            m.put("hospital_name", hospitalName);
            m.put("dispatch_time", dispatchTime);
            m.put("pickup_time", pickupTime);
            m.put("completion_time", completionTime);
            m.put("duration_minutes", durationMinutes);
            m.put("distance_km", distanceKm);
            m.put("outcome", outcome);
            m.put("status", status);
            return m;
        }

        public static Trip fromMap(Map<String, Object> m) {
            if (m == null) return null;
            Trip t = new Trip();
            t.id = (String) m.get("id");
            t.tripId = (String) m.get("trip_id");
            if (t.tripId == null) t.tripId = t.id;
            t.incidentId = (String) m.get("incident_id");
            t.incidentType = (String) m.get("incident_type");
            t.ambulanceId = (String) m.get("ambulance_id");
            t.vehicleNo = (String) m.get("vehicle_no");
            t.driverName = (String) m.get("driver_name");
            t.callerPhone = (String) m.get("caller_phone");
            t.patientLocation = (String) m.get("patient_location");
            if (t.patientLocation == null) t.patientLocation = (String) m.get("location_name");
            t.hospitalName = (String) m.get("hospital_name");
            t.dispatchTime = (String) m.get("dispatch_time");
            t.pickupTime = (String) m.get("pickup_time");
            t.completionTime = (String) m.get("completion_time");
            if (m.get("duration_minutes") instanceof Number) t.durationMinutes = ((Number) m.get("duration_minutes")).intValue();
            if (m.get("distance_km") instanceof Number) t.distanceKm = ((Number) m.get("distance_km")).doubleValue();
            t.outcome = (String) m.get("outcome");
            if (m.get("status") != null) t.status = (String) m.get("status");
            return t;
        }
    }

    public static class Notification {
        public String id;
        public String title;
        public String message;
        public String type = "info"; // info, urgent, driver_accepted, success, trip_completed
        public String timestamp;
        public boolean read = false;

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", id);
            m.put("title", title);
            m.put("message", message);
            m.put("type", type);
            m.put("timestamp", timestamp);
            m.put("read", read);
            return m;
        }

        public static Notification fromMap(Map<String, Object> m) {
            if (m == null) return null;
            Notification n = new Notification();
            n.id = (String) m.get("id");
            n.title = (String) m.get("title");
            n.message = (String) m.get("message");
            if (m.get("type") != null) n.type = (String) m.get("type");
            n.timestamp = (String) m.get("timestamp");
            if (m.get("read") instanceof Boolean) n.read = (Boolean) m.get("read");
            return n;
        }
    }
}
