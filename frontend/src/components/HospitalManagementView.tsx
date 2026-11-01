import React, { useState } from 'react';
import { 
  Building2, 
  BedDouble, 
  HeartPulse, 
  Wind, 
  Phone, 
  MapPin, 
  Plus, 
  Minus, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  Truck 
} from 'lucide-react';
import { Hospital, Ambulance } from '../types';
import { updateHospitalBeds } from '../api';
import { soundManager } from '../utils/sound';

interface HospitalManagementProps {
  hospitals: Hospital[];
  ambulances: Ambulance[];
  onHospitalsUpdated: () => void;
  hospitalUserMetaId?: string;
}

export const HospitalManagementView: React.FC<HospitalManagementProps> = ({
  hospitals,
  ambulances,
  onHospitalsUpdated,
  hospitalUserMetaId
}) => {
  const [bedState, setBedState] = useState<{ [key: string]: { emergency: number; icu: number; oxygen: number } }>({});
  const [saving, setSaving] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  // Incoming ambulances
  const incomingAmbulances = ambulances.filter(
    (a) => a.status === 'En Route to Hospital'
  );

  const getBeds = (hosp: Hospital) => {
    if (bedState[hosp.id]) return bedState[hosp.id];
    return {
      emergency: hosp.emergency_beds,
      icu: hosp.icu_beds,
      oxygen: hosp.oxygen_beds
    };
  };

  const handleAdjustBed = (hospId: string, type: 'emergency' | 'icu' | 'oxygen', delta: number) => {
    const hosp = hospitals.find((h) => h.id === hospId);
    if (!hosp) return;
    const current = getBeds(hosp);
    const updated = {
      ...current,
      [type]: Math.max(0, current[type] + delta)
    };
    setBedState((prev) => ({ ...prev, [hospId]: updated }));
  };

  const handleSaveBeds = async (hospId: string) => {
    const hosp = hospitals.find((h) => h.id === hospId);
    if (!hosp) return;
    const beds = getBeds(hosp);
    setSaving(true);

    try {
      await updateHospitalBeds(hospId, {
        emergency_beds: beds.emergency,
        icu_beds: beds.icu,
        oxygen_beds: beds.oxygen
      });
      soundManager.playAlertBeep();
      setSavedSuccessMsg(`Successfully updated bed capacities for ${hosp.name}`);
      setTimeout(() => setSavedSuccessMsg(''), 3000);
      onHospitalsUpdated();
    } catch (err: any) {
      alert(`Failed to save beds: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Current active hospital for the logged in user
  const activeHosp = hospitals.find(h => h.id === hospitalUserMetaId) || hospitals[0];
  const activeBeds = activeHosp ? getBeds(activeHosp) : { emergency: 0, icu: 0, oxygen: 0 };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600/10 text-sky-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                {activeHosp ? activeHosp.name : 'Hospital Management'}
              </h2>
              {activeHosp && (
                <span className="text-xs bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-md font-mono">
                  {activeHosp.id}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized Hospital Portal • {activeHosp ? activeHosp.location_name : 'Perundurai & Erode Hub'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-sky-50 text-sky-700 px-3 py-1.5 rounded-xl border border-sky-200 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Facility ID: <strong>{activeHosp?.id || 'ERODE-HOSP-01'}</strong></span>
          </span>
        </div>
      </div>

      {savedSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* PRIMARY ACTIVE HOSPITAL INDEPENDENT BED MANAGEMENT CONSOLE */}
      {activeHosp && (
        <div className="bg-gradient-to-br from-white to-sky-50/40 rounded-2xl p-6 border-2 border-sky-400 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-sky-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-sky-600 text-white uppercase tracking-wider">
                  Your Facility Console
                </span>
                <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {activeHosp.id}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-1.5">
                {activeHosp.name}
              </h3>
              <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <span>{activeHosp.location_name}</span>
                <span className="text-slate-300">•</span>
                <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Emergency Contact: <strong>{activeHosp.contact_phone}</strong></span>
              </p>
            </div>

            <div className="text-right flex-shrink-0 bg-white p-3 rounded-xl border border-sky-200 shadow-sm">
              <span className="text-[11px] text-slate-500 block font-medium">Total Available Beds</span>
              <span className="text-2xl font-black text-sky-700">
                {activeBeds.emergency + activeBeds.icu + activeBeds.oxygen}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Live Database Value</span>
            </div>
          </div>

          {/* Interactive Bed Adjusters for THIS Hospital */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Emergency Beds */}
            <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Emergency Beds</h4>
                  <p className="text-[11px] text-slate-500">Triage & Trauma Stabilization</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleAdjustBed(activeHosp.id, 'emergency', -1)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-base transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <span className="text-3xl font-black text-sky-900">{activeBeds.emergency}</span>
                  <span className="text-[10px] text-slate-400 block">Beds Free</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdjustBed(activeHosp.id, 'emergency', 1)}
                  className="w-9 h-9 rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center font-bold text-base transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ICU Beds */}
            <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">ICU Beds</h4>
                  <p className="text-[11px] text-slate-500">Intensive Care & Ventilators</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleAdjustBed(activeHosp.id, 'icu', -1)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-base transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <span className="text-3xl font-black text-red-900">{activeBeds.icu}</span>
                  <span className="text-[10px] text-slate-400 block">Beds Free</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdjustBed(activeHosp.id, 'icu', 1)}
                  className="w-9 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center font-bold text-base transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Oxygen Beds */}
            <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Oxygen Beds</h4>
                  <p className="text-[11px] text-slate-500">High-Flow O2 Assisted</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleAdjustBed(activeHosp.id, 'oxygen', -1)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-base transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <span className="text-3xl font-black text-teal-900">{activeBeds.oxygen}</span>
                  <span className="text-[10px] text-slate-400 block">Beds Free</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdjustBed(activeHosp.id, 'oxygen', 1)}
                  className="w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center font-bold text-base transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-3">
            <p className="text-xs text-slate-500">
              Changes are saved directly to MySQL database and reflect instantly across Control Room and Drivers.
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveBeds(activeHosp.id)}
              className="w-full sm:w-auto px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-sky-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving to Database...' : 'Save & Publish Bed Capacities'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Incoming Ambulances Alert Banner */}
      {incomingAmbulances.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <Truck className="w-4 h-4 text-amber-600 animate-bounce" />
            <span>Incoming 108 Emergency Ambulances ({incomingAmbulances.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {incomingAmbulances.map((amb) => (
              <div key={amb.id} className="p-2.5 bg-white rounded-xl border border-amber-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{amb.id} ({amb.vehicle_no})</span>
                  <div className="text-slate-500 text-[11px]">
                    Patient: {amb.assigned_incident?.incident_type || 'Emergency'} • Driver: {amb.driver_name} ({amb.driver_phone})
                  </div>
                </div>
                <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                  En Route
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regional Network Section: Exactly 7 Erode District Hospitals */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Regional Emergency Hospital Network (7 Erode District Facilities)
            </h3>
            <p className="text-xs text-slate-500">
              Live bed capacity reference across Perundurai & Erode Hubs
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
            {hospitals.length} Hospitals
          </span>
        </div>

        {/* Hospital Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {hospitals.map((hosp) => {
            const isHighlighted = (activeHosp && activeHosp.id === hosp.id);
            const currentBeds = getBeds(hosp);

            return (
              <div
                key={hosp.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-sm flex flex-col justify-between ${
                  isHighlighted
                    ? 'border-sky-500 ring-2 ring-sky-500/30 shadow-md bg-sky-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase font-mono">
                        {hosp.id}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 mt-1 line-clamp-1">
                        {hosp.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{hosp.location_name}</span>
                      </p>
                    </div>

                    {isHighlighted && (
                      <span className="text-[10px] bg-sky-600 text-white font-extrabold px-2 py-0.5 rounded-full flex-shrink-0">
                        Logged In
                      </span>
                    )}
                  </div>

                  <div className="py-2.5 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Phone: <strong>{hosp.contact_phone}</strong></span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Category: {hosp.type}
                    </div>
                  </div>

                  {/* Bed Counters */}
                  <div className="space-y-2 py-2">
                    <div className="flex items-center justify-between bg-sky-50 p-2 rounded-xl text-xs">
                      <span className="font-semibold text-sky-950">Emergency Beds</span>
                      <span className="font-black text-sky-900">{currentBeds.emergency}</span>
                    </div>
                    <div className="flex items-center justify-between bg-red-50 p-2 rounded-xl text-xs">
                      <span className="font-semibold text-red-950">ICU Beds</span>
                      <span className="font-black text-red-900">{currentBeds.icu}</span>
                    </div>
                    <div className="flex items-center justify-between bg-teal-50 p-2 rounded-xl text-xs">
                      <span className="font-semibold text-teal-950">Oxygen Beds</span>
                      <span className="font-black text-teal-900">{currentBeds.oxygen}</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl text-xs font-bold text-slate-800">
                      <span>Total Available Beds</span>
                      <span className="text-sm text-slate-900">{currentBeds.emergency + currentBeds.icu + currentBeds.oxygen}</span>
                    </div>
                  </div>
                </div>

                {isHighlighted && (
                  <div className="pt-3 border-t border-slate-100 mt-2 text-center text-[11px] text-sky-700 font-bold">
                    ✓ Managed in console above
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
