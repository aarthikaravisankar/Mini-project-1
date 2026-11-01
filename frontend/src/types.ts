export interface Incident {
  id: string;
  caller_phone: string;
  caller_name: string;
  location_name: string;
  latitude: floatNumber;
  longitude: floatNumber;
  incident_type: string;
  severity: 'High' | 'Medium' | 'Low';
  ambulances_required: number;
  status: 'Registered' | 'Pending Dispatch' | 'Dispatched' | 'En Route to Scene' | 'At Scene' | 'Patient Picked Up' | 'En Route to Hospital' | 'Completed' | 'Cancelled';
  assigned_ambulance_id: string | null;
  assigned_ambulance_details?: {
    vehicle_no: string;
    driver_name: string;
    driver_phone: string;
  } | null;
  created_at: string;
  dispatched_at?: string;
  completed_at?: string;
  notes?: string;
  caller_logs?: Array<{
    caller_phone: string;
    caller_name?: string;
    timestamp: string;
    note: string;
  }>;
}

type floatNumber = number;

export interface Ambulance {
  id: string;
  vehicle_no: string;
  type: string;
  driver_id?: string;
  driver_name: string;
  driver_phone: string;
  base_station: string;
  latitude: number;
  longitude: number;
  status: 'Available' | 'Dispatched' | 'En Route to Scene' | 'At Scene' | 'Patient Picked Up' | 'En Route to Hospital' | 'Maintenance' | 'Unavailable';
  assigned_incident_id: string | null;
  assigned_incident?: {
    id: string;
    location_name: string;
    latitude: number;
    longitude: number;
    incident_type: string;
    severity: string;
    caller_phone: string;
    notes?: string;
  } | null;
  target_hospital_id?: string | null;
  last_updated: string;
  distance_km?: number;
  eta_minutes?: number;
}

export interface Hospital {
  id: string;
  name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  emergency_beds: number;
  icu_beds: number;
  oxygen_beds: number;
  total_beds: number;
  contact_phone: string;
  type: string;
  simulated: boolean;
  distance_km?: number;
  eta_minutes?: number;
  beds_available?: boolean;
}

export interface Trip {
  trip_id: string;
  incident_id: string;
  incident_type: string;
  ambulance_id: string;
  vehicle_no: string;
  driver_name: string;
  caller_phone: string;
  patient_location: string;
  hospital_name: string;
  dispatch_time: string;
  completion_time: string;
  duration_minutes: number;
  distance_km: number;
  outcome: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'urgent' | 'success' | 'driver_accepted' | 'trip_completed';
  timestamp: string;
}

export interface DashboardStats {
  total_ambulances: number;
  available_ambulances: number;
  dispatched_ambulances: number;
  maintenance_ambulances: number;
  active_incidents: number;
  completed_trips: number;
  hospital_bed_availability: {
    total_emergency_beds: number;
    total_icu_beds: number;
    total_oxygen_beds: number;
    total_beds: number;
  };
  storage_mode: string;
}

export interface DuplicateDetectionResult {
  is_duplicate: boolean;
  existing_incident_id?: string;
  incident_type?: string;
  location_name?: string;
  distance_meters?: number;
  time_diff_minutes?: number;
  current_status?: string;
  caller_phone?: string;
}
