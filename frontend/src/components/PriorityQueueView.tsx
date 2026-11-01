import React, { useState, useEffect } from 'react';
import { 
  ListOrdered, 
  Flame, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Radio, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';
import { Incident, Ambulance } from '../types';
import { fetchPriorityQueue, recommendAmbulance, confirmDispatch } from '../api';
import { soundManager } from '../utils/sound';

interface PriorityQueueProps {
  onDispatchConfirmed: () => void;
  onNavigateTab: (tab: string) => void;
}

export const PriorityQueueView: React.FC<PriorityQueueProps> = ({
  onDispatchConfirmed,
  onNavigateTab
}) => {
  const [queue, setQueue] = useState<Incident[]>([]);
  const [recommendedIncident, setRecommendedIncident] = useState<Incident | null>(null);
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
      setQueue(res.priority_queue || []);
      setRecommendedIncident(res.recommended_for_dispatch || null);
      if (res.recommended_for_dispatch && !selectedIncident) {
        handleSelectIncidentForDispatch(res.recommended_for_dispatch);
      }
    } catch (err) {
      console.error('Error fetching priority queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleSelectIncidentForDispatch = async (incident: Incident) => {
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
      await confirmDispatch(selectedIncident.id, ambulanceId, 'Immediate dispatch approved from Priority Queue');
      soundManager.playUrgentDispatchSound();
      setDispatchSuccessMsg(`Ambulance ${ambulanceId} successfully dispatched! Driver alert transmitted.`);
      setTimeout(() => {
        onDispatchConfirmed();
        loadQueue();
        setSelectedIncident(null);
        setDispatchData(null);
      }, 1500);
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
      {/* Header & Min-Heap Explanation */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center font-bold">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Min-Heap Priority Queue & Dispatch Center
              </h2>
              <p className="text-xs text-slate-500">
                Organised strictly by: 1. Severity (High &gt; Med &gt; Low) • 2. Waiting Time (FIFO tiebreaker)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-medium text-slate-600">
            Queued Incidents: <strong className="text-slate-900">{queue.length}</strong>
          </div>
          <button
            onClick={loadQueue}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-xl transition-colors"
          >
            Refresh Queue
          </button>
        </div>
      </div>

      {dispatchSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{dispatchSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Priority Queue on Left, Distance Calculator & Dispatch on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Queued Incidents in Min-Heap Order */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-600" />
              Incidents Awaiting Dispatch ({queue.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Min-Heap Sorted</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              Loading Min-Heap Priority Queue...
            </div>
          ) : queue.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No Incidents Waiting for Dispatch</p>
              <p className="text-xs text-slate-400 mt-1">All registered emergencies have been dispatched or completed.</p>
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
                const isTop = index === 0;

                return (
                  <div
                    key={inc.id}
                    onClick={() => handleSelectIncidentForDispatch(inc)}
                    className={`rounded-2xl p-4 border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-red-50/60 border-red-500 shadow-md ring-2 ring-red-500/30'
                        : isTop
                        ? 'bg-white border-red-300 shadow-sm hover:border-red-400'
                        : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                    }`}
                  >
                    {isTop && (
                      <span className="absolute -top-2.5 right-4 bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Top Recommendation
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center font-mono">
                          #{index + 1}
                        </span>
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-900">{inc.id}</span>
                          <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            inc.severity === 'High' ? 'bg-red-100 text-red-700' :
                            inc.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {inc.severity} Priority
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
                      <span>Caller: <strong className="text-slate-700">{inc.caller_phone}</strong></span>
                      <button
                        type="button"
                        className={`text-xs font-bold flex items-center gap-1 ${
                          isSelected ? 'text-red-600' : 'text-blue-600'
                        }`}
                      >
                        <span>Calculate Ambulances</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Nearest Ambulance Distance Calculation & Confirmation */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              Nearest Ambulance Recommender (Haversine)
            </h3>
            <span className="text-[11px] text-slate-400">Separate Distance Module</span>
          </div>

          {!selectedIncident ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Select an incident from the Priority Queue to evaluate available ambulance distances.
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
              {/* Selected Incident Header */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-800 mb-1">
                  <span>TARGET INCIDENT: {selectedIncident.id}</span>
                  <span className={`px-2 py-0.5 rounded-full ${
                    selectedIncident.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {selectedIncident.severity}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">{selectedIncident.incident_type}</div>
                <div className="text-xs text-slate-600 mt-0.5">📍 {selectedIncident.location_name}</div>
              </div>

              {/* Nearest Ambulance List */}
              {calculatingDispatch ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Calculating Haversine distances to available ambulances in Perundurai & Erode...
                </div>
              ) : !dispatchData || dispatchData.ranked_ambulances.length === 0 ? (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>No ambulances are currently Available. All units are dispatched or in maintenance.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700">
                    Available Units Ranked by Distance to Incident:
                  </div>

                  {dispatchData.ranked_ambulances.map((amb, idx) => {
                    const isRecommended = idx === 0;

                    return (
                      <div
                        key={amb.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isRecommended
                            ? 'bg-emerald-50/70 border-emerald-400 shadow-sm ring-1 ring-emerald-400'
                            : 'bg-slate-50/60 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isRecommended ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                                <span>{amb.id}</span>
                                <span className="text-xs text-slate-500 font-mono font-normal">
                                  ({amb.vehicle_no})
                                </span>
                                {isRecommended && (
                                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.2 rounded-full uppercase">
                                    Nearest
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-600">
                                {amb.type} • Driver: {amb.driver_name} ({amb.driver_phone})
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
                          <span className="text-slate-500 text-[11px]">Base: {amb.base_station}</span>
                          <button
                            type="button"
                            disabled={isDispatching}
                            onClick={() => handleConfirmDispatch(amb.id)}
                            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors ${
                              isRecommended
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                : 'bg-slate-800 hover:bg-slate-900 text-white'
                            }`}
                          >
                            <Radio className="w-3.5 h-3.5" />
                            <span>Confirm Dispatch</span>
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
