import React, { useState } from 'react';
import { 
  Flame, 
  MapPin, 
  Phone, 
  Clock, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  Link as LinkIcon 
} from 'lucide-react';
import { Incident } from '../types';

interface ActiveIncidentsProps {
  incidents: Incident[];
  onSelectForDispatch: (inc: Incident) => void;
  onNavigateTab: (tab: string) => void;
}

export const ActiveIncidentsView: React.FC<ActiveIncidentsProps> = ({
  incidents,
  onSelectForDispatch,
  onNavigateTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');

  const activeList = incidents.filter(i => i.status !== 'Completed' && i.status !== 'Cancelled');

  const filtered = activeList.filter(inc => {
    const matchSearch = (
      inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.incident_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.caller_phone.includes(searchTerm)
    );
    const matchSev = severityFilter === 'All' || inc.severity === severityFilter;
    return matchSearch && matchSev;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Active Registered Incidents
            </h2>
            <p className="text-xs text-slate-500">
              Monitoring all pending dispatch and in-progress emergencies across Perundurai & Erode
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('register_call')}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
        >
          + Register New Incident
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, location, caller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Severity:
          </span>
          <div className="flex gap-1">
            {['All', 'High', 'Medium', 'Low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  severityFilter === sev
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incidents Table / Cards */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No active incidents match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((inc) => (
            <div
              key={inc.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900">{inc.id}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        inc.severity === 'High' ? 'bg-red-100 text-red-700' :
                        inc.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inc.severity} Priority
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {inc.incident_type}
                    </h3>
                  </div>

                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                    inc.status === 'Registered' ? 'bg-red-50 text-red-700 border border-red-200' :
                    inc.status === 'Dispatched' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {inc.status}
                  </span>
                </div>

                <div className="py-3 text-xs text-slate-600 space-y-1.5">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{inc.location_name}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Caller: <strong>{inc.caller_phone}</strong> ({inc.caller_name})</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>Registered: {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>

                  {/* Linked Call Logs */}
                  {inc.caller_logs && inc.caller_logs.length > 1 && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                      <div className="font-bold flex items-center gap-1 text-slate-700">
                        <LinkIcon className="w-3 h-3 text-blue-600" />
                        <span>{inc.caller_logs.length - 1} Linked Duplicate Call(s):</span>
                      </div>
                      {inc.caller_logs.slice(1).map((log, i) => (
                        <div key={i} className="truncate mt-0.5">
                          • {log.caller_phone}: {log.note}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {inc.assigned_ambulance_id ? (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Assigned: {inc.assigned_ambulance_id}</span>
                  </span>
                ) : (
                  <span className="text-xs text-red-600 font-bold">
                    Awaiting Dispatch
                  </span>
                )}

                <button
                  onClick={() => {
                    onSelectForDispatch(inc);
                    onNavigateTab('ambulance_dispatch');
                  }}
                  className="px-3 py-1.5 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                >
                  <span>Dispatch View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
