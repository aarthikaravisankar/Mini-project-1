import React from 'react';
import { 
  Truck, 
  CheckCircle2, 
  Flame, 
  Radio, 
  MapPin, 
  Bell, 
  TrendingUp, 
  AlertCircle, 
  PhoneCall, 
  ArrowRight, 
  Sparkles 
} from 'lucide-react';
import { DashboardStats, Ambulance, Incident, NotificationItem } from '../types';

interface DashboardProps {
  stats: DashboardStats | null;
  ambulances: Ambulance[];
  incidents: Incident[];
  notifications: NotificationItem[];
  onNavigateTab: (tab: string) => void;
  onSelectIncident: (inc: Incident) => void;
  recommendedIncident?: Incident | null;
}

export const ControlRoomDashboard: React.FC<DashboardProps> = ({
  stats,
  ambulances,
  incidents,
  notifications,
  onNavigateTab,
  onSelectIncident,
  recommendedIncident
}) => {
  // Check if any driver recently accepted dispatch
  const driverAcceptedNotification = notifications.find(
    (n) => n.type === 'driver_accepted'
  );

  const pendingIncidents = incidents.filter(
    (i) => i.status === 'Registered' || i.status === 'Pending Dispatch'
  );

  return (
    <div className="space-y-6">

      {/* 2. Top Emergency Recommendation Alert */}
      {recommendedIncident && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-red-500">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 animate-pulse">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-white text-red-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Dispatch Required
                </span>
                <span className="text-xs font-mono bg-black/20 px-2 py-0.5 rounded-md">
                  {recommendedIncident.id}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black mt-1">
                {recommendedIncident.incident_type} • {recommendedIncident.location_name}
              </h3>
              <p className="text-xs text-red-100 flex items-center gap-2 mt-0.5">
                <span>Caller: {recommendedIncident.caller_phone} ({recommendedIncident.caller_name})</span>
                <span>•</span>
                <span>Ambulances Needed: {recommendedIncident.ambulances_required}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onSelectIncident(recommendedIncident);
              onNavigateTab('ambulance_dispatch');
            }}
            className="w-full md:w-auto px-5 py-2.5 bg-white text-red-700 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all flex-shrink-0"
          >
            <span>Dispatch Nearest Ambulance</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. KPI Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Fleet */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Fleet</span>
            <Truck className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.total_ambulances ?? ambulances.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Perundurai & Erode Hubs</div>
        </div>

        {/* Available Ambulances */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-emerald-700">Available</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats?.available_ambulances ?? 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Ready for assignment</div>
        </div>

        {/* Dispatched Ambulances */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-orange-700">Dispatched</span>
            <Radio className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-600">
            {stats?.dispatched_ambulances ?? 0}
          </div>
          <div className="text-[11px] text-orange-600 font-medium mt-1">En route or on scene</div>
        </div>

        {/* Active Incidents */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-red-700">Active Incidents</span>
            <Flame className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600">
            {stats?.active_incidents ?? incidents.filter(i => i.status !== 'Completed').length}
          </div>
          <div className="text-[11px] text-red-600 font-medium mt-1">Registered emergencies</div>
        </div>

        {/* Completed Trips */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-teal-700">Trips Completed</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700">
            {stats?.completed_trips ?? 0}
          </div>
          <div className="text-[11px] text-teal-600 font-medium mt-1">Successful patient transports</div>
        </div>
      </div>

      {/* 4. Two-Column Layout: Pending Calls on Left, Live Fleet & Notifications on Right (NO MAP in Control Room as instructed!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Registered Emergency Calls needing dispatch */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Registered Calls Awaiting Dispatch ({pendingIncidents.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Incoming emergency registrations requiring immediate ambulance assignment
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('register_call')}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                + Register Call
              </button>
            </div>

            {pendingIncidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                All emergency calls have been dispatched. No calls waiting.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingIncidents.slice(0, 4).map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-red-300 transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900">{inc.id}</span>
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.2 rounded-full uppercase">
                          {inc.incident_type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 font-medium flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{inc.location_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Caller: <strong>{inc.caller_phone}</strong> ({inc.caller_name})
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectIncident(inc);
                        onNavigateTab('ambulance_dispatch');
                      }}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 flex-shrink-0 shadow-sm"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Dispatch Unit</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <button
              onClick={() => onNavigateTab('ambulance_dispatch')}
              className="text-xs text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
            >
              <span>Go to Ambulance Dispatch Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Fleet Status & Control Room Notifications */}
        <div className="lg:col-span-5 space-y-6">
          {/* Fleet Status List */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-700" />
                Fleet Status (Perundurai & Erode)
              </h3>
              <button
                onClick={() => onNavigateTab('ambulance_fleet')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                View Fleet
              </button>
            </div>

            <div className="divide-y divide-slate-100 space-y-2">
              {ambulances.map((amb) => (
                <div key={amb.id} className="pt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      amb.status === 'Available' ? 'bg-emerald-500' :
                      amb.status === 'Maintenance' ? 'bg-slate-400' : 'bg-orange-500'
                    }`}></span>
                    <div>
                      <div className="font-bold text-slate-900">
                        {amb.id} ({amb.vehicle_no})
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Driver: {amb.driver_name} ({amb.driver_phone})
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    amb.status === 'Available' ? 'bg-emerald-100 text-emerald-800' :
                    amb.status === 'Maintenance' ? 'bg-slate-100 text-slate-700' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {amb.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Event Log & Notifications */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-600" />
                Live Control Room Event Log
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {notifications.length} records
              </span>
            </div>

            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {notifications.slice(0, 6).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    notif.type === 'driver_accepted'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold ring-1 ring-emerald-400'
                      : notif.type === 'urgent'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : notif.type === 'success'
                      ? 'bg-teal-50 border-teal-200 text-teal-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    notif.type === 'driver_accepted' ? 'text-emerald-600' :
                    notif.type === 'urgent' ? 'text-red-600' :
                    notif.type === 'success' ? 'text-teal-600' : 'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <div className="font-bold flex items-center justify-between">
                      <span>{notif.title}</span>
                      <span className="text-[10px] opacity-70 font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-0.5 opacity-90 text-[11px] leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
