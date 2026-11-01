import React, { useState } from 'react';
import { 
  PhoneCall, 
  Compass, 
  Sparkles, 
  AlertTriangle, 
  PhoneForwarded, 
  CheckCircle2, 
  X, 
  Link as LinkIcon 
} from 'lucide-react';
import { Incident, DuplicateDetectionResult } from '../types';
import { registerIncident, linkDuplicateCall, forwardCall } from '../api';
import { soundManager } from '../utils/sound';

interface CallRegistrationProps {
  onIncidentCreated: (newInc: Incident) => void;
  onNavigateTab: (tab: string) => void;
}

const REGIONAL_PRESETS = [
  { name: 'Perundurai Old Bus Stand', lat: 11.2785, lng: 77.5835, type: 'Road Traffic Accident' },
  { name: 'Kongu Engineering College, Perundurai', lat: 11.2720, lng: 77.6070, type: 'Severe Trauma / Fracture' },
  { name: 'Chithode Bypass Toll Plaza (NH 544)', lat: 11.3780, lng: 77.6710, type: 'Multi-Vehicle Collision' },
  { name: 'Erode Railway Station / Brough Road', lat: 11.3400, lng: 77.7250, type: 'Cardiac Arrest / Emergency' },
  { name: 'Thindal Murugan Temple Arch, Erode', lat: 11.3250, lng: 77.6750, type: 'Pregnancy / Emergency Labor' },
];

export const CallRegistrationForm: React.FC<CallRegistrationProps> = ({
  onIncidentCreated,
  onNavigateTab
}) => {
  const [callerPhone, setCallerPhone] = useState('98421 98765');
  const [callerName, setCallerName] = useState('Citizen Caller');
  const [locationName, setLocationName] = useState('Perundurai Old Bus Stand, Perundurai');
  const [latitude, setLatitude] = useState(11.2785);
  const [longitude, setLongitude] = useState(77.5835);
  const [incidentType, setIncidentType] = useState('Road Traffic Accident');
  const [ambulancesRequired, setAmbulancesRequired] = useState(1);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [enableDuplicateCheck, setEnableDuplicateCheck] = useState(true);

  // Duplicate Call Modal State
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateData, setDuplicateData] = useState<DuplicateDetectionResult | null>(null);

  // Forwarding Modal State
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardTarget, setForwardTarget] = useState('Coimbatore Regional 108 Command Center');
  const [forwardResult, setForwardResult] = useState<any>(null);

  // 1. Detect Live GPS Location
  const handleDetectLiveLocation = () => {
    setIsDetectingGps(true);
    setGpsStatusMsg('Requesting browser geolocation...');

    if (!navigator.geolocation) {
      setGpsStatusMsg('Geolocation not supported by this browser. Using Perundurai coordinates.');
      setIsDetectingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setLocationName(`Current User Live Location (${lat}, ${lng})`);
        setGpsStatusMsg(`Live GPS Locked: Latitude ${lat}, Longitude ${lng}`);
        setIsDetectingGps(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setGpsStatusMsg('GPS permission denied or unavailable. Fallback to Perundurai coordinates.');
        setLatitude(11.2785);
        setLongitude(77.5835);
        setIsDetectingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 2. Simulate Incoming Emergency Call
  const handleSimulateCall = () => {
    const randomPreset = REGIONAL_PRESETS[Math.floor(Math.random() * REGIONAL_PRESETS.length)];
    const randomPhone = `9842${Math.floor(100000 + Math.random() * 900000)}`;

    setCallerPhone(randomPhone);
    setCallerName(['Kavitha R', 'Senthil K', 'Balaji M', 'Priyanka S', 'Muthusamy N'][Math.floor(Math.random() * 5)]);
    setLocationName(randomPreset.name);
    setLatitude(randomPreset.lat);
    setLongitude(randomPreset.lng);
    setIncidentType(randomPreset.type);
    setAmbulancesRequired(1);
    setGpsStatusMsg('');
    soundManager.playAlertBeep();
  };

  // 3. Submit Emergency Call Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      const result = await registerIncident({
        caller_phone: callerPhone,
        caller_name: callerName,
        location_name: locationName,
        latitude,
        longitude,
        incident_type: incidentType,
        severity: 'High',
        ambulances_required: ambulancesRequired,
        notes: `Registered emergency call at ${locationName}`
      }, !enableDuplicateCheck);

      if (result.status === 'duplicate_detected') {
        soundManager.playAlertBeep();
        setDuplicateData(result.duplicate_data);
        setDuplicateModalOpen(true);
      } else if (result.status === 'success') {
        soundManager.playUrgentDispatchSound();
        setSuccessMsg(`Call Registered Successfully! Incident ID: ${result.incident.id}`);
        onIncidentCreated(result.incident);
        setTimeout(() => {
          onNavigateTab('ambulance_dispatch');
        }, 1200);
      }
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Link duplicate call
  const handleConfirmLink = async () => {
    if (!duplicateData?.existing_incident_id) return;
    try {
      await linkDuplicateCall(duplicateData.existing_incident_id, {
        caller_phone: callerPhone,
        caller_name: callerName,
        notes: `Duplicate caller confirming incident at ${locationName}`
      });
      setDuplicateModalOpen(false);
      onNavigateTab('active_incidents');
    } catch (err: any) {
      alert(`Linking failed: ${err.message}`);
    }
  };

  // 5. Create separate incident
  const handleConfirmCreateSeparate = async () => {
    try {
      const result = await registerIncident({
        caller_phone: callerPhone,
        caller_name: callerName,
        location_name: locationName,
        latitude,
        longitude,
        incident_type: incidentType,
        severity: 'High',
        ambulances_required: ambulancesRequired,
        notes: `Separate emergency call confirmed by operator`
      }, true);

      setDuplicateModalOpen(false);
      if (result.status === 'success') {
        soundManager.playUrgentDispatchSound();
        setSuccessMsg(`Call Registered Successfully! Incident ID: ${result.incident.id}`);
        onIncidentCreated(result.incident);
        setTimeout(() => {
          onNavigateTab('ambulance_dispatch');
        }, 1200);
      }
    } catch (err: any) {
      alert(`Failed to create incident: ${err.message}`);
    }
  };

  // 6. Call Forwarding Simulation
  const handleExecuteForward = async () => {
    try {
      const res = await forwardCall({
        caller_phone: callerPhone,
        caller_name: callerName,
        location_name: locationName,
        latitude,
        longitude,
        incident_type: incidentType,
        severity: 'High',
        target_control_room: forwardTarget
      });
      setForwardResult(res);
      soundManager.playAlertBeep();
    } catch (err: any) {
      alert(`Forwarding failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Information Banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-900 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            108 Emergency Call Registration & Dispatch Console
          </p>
          <p className="text-sky-800 leading-relaxed">
            Record caller information, capture live GPS coordinates, and evaluate 200-metre / 10-minute duplicate call detection. Once registered, proceed to Ambulance Dispatch.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Registration Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Register Emergency Call
              </h2>
              <p className="text-xs text-slate-500">
                Capture caller location and incident details for ambulance dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateCall}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulate Call</span>
            </button>
            <button
              type="button"
              onClick={() => setForwardModalOpen(true)}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <PhoneForwarded className="w-3.5 h-3.5" />
              <span>Forward Call</span>
            </button>
          </div>
        </div>

        {/* Quick Regional Location Presets */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Perundurai & Erode Quick Locations:
          </label>
          <div className="flex flex-wrap gap-2">
            {REGIONAL_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setLocationName(preset.name);
                  setLatitude(preset.lat);
                  setLongitude(preset.lng);
                  setIncidentType(preset.type);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  locationName === preset.name
                    ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Registration Form (Severity & Incident Notes REMOVED as requested!) */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Caller Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Caller Phone Number *
              </label>
              <input
                type="text"
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
                placeholder="e.g. 98421 12345"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
            </div>

            {/* Caller Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Caller / Reporter Name
              </label>
              <input
                type="text"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                placeholder="Citizen Name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Location Name & Live GPS */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Incident Location Name & Address *
                </label>
                <button
                  type="button"
                  onClick={handleDetectLiveLocation}
                  disabled={isDetectingGps}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Compass className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                  <span>{isDetectingGps ? 'Detecting GPS...' : 'Use My Live GPS Location'}</span>
                </button>
              </div>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Perundurai Old Bus Stand, Erode"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {gpsStatusMsg && (
                <p className="text-xs text-emerald-700 font-medium mt-1">
                  ✓ {gpsStatusMsg}
                </p>
              )}
            </div>

            {/* Coordinates */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Latitude Coordinates (GPS) *
              </label>
              <input
                type="number"
                step="0.000001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Longitude Coordinates (GPS) *
              </label>
              <input
                type="number"
                step="0.000001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Incident Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Emergency Incident Type *
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
              >
                <option value="Road Traffic Accident">Road Traffic Accident (RTA)</option>
                <option value="Cardiac Arrest / Heart Emergency">Cardiac Arrest / Heart Emergency</option>
                <option value="Severe Trauma / Fracture">Severe Trauma / Fracture</option>
                <option value="Respiratory Distress">Respiratory Distress / Asthma</option>
                <option value="Pregnancy / Emergency Labor">Pregnancy / Emergency Labor</option>
                <option value="Stroke / Cerebrovascular">Stroke / Sudden Paralysis</option>
                <option value="Poisoning / Snakebite">Poisoning / Snakebite</option>
                <option value="Burn Injury / Fire Emergency">Burn Injury / Fire Emergency</option>
                <option value="Unconscious / General Critical">Unconscious / General Critical</option>
              </select>
            </div>

            {/* Ambulances Required */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ambulances Required
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={ambulancesRequired}
                onChange={(e) => setAmbulancesRequired(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
              />
            </div>
          </div>

          {/* Duplicate Call Detection Setting */}
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableDuplicateCheck}
                onChange={(e) => setEnableDuplicateCheck(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
              />
              <span className="font-semibold text-slate-700">Check for Duplicate Calls (200m radius &le; 10 mins)</span>
            </label>
            <span className="text-[11px] text-slate-400">Haversine formula</span>
          </div>

          {/* Clean Submit Button (No "Priority Queue" text, pure "Register Emergency Call") */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering Call...' : 'Register Emergency Call'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Call Modal */}
      {duplicateModalOpen && duplicateData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-200">
            <div className="flex items-center justify-between pb-3 border-b border-red-100 mb-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Potential Duplicate Call Detected
                  </h3>
                  <p className="text-xs text-red-600 font-semibold">
                    Haversine Match: Radius &le; 200m & Time &le; 10 minutes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 text-xs space-y-2 mb-5">
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Existing Incident ID:</span>
                <span className="font-mono font-black text-red-700">{duplicateData.existing_incident_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Distance from Current Call:</span>
                <span className="font-bold text-slate-900">{duplicateData.distance_meters} metres</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Time Difference:</span>
                <span className="font-bold text-slate-900">{duplicateData.time_diff_minutes} minutes ago</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Existing Location:</span>
                <span className="text-slate-800">{duplicateData.location_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Type / Status:</span>
                <span className="font-semibold text-slate-900">{duplicateData.incident_type} ({duplicateData.current_status})</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6">
              Please choose whether to link this incoming caller to the existing incident or create a separate ticket:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleConfirmLink}
                className="py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                <span>Link Call</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmCreateSeparate}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>Create Separate Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Forwarding Modal */}
      {forwardModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <PhoneForwarded className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Forward Emergency Call to Neighbouring Control Room
                </h3>
              </div>
              <button
                onClick={() => { setForwardModalOpen(false); setForwardResult(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!forwardResult ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  If operators are busy, the call is immediately forwarded to an adjacent control room. <strong>The caller is never placed into a waiting queue.</strong>
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Target Control Room:
                  </label>
                  <select
                    value={forwardTarget}
                    onChange={(e) => setForwardTarget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Coimbatore Regional 108 Command Center">Coimbatore Regional 108 Command Center</option>
                    <option value="Salem Central 108 Dispatch Center">Salem Central 108 Dispatch Center</option>
                    <option value="Tiruppur District 108 Emergency Center">Tiruppur District 108 Emergency Center</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200 space-y-1">
                  <div><strong>Caller:</strong> {callerPhone} ({callerName})</div>
                  <div><strong>Location:</strong> {locationName}</div>
                  <div><strong>Incident Type:</strong> {incidentType}</div>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteForward}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <PhoneForwarded className="w-4 h-4" />
                  <span>Execute Call Forwarding</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-base text-slate-900">
                  Call Forwarded Successfully
                </h4>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 text-left space-y-1.5">
                  <p><strong>Forward ID:</strong> {forwardResult.forward_id}</p>
                  <p><strong>Receiving Control Room:</strong> {forwardResult.receiving_control_room}</p>
                  <p><strong>Status:</strong> {forwardResult.status} (External Telephony Simulated)</p>
                  <p><strong>Caller:</strong> {forwardResult.caller_phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setForwardModalOpen(false); setForwardResult(null); }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
