import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Phone, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Building2, 
  ExternalLink, 
  Activity, 
  Route 
} from 'lucide-react';
import { Ambulance, Hospital } from '../types';
import { updateDriverStatus, recommendHospital, fetchAmbulance, fetchHospitals } from '../api';
import { soundManager } from '../utils/sound';
import { MapComponent } from './MapComponent';

interface DriverDashboardProps {
  ambulanceId: string;
  onStatusUpdated: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  ambulanceId,
  onStatusUpdated
}) => {
  const [ambulance, setAmbulance] = useState<Ambulance | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSirenActive, setIsSirenActive] = useState(false);

  // Hospital Recommendation after patient pickup
  const [hospitalData, setHospitalData] = useState<{
    recommended_hospital: Hospital | null;
    all_hospitals: Hospital[];
  } | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  // Completed Trip Summary Confirmation Screen
  const [recentlyCompletedTrip, setRecentlyCompletedTrip] = useState<{
    incidentId: string;
    location: string;
    hospitalName: string;
    vehicleNo: string;
    driverName: string;
    completedAt: string;
  } | null>(null);

  const loadDriverAmbulance = async () => {
    try {
      setLoading(true);
      const [ambData, hospList] = await Promise.all([
        fetchAmbulance(ambulanceId),
        fetchHospitals().catch(() => [])
      ]);
      setAmbulance(ambData);
      setHospitals(hospList);

      if (ambData.status === 'Patient Picked Up' || ambData.status === 'En Route to Hospital') {
        if (ambData.assigned_incident_id) {
          fetchHospitalRecs(ambData.assigned_incident_id);
        }
      }
    } catch (err) {
      console.error('Error fetching driver ambulance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverAmbulance();
    const interval = setInterval(loadDriverAmbulance, 4000);
    return () => clearInterval(interval);
  }, [ambulanceId]);

  const fetchHospitalRecs = async (incidentId: string) => {
    try {
      setLoadingHospitals(true);
      const res = await recommendHospital(incidentId);
      setHospitalData(res);
      if (res.recommended_hospital) {
        setSelectedHospitalId(res.recommended_hospital.id);
      }
    } catch (err) {
      console.error('Error fetching hospital recommendations:', err);
    } finally {
      setLoadingHospitals(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!ambulance) return;
    setIsUpdating(true);

    try {
      if (newStatus === 'En Route to Scene') {
        soundManager.playUrgentDispatchSound();
      } else if (newStatus === 'Completed') {
        soundManager.playAlertBeep();

        // Capture completed trip summary before status reset
        const selectedHosp = hospitalData?.all_hospitals?.find(h => h.id === selectedHospitalId) || hospitalData?.recommended_hospital;
        setRecentlyCompletedTrip({
          incidentId: ambulance.assigned_incident?.id || 'INC-10801',
          location: ambulance.assigned_incident?.location_name || 'Emergency Scene',
          hospitalName: selectedHosp ? selectedHosp.name : 'Govt Medical College Hospital & IRT, Perundurai',
          vehicleNo: ambulance.vehicle_no,
          driverName: ambulance.driver_name,
          completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }

      await updateDriverStatus({
        ambulance_id: ambulance.id,
        incident_id: ambulance.assigned_incident_id || undefined,
        status: newStatus,
        current_latitude: ambulance.latitude,
        current_longitude: ambulance.longitude,
        selected_hospital_id: selectedHospitalId || undefined
      });

      if (newStatus === 'Patient Picked Up' && ambulance.assigned_incident_id) {
        fetchHospitalRecs(ambulance.assigned_incident_id);
      }

      await loadDriverAmbulance();
      onStatusUpdated();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleSiren = () => {
    soundManager.toggleSiren((playing) => setIsSirenActive(playing));
  };

  if (loading && !ambulance) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        Connecting to Ambulance Vehicle Terminal {ambulanceId}...
      </div>
    );
  }

  if (!ambulance) {
    return (
      <div className="p-8 text-center text-red-500 text-xs font-bold">
        Ambulance unit {ambulanceId} not found in database.
      </div>
    );
  }

  const assignedInc = ambulance.assigned_incident;
  const currentStatus = ambulance.status;

  // Selected hospital for transfer
  const selectedHospObj = hospitalData?.all_hospitals?.find(h => h.id === selectedHospitalId) || hospitalData?.recommended_hospital;

  // Navigation coordinates for Google Maps & Driver Road Routing
  let navDestLat = assignedInc?.latitude || 11.2785;
  let navDestLng = assignedInc?.longitude || 77.5835;
  let navDestLabel = assignedInc?.location_name || 'Emergency Scene';
  let navDestType: 'incident' | 'hospital' = 'incident';

  if ((currentStatus === 'En Route to Hospital' || currentStatus === 'Patient Picked Up') && selectedHospObj) {
    navDestLat = selectedHospObj.latitude;
    navDestLng = selectedHospObj.longitude;
    navDestLabel = selectedHospObj.name;
    navDestType = 'hospital';
  }

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${navDestLat},${navDestLng}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Driver Unit Header Card */}
      <div className="bg-navy-900 text-white rounded-2xl p-5 shadow-xl border border-navy-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center font-bold text-white shadow-md">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">{ambulance.id}</h2>
                <span className="text-xs bg-navy-800 text-emerald-400 font-bold px-2 py-0.5 rounded-md font-mono border border-emerald-500/30">
                  {ambulance.driver_id || ('DRV-' + ambulance.id.replace('AMB-', ''))}
                </span>
                <span className="text-xs bg-navy-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                  {ambulance.vehicle_no}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Driver Pilot: <strong className="text-white">{ambulance.driver_name}</strong> • Base Hub: <span className="text-slate-200">{ambulance.base_station}</span>
              </p>
            </div>
          </div>

          {/* 108 Emergency Siren Button */}
          <button
            onClick={toggleSiren}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
              isSirenActive
                ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-lg shadow-red-600/50'
                : 'bg-navy-800 border-navy-700 text-slate-300 hover:bg-navy-700'
            }`}
          >
            {isSirenActive ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            <span className="text-[10px] font-bold">{isSirenActive ? 'SIREN ON' : '108 SIREN'}</span>
          </button>
        </div>

        {/* Current Ambulance Status Pill */}
        <div className="mt-4 pt-3 border-t border-navy-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-2">
            <span>Operational Status:</span>
            <span className="font-mono text-[11px] text-slate-400">Driver Unit #{ambulance.driver_id || ('DRV-' + ambulance.id.replace('AMB-', ''))}</span>
          </span>
          <span className={`px-3 py-1 rounded-full font-extrabold uppercase tracking-wide text-xs ${
            currentStatus === 'Available' ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' :
            currentStatus === 'Dispatched' ? 'bg-orange-500 text-white animate-pulse shadow-sm shadow-orange-500/30' :
            currentStatus === 'En Route to Scene' ? 'bg-amber-500 text-white' :
            currentStatus === 'At Scene' ? 'bg-red-600 text-white' :
            currentStatus === 'Patient Picked Up' ? 'bg-purple-600 text-white' :
            currentStatus === 'En Route to Hospital' ? 'bg-blue-600 text-white' :
            currentStatus === 'Maintenance' ? 'bg-slate-700 text-amber-300 border border-amber-400/40' :
            'bg-slate-700 text-slate-200'
          }`}>
            {currentStatus}
          </span>
        </div>
      </div>

      {/* Maintenance Notification Banner */}
      {currentStatus === 'Maintenance' && (
        <div className="p-4 bg-amber-950/40 border-2 border-amber-500/60 rounded-2xl text-xs text-amber-200 flex items-center gap-3">
          <Activity className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <span className="font-bold text-amber-300">Ambulance Under Scheduled Maintenance / Sanitization</span>
            <p className="text-[11px] text-amber-200/80 mt-0.5">
              Unit {ambulance.id} is temporarily out of service. To restore to Available, toggle from the Fleet Operations tab in Control Room.
            </p>
          </div>
        </div>
      )}

      {/* TRIP COMPLETED SUMMARY SCREEN (Shown after driver finishes trip) */}
      {recentlyCompletedTrip && (
        <div className="bg-white rounded-2xl p-8 border-2 border-emerald-500 shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Trip Completed • Patient Admitted
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-2">
              Emergency Trip Completed Successfully!
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
              Ambulance unit <strong>{recentlyCompletedTrip.vehicleNo}</strong> has delivered the patient safely to the hospital. Your vehicle status is automatically updated to <strong>Available</strong> on the central dispatch board.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-left space-y-2.5">
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-slate-500">Incident Reference:</span>
              <span className="font-mono font-bold text-slate-800">{recentlyCompletedTrip.incidentId}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-slate-500">Pickup Scene:</span>
              <span className="font-bold text-slate-800">{recentlyCompletedTrip.location}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-slate-500">Admitting Hospital:</span>
              <span className="font-bold text-sky-800">{recentlyCompletedTrip.hospitalName}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-slate-500">Driver in Command:</span>
              <span className="font-bold text-slate-800">{recentlyCompletedTrip.driverName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Completion Timestamp:</span>
              <span className="font-mono text-emerald-700 font-bold">{recentlyCompletedTrip.completedAt}</span>
            </div>
          </div>

          <div>
            <button
              onClick={() => setRecentlyCompletedTrip(null)}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all inline-flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Ready for Next Dispatch / Return to Standby</span>
            </button>
            <p className="text-[11px] text-slate-400 mt-2">
              Clicking resets your terminal back to live standby for receiving subsequent emergency dispatches.
            </p>
          </div>
        </div>
      )}

      {/* Standby State (When no incident assigned and not in completion screen) */}
      {!assignedInc && !recentlyCompletedTrip ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-900">
            Ambulance on Standby (Available)
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            No active emergency call is currently assigned. Stationed at {ambulance.base_station}.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Connected to Central 108 Control Room Dispatch</span>
          </div>
        </div>
      ) : assignedInc ? (
        <div className="space-y-6">
          {/* Incoming Dispatch Alert Notification */}
          {currentStatus === 'Dispatched' && (
            <div className="p-4 bg-orange-50 border-2 border-orange-400 rounded-2xl text-xs text-orange-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2.5">
                <Truck className="w-6 h-6 text-orange-600 flex-shrink-0" />
                <div>
                  <div className="font-extrabold text-sm text-orange-900">
                    EMERGENCY CALL DISPATCHED TO YOUR UNIT!
                  </div>
                  <p className="text-orange-800">
                    Please accept dispatch to confirm ride and notify Control Room.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('En Route to Scene')}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Dispatch (Confirm Ride)</span>
              </button>
            </div>
          )}

          {/* Assigned Incident Overview Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-md">
                    {assignedInc.id}
                  </span>
                  <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded-md uppercase">
                    {assignedInc.severity} Priority
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1.5">
                  {assignedInc.incident_type}
                </h3>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Turn-by-Turn GPS</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Incident Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-500 text-[11px] font-semibold">Incident Location:</span>
                <div className="font-bold text-slate-800 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{assignedInc.location_name}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  GPS: {assignedInc.latitude.toFixed(4)}, {assignedInc.longitude.toFixed(4)}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-500 text-[11px] font-semibold">Caller Contact:</span>
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{assignedInc.caller_phone}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {assignedInc.notes ? `Notes: "${assignedInc.notes}"` : 'No additional notes'}
                </div>
              </div>
            </div>

            {/* EXCLUSIVE DRIVER ROAD ROUTE MAP (Only shows this ambulance, this destination, and the road) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Route className="w-4 h-4 text-blue-600" />
                  <span>Driver Navigation Map (Exclusive Active Route)</span>
                </div>
                <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Target: {navDestLabel}
                </span>
              </div>

              <MapComponent
                ambulances={[ambulance]}
                incidents={[]}
                hospitals={[]}
                driverMode={true}
                driverRouteDestination={{
                  latitude: navDestLat,
                  longitude: navDestLng,
                  name: navDestLabel,
                  type: navDestType
                }}
                height="380px"
              />
            </div>

            {/* Nearest Best Hospital Finder (Only upon Patient Pick Up) */}
            {(currentStatus === 'Patient Picked Up' || currentStatus === 'En Route to Hospital') && (
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-sky-900 font-bold text-xs">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <span>Best Nearest Hospital with Available Beds (Perundurai & Erode)</span>
                </div>

                {loadingHospitals ? (
                  <div className="text-xs text-slate-500 py-2">
                    Finding nearest hospital with available beds...
                  </div>
                ) : hospitalData && hospitalData.all_hospitals.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-sky-800">
                      Select Destination Hospital for Transfer:
                    </p>

                    <select
                      value={selectedHospitalId}
                      onChange={(e) => setSelectedHospitalId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-sky-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {hospitalData.all_hospitals.map((hosp) => (
                        <option key={hosp.id} value={hosp.id}>
                          {hosp.name} ({hosp.distance_km} km away, ~{hosp.eta_minutes} mins) • {hosp.emergency_beds} ER / {hosp.icu_beds} ICU Beds
                        </option>
                      ))}
                    </select>

                    {selectedHospObj && (
                      <div className="p-3 bg-white rounded-lg border border-sky-200 text-xs text-slate-700 space-y-1">
                        <div className="font-extrabold text-sky-900 text-sm">
                          ⭐ Destination: {selectedHospObj.name}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Location: <strong>{selectedHospObj.location_name}</strong>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Distance: <strong>{selectedHospObj.distance_km} km</strong> • ETA: <strong>{selectedHospObj.eta_minutes} mins</strong>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Live Available Beds: <span className="font-bold text-sky-700">{selectedHospObj.emergency_beds} Emergency Beds</span>, <span className="font-bold text-red-700">{selectedHospObj.icu_beds} ICU Beds</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* DRIVER ACTION STEPPER */}
            <div className="pt-2 space-y-2.5">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Driver Ride Workflow:
              </div>

              {/* Step 1: Accept Dispatch */}
              {currentStatus === 'Dispatched' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('En Route to Scene')}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>1. Accept Dispatch (En Route to Scene)</span>
                </button>
              )}

              {/* Step 2: Arrived at Scene */}
              {currentStatus === 'En Route to Scene' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('At Scene')}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm rounded-xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all"
                >
                  <MapPin className="w-5 h-5" />
                  <span>2. Arrived at Scene</span>
                </button>
              )}

              {/* Step 3: Patient Picked Up */}
              {currentStatus === 'At Scene' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('Patient Picked Up')}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Activity className="w-5 h-5" />
                  <span>3. Patient Picked Up (Find Nearest Hospital)</span>
                </button>
              )}

              {/* Step 4: Start Hospital Trip */}
              {currentStatus === 'Patient Picked Up' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('En Route to Hospital')}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Navigation className="w-5 h-5" />
                  <span>4. Start Hospital Trip</span>
                </button>
              )}

              {/* Step 5: Trip Completed */}
              {currentStatus === 'En Route to Hospital' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('Completed')}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>5. Trip Completed (Return to Available)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
