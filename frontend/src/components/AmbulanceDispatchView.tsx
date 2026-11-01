import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  PhoneCall, 
  Sparkles 
} from 'lucide-react';
import { Incident, Ambulance } from '../types';
import { fetchPriorityQueue, recommendAmbulance, confirmDispatch } from '../api';
import { soundManager } from '../utils/sound';

interface AmbulanceDispatchProps {
  onDispatchConfirmed: () => void;
  onNavigateTab: (tab: string) => void;
  targetIncidentId?: string | null;
}

export const AmbulanceDispatchView: React.FC<AmbulanceDispatchProps> = ({
  onDispatchConfirmed,
  onNavigateTab,
  targetIncidentId
}) => {
  const [queue, setQueue] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispatch selection state
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [dispatchData, setDispatchData] = useState<{
    recommended_ambulance: Ambulance | null;
    ranked_ambulances: Ambulance[];
  } | null>(null);
  const [calculatingDispatch, setCalculatingDispatch] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState('');

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await fetchPriorityQueue();
      const list = res.priority_queue || [];
      setQueue(list);

      // If a specific incident was registered or top recommended exists, auto-select it
      if (targetIncidentId) {
        const found = list.find(i => i.id === targetIncidentId);
        if (found) {
          handleSelectIncident(found);
          return;
        }
      }
      if (res.recommended_for_dispatch && !selectedIncident) {
        handleSelectIncident(res.recommended_for_dispatch);
      }
    } catch (err) {
      console.error('Error fetching dispatch queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [targetIncidentId]);

  const handleSelectIncident = async (incident: Incident) => {
    setSelectedIncident(incident);
    setCalculatingDispatch(true);
    setDispatchSuccessMsg('');

    try {
      const res = await recommendAmbulance(incident.id);
      setDispatchData({
        recommended_ambulance: res.recommended_ambulance,
        ranked_ambulances: res.ranked_ambulances || []
      });
    } catch (err) {
      console.error('Error calculating ambulance recommendations:', err);
    } finally {
      setCalculatingDispatch(false);
    }
  };

  const handleConfirmDispatch = async (ambulanceId: string) => {
    if (!selectedIncident) return;
    setIsDispatching(true);

    try {
      const res = await confirmDispatch(selectedIncident.id, ambulanceId, 'Immediate dispatch approved from Control Room');
      soundManager.playUrgentDispatchSound();
      
      // Clean, unambiguous success message confirming dispatch!
      setDispatchSuccessMsg(
        `Ambulance ${ambulanceId} (${res.ambulance?.vehicle_no || ''}) Dispatched Successfully to ${selectedIncident.location_name}! Notification sent to driver.`
      );

      setTimeout(() => {
        onDispatchConfirmed();
        loadQueue();
        setSelectedIncident(null);
        setDispatchData(null);
      }, 2500);
    } catch (err: any) {
      alert(`Dispatch failed: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const formatWaitTime = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMins = Math.max(1, Math.floor(diffMs / 60000));
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center font-bold">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Ambulance Dispatch Console
            </h2>
            <p className="text-xs text-slate-500">
              Assign and dispatch the nearest available emergency response unit to registered calls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-medium text-slate-600">
            Pending Dispatch: <strong className="text-slate-900">{queue.length}</strong>
          </div>
          <button
            onClick={loadQueue}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-xl transition-colors"
          >
            Refresh List
          </button>
        </div>
      </div>

      {/* Prominent Dispatch Success Notification Message */}
      {dispatchSuccessMsg && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 text-emerald-950 rounded-2xl flex items-start gap-3 text-sm font-bold shadow-md animate-fadeIn">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-emerald-900 font-extrabold text-base">DISPATCH CONFIRMED!</div>
            <p className="text-xs text-emerald-800 font-medium mt-0.5">{dispatchSuccessMsg}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Registered Calls on Left, Nearest Available Ambulances on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Registered Incidents */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-red-600" />
              Registered Calls Awaiting Ambulance ({queue.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              Loading registered emergency calls...
            </div>
          ) : queue.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">All Registered Calls Dispatched</p>
              <p className="text-xs text-slate-400 mt-1">No pending emergency calls are waiting for ambulance allocation.</p>
              <button
                onClick={() => onNavigateTab('register_call')}
                className="mt-4 px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-red-700 transition-colors"
              >
                + Register New Emergency Call
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((inc, index) => {
                const isSelected = selectedIncident?.id === inc.id;

                return (
                  <div
                    key={inc.id}
                    onClick={() => handleSelectIncident(inc)}
                    className={`rounded-2xl p-4 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-50/60 border-red-500 shadow-md ring-2 ring-red-500/30'
                        : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center font-mono">
                          #{index + 1}
                        </span>
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-900">{inc.id}</span>
                          <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            Emergency
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatWaitTime(inc.created_at)}</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-2">
                      {inc.incident_type}
                    </h4>

                    <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{inc.location_name}</span>
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Caller: <strong className="text-slate-700">{inc.caller_phone}</strong> ({inc.caller_name})</span>
                      <button
                        type="button"
                        className={`text-xs font-bold flex items-center gap-1 ${
                          isSelected ? 'text-red-600' : 'text-blue-600'
                        }`}
                      >
                        <span>Select for Dispatch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Available Ambulances with Nearest Unit Ranked First */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              Available Ambulances (Nearest Ranked First)
            </h3>
          </div>

          {!selectedIncident ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Select an incident from the left list to evaluate available ambulances.
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
              {/* Selected Incident Banner */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-800 mb-1">
                  <span>DISPATCH TARGET: {selectedIncident.id}</span>
                  <span className="text-red-600 font-bold">108 Emergency</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{selectedIncident.incident_type}</div>
                <div className="text-xs text-slate-600 mt-0.5">📍 {selectedIncident.location_name}</div>
              </div>

              {/* Ambulance List */}
              {calculatingDispatch ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Calculating nearest available ambulances around Perundurai & Erode...
                </div>
              ) : !dispatchData || dispatchData.ranked_ambulances.length === 0 ? (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>No ambulances are currently Available. All units are occupied or under maintenance.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700">
                    Available Units Ranked by Proximity:
                  </div>

                  {dispatchData.ranked_ambulances.map((amb, idx) => {
                    const isNearest = idx === 0;

                    return (
                      <div
                        key={amb.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isNearest
                            ? 'bg-emerald-50/70 border-emerald-400 shadow-sm ring-1 ring-emerald-400'
                            : 'bg-slate-50/60 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isNearest ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                                <span>{amb.id}</span>
                                <span className="text-xs text-slate-500 font-mono font-normal">
                                  ({amb.vehicle_no})
                                </span>
                                {isNearest && (
                                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.2 rounded-full uppercase flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Nearest Unit
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-600">
                                {amb.type} • Driver: <strong>{amb.driver_name}</strong> <span className="font-mono text-emerald-700 font-bold">({amb.driver_id || ('DRV-' + amb.id.replace('AMB-', ''))})</span> • {amb.driver_phone}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-black text-slate-900">
                              {amb.distance_km} km
                            </div>
                            <div className="text-[11px] font-bold text-emerald-700">
                              ETA ~{amb.eta_minutes} mins
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                          <span className="text-slate-500 text-[11px]">Base Hub: {amb.base_station}</span>
                          <button
                            type="button"
                            disabled={isDispatching}
                            onClick={() => handleConfirmDispatch(amb.id)}
                            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm ${
                              isNearest
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                                : 'bg-slate-800 hover:bg-slate-900 text-white'
                            }`}
                          >
                            <Radio className="w-3.5 h-3.5" />
                            <span>Dispatch Ambulance</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
