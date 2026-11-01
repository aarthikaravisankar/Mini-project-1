import {
  Incident,
  Ambulance,
  Hospital,
  Trip,
  DashboardStats,
  NotificationItem,
  DuplicateDetectionResult
} from './types';

const API_BASE = 'http://localhost:8001/api';

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchAmbulances(): Promise<Ambulance[]> {
  const res = await fetch(`${API_BASE}/ambulances`);
  if (!res.ok) throw new Error('Failed to fetch ambulances');
  return res.json();
}

export async function fetchAmbulance(id: string): Promise<Ambulance> {
  const res = await fetch(`${API_BASE}/ambulances/${id}`);
  if (!res.ok) throw new Error('Failed to fetch ambulance');
  return res.json();
}

export async function toggleAmbulanceStatus(id: string, status: string, notes?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/ambulances/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes })
  });
  if (!res.ok) throw new Error('Failed to update ambulance status');
  return res.json();
}

export async function fetchIncidents(activeOnly: boolean = false): Promise<Incident[]> {
  const res = await fetch(`${API_BASE}/incidents?active_only=${activeOnly}`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function checkDuplicate(data: {
  latitude: number;
  longitude: number;
  created_at?: string;
  radius_meters?: number;
  time_window_minutes?: number;
}): Promise<{ is_duplicate: boolean; duplicate_data: DuplicateDetectionResult | null }> {
  const res = await fetch(`${API_BASE}/duplicate-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to check duplicate');
  return res.json();
}

export async function registerIncident(data: {
  caller_phone: string;
  caller_name?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  incident_type: string;
  severity: string;
  ambulances_required: number;
  notes?: string;
}, bypassDuplicate: boolean = false): Promise<any> {
  const res = await fetch(`${API_BASE}/incidents?bypass_duplicate_check=${bypassDuplicate}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to register incident');
  return res.json();
}

export async function linkDuplicateCall(incidentId: string, data: {
  caller_phone: string;
  caller_name?: string;
  notes?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      existing_incident_id: incidentId,
      ...data
    })
  });
  if (!res.ok) throw new Error('Failed to link call');
  return res.json();
}

export async function forwardCall(data: {
  caller_phone: string;
  caller_name?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  incident_type: string;
  severity: string;
  target_control_room: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/call-forward`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to forward call');
  return res.json();
}

export async function fetchPriorityQueue(): Promise<{
  total_queued: number;
  recommended_for_dispatch: Incident | null;
  priority_queue: Incident[];
}> {
  const res = await fetch(`${API_BASE}/priority-queue`);
  if (!res.ok) throw new Error('Failed to fetch priority queue');
  return res.json();
}

export async function recommendAmbulance(incidentId: string): Promise<{
  incident: Incident;
  available_ambulances_count: number;
  recommended_ambulance: Ambulance | null;
  ranked_ambulances: Ambulance[];
  message?: string;
}> {
  const res = await fetch(`${API_BASE}/dispatch/recommend/${incidentId}`);
  if (!res.ok) throw new Error('Failed to get ambulance recommendation');
  return res.json();
}

export async function confirmDispatch(incidentId: string, ambulanceId: string, operatorNotes?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/dispatch/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      incident_id: incidentId,
      ambulance_id: ambulanceId,
      operator_notes: operatorNotes
    })
  });
  if (!res.ok) throw new Error('Failed to confirm dispatch');
  return res.json();
}

export async function updateDriverStatus(data: {
  ambulance_id: string;
  incident_id?: string;
  status: string;
  current_latitude?: number;
  current_longitude?: number;
  selected_hospital_id?: string;
  notes?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/driver/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update driver status');
  return res.json();
}

export async function fetchHospitals(): Promise<Hospital[]> {
  const res = await fetch(`${API_BASE}/hospitals`);
  if (!res.ok) throw new Error('Failed to fetch hospitals');
  return res.json();
}

export async function recommendHospital(incidentId: string, requireIcu: boolean = false): Promise<{
  incident: Incident;
  recommended_hospital: Hospital | null;
  all_hospitals: Hospital[];
}> {
  const res = await fetch(`${API_BASE}/hospitals/recommend/${incidentId}?require_icu=${requireIcu}`);
  if (!res.ok) throw new Error('Failed to recommend hospital');
  return res.json();
}

export async function updateHospitalBeds(hospitalId: string, beds: {
  emergency_beds: number;
  icu_beds: number;
  oxygen_beds: number;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/hospitals/${hospitalId}/beds`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(beds)
  });
  if (!res.ok) throw new Error('Failed to update hospital beds');
  return res.json();
}

export async function fetchTrips(params?: {
  ambulance_id?: string;
  incident_type?: string;
  search?: string;
}): Promise<Trip[]> {
  const query = new URLSearchParams();
  if (params?.ambulance_id) query.append('ambulance_id', params.ambulance_id);
  if (params?.incident_type) query.append('incident_type', params.incident_type);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/trips?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch trips');
  return res.json();
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch(`${API_BASE}/notifications`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function resetSystem(): Promise<any> {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset system');
  return res.json();
}

export async function cleanSession(): Promise<any> {
  const res = await fetch(`${API_BASE}/clean-session`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to clean session');
  return res.json();
}

