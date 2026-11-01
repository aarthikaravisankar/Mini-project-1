import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Truck, 
  Building2, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Download 
} from 'lucide-react';
import { Trip, Ambulance } from '../types';
import { fetchTrips } from '../api';

interface TripHistoryProps {
  ambulances: Ambulance[];
}

export const TripHistoryView: React.FC<TripHistoryProps> = ({ ambulances }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAmbId, setSelectedAmbId] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await fetchTrips();
      setTrips(data);
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const filtered = trips.filter((trip) => {
    const s = searchTerm.toLowerCase();
    const matchSearch = (
      trip.trip_id.toLowerCase().includes(s) ||
      trip.incident_id.toLowerCase().includes(s) ||
      trip.incident_type.toLowerCase().includes(s) ||
      trip.hospital_name.toLowerCase().includes(s) ||
      trip.patient_location.toLowerCase().includes(s) ||
      trip.driver_name.toLowerCase().includes(s)
    );
    const matchAmb = selectedAmbId === 'All' || trip.ambulance_id === selectedAmbId;
    return matchSearch && matchAmb;
  });

  const totalDuration = trips.reduce((acc, t) => acc + (t.duration_minutes || 0), 0);
  const avgDuration = trips.length > 0 ? Math.round(totalDuration / trips.length) : 0;
  const totalKm = trips.reduce((acc, t) => acc + (t.distance_km || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Completed Trip History & Analytics
            </h2>
            <p className="text-xs text-slate-500">
              Audit log of completed 108 emergency responses in Perundurai & Erode District
            </p>
          </div>
        </div>

        <button
          onClick={loadTrips}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-xl transition-colors"
        >
          Refresh Logs
        </button>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Completed Trips</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{trips.length}</div>
          <div className="text-[11px] text-teal-600 font-medium mt-0.5">100% Patient safe transport</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Average Turnaround Duration</span>
          <div className="text-2xl font-black text-teal-700 mt-1">{avgDuration} mins</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Dispatch to hospital admission</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Distance Covered</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalKm.toFixed(1)} km</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Regional fleet mileage</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search trip ID, hospital, patient location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Unit:
          </span>
          <select
            value={selectedAmbId}
            onChange={(e) => setSelectedAmbId(e.target.value)}
            className="text-xs p-1.5 rounded-xl border border-slate-200 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Ambulances</option>
            {ambulances.map((a) => (
              <option key={a.id} value={a.id}>{a.id} ({a.vehicle_no})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Loading trip records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No completed trips found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Trip & Incident ID</th>
                  <th className="py-3 px-4">Emergency Type</th>
                  <th className="py-3 px-4">Ambulance & Driver</th>
                  <th className="py-3 px-4">Pickup Location</th>
                  <th className="py-3 px-4">Hospital Destination</th>
                  <th className="py-3 px-4">Timestamps</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((trip) => (
                  <tr key={trip.trip_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div>{trip.trip_id}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{trip.incident_id}</div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{trip.incident_type}</div>
                      <div className="text-[10px] text-slate-400">{trip.outcome}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{trip.ambulance_id}</div>
                      <div className="text-[10px] text-slate-500">{trip.driver_name} ({trip.vehicle_no})</div>
                    </td>

                    <td className="py-3 px-4 max-w-[180px] truncate">
                      <div className="truncate font-medium">{trip.patient_location}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Caller: {trip.caller_phone}</div>
                    </td>

                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="font-bold text-sky-900 truncate">🏥 {trip.hospital_name}</div>
                      <div className="text-[10px] text-slate-500">{trip.distance_km} km • {trip.duration_minutes} mins</div>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      <div>Disp: {new Date(trip.dispatch_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div>Comp: {new Date(trip.completion_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
