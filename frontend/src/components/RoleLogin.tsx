import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Truck, 
  Building2, 
  Lock, 
  ArrowRight, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { Ambulance, Hospital } from '../types';

interface RoleLoginProps {
  ambulances: Ambulance[];
  hospitals: Hospital[];
  onLogin: (role: 'control_room' | 'driver' | 'hospital', meta?: { ambulanceId?: string; hospitalId?: string }) => void;
}

const DEFAULT_AMBULANCES: Ambulance[] = [
  {
    id: 'AMB-101',
    vehicle_no: 'TN 01 G 1081',
    type: 'Advanced Life Support (ALS)',
    driver_id: 'DRV-101',
    driver_name: 'Murugan R.',
    driver_phone: '9840112345',
    base_station: 'Perundurai Old Bus Stand Hub',
    latitude: 11.2780,
    longitude: 77.5840,
    status: 'Available',
    assigned_incident_id: null,
    last_updated: '2026-11-01T12:00:00Z'
  },
  {
    id: 'AMB-102',
    vehicle_no: 'TN 01 G 1082',
    type: 'Basic Life Support (BLS)',
    driver_id: 'DRV-102',
    driver_name: 'Senthil Kumar',
    driver_phone: '9840223456',
    base_station: 'Chithode Bypass Toll Hub',
    latitude: 11.3910,
    longitude: 77.6830,
    status: 'Available',
    assigned_incident_id: null,
    last_updated: '2026-11-01T12:00:00Z'
  },
  {
    id: 'AMB-103',
    vehicle_no: 'TN 02 G 1083',
    type: 'Advanced Cardiac Life Support',
    driver_id: 'DRV-103',
    driver_name: 'Karthik Raja',
    driver_phone: '9840334567',
    base_station: 'Erode Railway Station / GH Post',
    latitude: 11.3400,
    longitude: 77.7250,
    status: 'Available',
    assigned_incident_id: null,
    last_updated: '2026-11-01T12:00:00Z'
  },
  {
    id: 'AMB-104',
    vehicle_no: 'TN 02 G 1084',
    type: 'Basic Life Support (BLS)',
    driver_id: 'DRV-104',
    driver_name: 'Venkatesh S.',
    driver_phone: '9840445678',
    base_station: 'Thindal Ring Road Post',
    latitude: 11.3250,
    longitude: 77.6750,
    status: 'Available',
    assigned_incident_id: null,
    last_updated: '2026-11-01T12:00:00Z'
  },
  {
    id: 'AMB-105',
    vehicle_no: 'TN 03 G 1085',
    type: 'Basic Life Support (BLS)',
    driver_id: 'DRV-105',
    driver_name: 'Praveen Anand',
    driver_phone: '9840556789',
    base_station: 'Modakkurichi / Solar Post',
    latitude: 11.2950,
    longitude: 77.7400,
    status: 'Available',
    assigned_incident_id: null,
    last_updated: '2026-11-01T12:00:00Z'
  },
  {
    id: 'AMB-106',
    vehicle_no: 'TN 03 G 1086',
    type: 'Advanced Life Support (ALS)',
    driver_id: 'DRV-106',
    driver_name: 'Deepak Natarajan',
    driver_phone: '9840667890',
    base_station: 'Bhavani New Bus Stand Hub',
    latitude: 11.4480,
    longitude: 77.6830,
    status: 'Available',
    assigned_incident_id: null,
    last_updated: '2026-11-01T12:00:00Z'
  },
  {
    id: 'AMB-107',
    vehicle_no: 'TN-33-G-1087',
    type: 'Advanced Life Support (ALS)',
    driver_id: 'DRV-107',
    driver_name: 'Ramesh Kumar',
    driver_phone: '9842110807',
    base_station: 'IRT Medical College Campus, Perundurai',
    latitude: 11.2650,
    longitude: 77.5850,
    status: 'Available',
    assigned_incident_id: null,
    last_updated: '2026-11-01T12:00:00Z'
  }
];

export const RoleLogin: React.FC<RoleLoginProps> = ({ ambulances, hospitals, onLogin }) => {
  const driverList = ambulances && ambulances.length > 0 ? ambulances : DEFAULT_AMBULANCES;
  const [selectedRole, setSelectedRole] = useState<'control_room' | 'driver' | 'hospital' | null>(null);
  const [password, setPassword] = useState('');
  const [selectedAmbId, setSelectedAmbId] = useState(driverList[0]?.id || 'AMB-101');
  const [selectedHospId, setSelectedHospId] = useState(hospitals[0]?.id || 'ERODE-HOSP-01');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCardClick = (role: 'control_room' | 'driver' | 'hospital') => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'control_room') setPassword('108');
    if (role === 'driver') {
      const num = (selectedAmbId || 'AMB-101').replace('AMB-', '');
      setPassword(`drv-${num}`);
    }
    if (role === 'hospital') {
      const num = (selectedHospId || 'ERODE-HOSP-01').replace('ERODE-HOSP-', '').replace('HOSP-', '');
      setPassword(`hosp-${num}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    if (selectedRole === 'control_room') {
      const valid = ['108', 'control108', 'operator123', 'admin123'];
      if (valid.includes(password.trim().toLowerCase())) {
        onLogin('control_room');
      } else {
        setErrorMsg('Invalid Control Room password. (PIN: 108 or control108)');
      }
    } else if (selectedRole === 'driver') {
      const ambNum = selectedAmbId.replace('AMB-', '');
      const validDriverPins = [
        'driver108', '108', 'driver123',
        `drv-${ambNum}`.toLowerCase(),
        `driver${ambNum}`.toLowerCase(),
        `drv${ambNum}`.toLowerCase()
      ];
      if (validDriverPins.includes(password.trim().toLowerCase())) {
        onLogin('driver', { ambulanceId: selectedAmbId });
      } else {
        setErrorMsg(`Invalid Driver password for ${selectedAmbId}. (Accepted PINs: drv-${ambNum}, driver${ambNum}, or driver108)`);
      }
    } else if (selectedRole === 'hospital') {
      const hospNum = selectedHospId.replace('ERODE-HOSP-', '').replace('HOSP-', '');
      const validHospitalPins = [
        'hospital108', '108', 'hospital123',
        `hosp-${hospNum}`.toLowerCase(),
        `hosp${hospNum}`.toLowerCase(),
        `erode-hosp-${hospNum}`.toLowerCase(),
        selectedHospId.toLowerCase()
      ];
      if (validHospitalPins.includes(password.trim().toLowerCase())) {
        onLogin('hospital', { hospitalId: selectedHospId });
      } else {
        setErrorMsg(`Invalid Hospital password for ${selectedHospId}. (Accepted PINs: hosp-${hospNum}, hospital123, or hospital108)`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30 font-black text-2xl text-white tracking-wider border-2 border-white/20">
            108
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              EMERGENCY AMBULANCE DISPATCH SYSTEM
              <span className="text-xs bg-red-600/20 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                LIVE
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              Perundurai & Erode District Hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>108 Emergency Medical Services • Authorized Portals</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full py-8 my-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Select Your Emergency Portal
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2">
            Choose your designated portal below and enter your secure passcode to access your operational console.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Control Room */}
          <div
            onClick={() => handleCardClick('control_room')}
            className={`group relative rounded-2xl p-6 transition-all duration-300 cursor-pointer border flex flex-col justify-between ${
              selectedRole === 'control_room'
                ? 'bg-gradient-to-b from-blue-900/60 to-slate-900 border-red-500 shadow-xl shadow-red-600/20 ring-2 ring-red-500/50'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 hover:border-red-500/60 shadow-lg'
            }`}
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center mb-5 border border-red-500/30 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                Central Operations
              </span>
              <h3 className="text-xl font-bold text-white mt-2 mb-2">
                Control Room Login
              </h3>
              <ul className="text-xs text-slate-300 space-y-2 mb-6">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Call registration & live GPS detection</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>200-metre duplicate call detection</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Ambulance dispatch & driver notifications</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Fleet telemetry & completed trip logs</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                selectedRole === 'control_room'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'bg-slate-700/80 hover:bg-red-600 text-white'
              }`}
            >
              <span>Access Control Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Ambulance Driver */}
          <div
            onClick={() => handleCardClick('driver')}
            className={`group relative rounded-2xl p-6 transition-all duration-300 cursor-pointer border flex flex-col justify-between ${
              selectedRole === 'driver'
                ? 'bg-gradient-to-b from-emerald-950/60 to-slate-900 border-emerald-500 shadow-xl shadow-emerald-600/20 ring-2 ring-emerald-500/50'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 hover:border-emerald-500/60 shadow-lg'
            }`}
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                <Truck className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Field Response Unit
              </span>
              <h3 className="text-xl font-bold text-white mt-2 mb-2">
                Ambulance Driver Login
              </h3>
              <ul className="text-xs text-slate-300 space-y-2 mb-6">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Interactive Map & GPS routing navigation</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Accept ride & notify Control Room</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Nearest hospital finder with available beds</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Turn-by-turn Google Maps & 108 siren</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                selectedRole === 'driver'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-700/80 hover:bg-emerald-600 text-white'
              }`}
            >
              <span>Access Driver Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Hospital Login */}
          <div
            onClick={() => handleCardClick('hospital')}
            className={`group relative rounded-2xl p-6 transition-all duration-300 cursor-pointer border flex flex-col justify-between ${
              selectedRole === 'hospital'
                ? 'bg-gradient-to-b from-sky-950/60 to-slate-900 border-sky-500 shadow-xl shadow-sky-600/20 ring-2 ring-sky-500/50'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 hover:border-sky-500/60 shadow-lg'
            }`}
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-sky-600/20 text-sky-400 flex items-center justify-center mb-5 border border-sky-500/30 group-hover:scale-105 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Medical Facility Desk
              </span>
              <h3 className="text-xl font-bold text-white mt-2 mb-2">
                Hospital Login
              </h3>
              <ul className="text-xs text-slate-300 space-y-2 mb-6">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Exclusive bed availability management</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Emergency, ICU, and Oxygen bed counts</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Incoming ambulance triage notifications</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Perundurai & Erode regional facilities</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                selectedRole === 'hospital'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'bg-slate-700/80 hover:bg-sky-600 text-white'
              }`}
            >
              <span>Access Hospital Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Role Authentication Form */}
        {selectedRole && (
          <div className="mt-8 max-w-lg mx-auto bg-slate-800/95 border border-slate-700 rounded-2xl p-6 shadow-2xl backdrop-blur-md animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700 mb-5">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-500" />
                <h4 className="font-bold text-white text-base">
                  {selectedRole === 'control_room' && 'Control Room Authentication'}
                  {selectedRole === 'driver' && 'Ambulance Driver Login'}
                  {selectedRole === 'hospital' && 'Hospital Administrator Login'}
                </h4>
              </div>
              <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full font-mono uppercase">
                {selectedRole.replace('_', ' ')}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* If Driver, vehicle selector */}
              {selectedRole === 'driver' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Select Ambulance Driver (7 Units Available)</span>
                    <span className="text-[10px] text-emerald-400 font-normal">All 7 Drivers Active</span>
                  </label>
                  <select
                    value={selectedAmbId}
                    onChange={(e) => {
                      setSelectedAmbId(e.target.value);
                      const num = e.target.value.replace('AMB-', '');
                      setPassword(`drv-${num}`);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    {driverList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.id} • {a.driver_name} ({a.driver_id || 'DRV-' + a.id.replace('AMB-', '')}) — {a.base_station}
                      </option>
                    ))}
                  </select>

                  {/* Active Selected Driver Info Badge */}
                  {(() => {
                    const sel = driverList.find(d => d.id === selectedAmbId) || driverList[0];
                    if (!sel) return null;
                    const dId = sel.driver_id || ('DRV-' + sel.id.replace('AMB-', ''));
                    return (
                      <div className="mt-2 p-2.5 bg-slate-900/90 rounded-xl border border-emerald-500/30 text-xs text-slate-300 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">👤 Driver: {sel.driver_name} <span className="font-mono text-emerald-400 text-[11px] font-bold">({dId})</span></span>
                          <span className="font-mono text-emerald-400 text-[11px] font-bold">{sel.vehicle_no}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between">
                          <span>📍 Base: {sel.base_station}</span>
                          <span>📞 {sel.driver_phone}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* If Hospital, hospital selector */}
              {selectedRole === 'hospital' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Select Your Hospital Facility</span>
                    <span className="text-[10px] text-sky-400 font-normal">7 Erode Regional Facilities</span>
                  </label>
                  <select
                    value={selectedHospId}
                    onChange={(e) => {
                      setSelectedHospId(e.target.value);
                      const num = e.target.value.replace('ERODE-HOSP-', '').replace('HOSP-', '');
                      setPassword(`hosp-${num}`);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.id} • {h.name} ({h.location_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Password field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Secure Passcode / Individual PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter PIN / Passcode"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono tracking-wider"
                    required
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5">
                  {selectedRole === 'control_room' && (
                    <span>Authorized PIN hint: <strong className="font-mono text-red-400 font-bold">108</strong> or <strong className="font-mono text-red-400 font-bold">control108</strong></span>
                  )}
                  {selectedRole === 'driver' && (() => {
                    const num = selectedAmbId.replace('AMB-', '');
                    return (
                      <span>Individual Driver PIN: <strong className="font-mono text-emerald-400 font-bold">drv-{num}</strong> (or Master PIN: <strong className="font-mono text-emerald-400 font-bold">driver108</strong>)</span>
                    );
                  })()}
                  {selectedRole === 'hospital' && (() => {
                    const num = selectedHospId.replace('ERODE-HOSP-', '').replace('HOSP-', '');
                    return (
                      <span>Individual Hospital PIN: <strong className="font-mono text-sky-400 font-bold">hosp-{num}</strong> (or Master PIN: <strong className="font-mono text-sky-400 font-bold">hospital108</strong>)</span>
                    );
                  })()}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="w-1/3 py-2.5 px-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`w-2/3 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 ${
                    selectedRole === 'control_room' ? 'bg-red-600 hover:bg-red-500' :
                    selectedRole === 'driver' ? 'bg-emerald-600 hover:bg-emerald-500' :
                    'bg-sky-600 hover:bg-sky-500'
                  }`}
                >
                  <span>Enter Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-4 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>108 Emergency Ambulance Dispatch System • Perundurai & Erode District Hub</p>
        <p>Tamil Nadu Emergency Medical Services (TN-EMS)</p>
      </footer>
    </div>
  );
};
