import React, { useState } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  Wrench, 
  MapPin, 
  Phone, 
  Radio, 
  AlertCircle, 
  Layers 
} from 'lucide-react';
import { Ambulance } from '../types';
import { toggleAmbulanceStatus } from '../api';
import { soundManager } from '../utils/sound';

interface FleetProps {
  ambulances: Ambulance[];
  onFleetUpdated: () => void;
}

export const AmbulanceFleetView: React.FC<FleetProps> = ({
  ambulances,
  onFleetUpdated
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggle = async (ambId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Maintenance' ? 'Available' : 'Maintenance';
    setUpdatingId(ambId);

    try {
      await toggleAmbulanceStatus(ambId, nextStatus, `Administrator toggle to ${nextStatus}`);
      soundManager.playAlertBeep();
      onFleetUpdated();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              108 Ambulance Fleet Operations & Telematics
            </h2>
            <p className="text-xs text-slate-500">
              Stationed across Perundurai & Erode Hubs • Maintenance & Availability Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-bold">
            Available: {ambulances.filter(a => a.status === 'Available').length}
          </span>
          <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl border border-orange-200 font-bold">
            Dispatched: {ambulances.filter(a => a.status !== 'Available' && a.status !== 'Maintenance').length}
          </span>
          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 font-bold">
            Maintenance: {ambulances.filter(a => a.status === 'Maintenance').length}
          </span>
        </div>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ambulances.map((amb) => {
          const isAvailable = amb.status === 'Available';
          const isMaintenance = amb.status === 'Maintenance';
          const isBusy = !isAvailable && !isMaintenance;

          return (
            <div
              key={amb.id}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-sm flex flex-col justify-between ${
                isAvailable ? 'border-emerald-300' :
                isBusy ? 'border-orange-300' : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-slate-900">{amb.id}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        {amb.vehicle_no}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      {amb.type}
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    isAvailable ? 'bg-emerald-100 text-emerald-800' :
                    isMaintenance ? 'bg-slate-200 text-slate-700' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {amb.status}
                  </span>
                </div>

                {/* Details */}
                <div className="py-3 text-xs space-y-2 text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Base Post: <strong>{amb.base_station}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Driver: <strong>{amb.driver_name}</strong> <span className="font-mono text-emerald-700 font-bold">({amb.driver_id || ('DRV-' + amb.id.replace('AMB-', ''))})</span> • {amb.driver_phone}</span>
                  </div>

                  {/* If assigned incident exists */}
                  {amb.assigned_incident && (
                    <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-200 text-orange-950 text-xs space-y-1 mt-2">
                      <div className="font-bold flex items-center justify-between">
                        <span>Assigned: {amb.assigned_incident.id}</span>
                        <span className="text-[10px] uppercase font-bold text-red-600">{amb.assigned_incident.severity}</span>
                      </div>
                      <div className="text-[11px] truncate">
                        {amb.assigned_incident.incident_type} at {amb.assigned_incident.location_name}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance Toggle */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={updatingId === amb.id || isBusy}
                  onClick={() => handleToggle(amb.id, amb.status)}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                    isMaintenance
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : isBusy
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>
                    {isMaintenance ? 'Mark Available (End Service)' : isBusy ? 'Dispatched (Cannot Service)' : 'Mark Maintenance / Cleaning'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
