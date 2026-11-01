import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { RoleLogin } from './components/RoleLogin';
import { ControlRoomDashboard } from './components/ControlRoomDashboard';
import { CallRegistrationForm } from './components/CallRegistrationForm';
import { AmbulanceDispatchView } from './components/AmbulanceDispatchView';
import { ActiveIncidentsView } from './components/ActiveIncidentsView';
import { AmbulanceFleetView } from './components/AmbulanceFleetView';
import { DriverDashboard } from './components/DriverDashboard';
import { HospitalManagementView } from './components/HospitalManagementView';
import { TripHistoryView } from './components/TripHistoryView';
import { 
  DashboardStats, 
  Ambulance, 
  Incident, 
  Hospital, 
  NotificationItem 
} from './types';
import { 
  fetchStats, 
  fetchAmbulances, 
  fetchIncidents, 
  fetchHospitals, 
  fetchNotifications, 
  fetchPriorityQueue,
  resetSystem,
  cleanSession 
} from './api';
import { CheckCircle2, X, Clock, AlertCircle } from 'lucide-react';

export interface TimedAlert {
  id: string;
  type: 'driver_accepted' | 'trip_completed';
  title: string;
  message: string;
  expiresAt: number; // ms timestamp
  secondsLeft: number;
}

export function App() {
  // Authentication & Role State
  const [currentRole, setCurrentRole] = useState<'control_room' | 'driver' | 'hospital' | null>(null);
  const [userMeta, setUserMeta] = useState<{ ambulanceId?: string; hospitalId?: string }>({});
  
  // Navigation tab for control room
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Application Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [topPriorityIncident, setTopPriorityIncident] = useState<Incident | null>(null);
  const [queuedIncidents, setQueuedIncidents] = useState<Incident[]>([]);
  const [selectedIncidentForDispatch, setSelectedIncidentForDispatch] = useState<Incident | null>(null);

  // 2-Minute (120s) Timed Alerts for Control Room
  const [timedAlerts, setTimedAlerts] = useState<TimedAlert[]>([]);
  const [processedNotifIds, setProcessedNotifIds] = useState<Set<string>>(new Set());

  // Load all system data
  const refreshAllData = useCallback(async () => {
    try {
      const [statsData, ambData, incData, hospData, notifData, pqData] = await Promise.all([
        fetchStats().catch(() => null),
        fetchAmbulances().catch(() => []),
        fetchIncidents().catch(() => []),
        fetchHospitals().catch(() => []),
        fetchNotifications().catch(() => []),
        fetchPriorityQueue().catch(() => ({ total_queued: 0, recommended_for_dispatch: null, priority_queue: [] }))
      ]);

      if (statsData) setStats(statsData);
      setAmbulances(ambData);
      setIncidents(incData);
      setHospitals(hospData);
      setNotifications(notifData);
      setTopPriorityIncident(pqData.recommended_for_dispatch);
      setQueuedIncidents(pqData.priority_queue || []);

      // Check for driver acceptance and trip completed notifications to trigger 2-minute timed alerts
      for (const n of notifData) {
        if (n.type === 'driver_accepted' || n.type === 'trip_completed') {
          if (!processedNotifIds.has(n.id)) {
            setProcessedNotifIds(prev => new Set(prev).add(n.id));
            setTimedAlerts(prev => {
              // Avoid duplicates
              if (prev.some(a => a.id === n.id)) return prev;
              return [
                ...prev,
                {
                  id: n.id,
                  type: n.type as 'driver_accepted' | 'trip_completed',
                  title: n.title,
                  message: n.message,
                  expiresAt: Date.now() + 120 * 1000, // 2 minutes = 120 seconds
                  secondsLeft: 120
                }
              ];
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  }, [processedNotifIds]);

  // Periodic polling every 3 seconds
  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 3000);
    return () => clearInterval(interval);
  }, [refreshAllData]);

  // 1-second interval to decrement active timed alerts (auto-dismiss after 2 minutes)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setTimedAlerts(prev =>
        prev
          .map(a => ({
            ...a,
            secondsLeft: Math.max(0, Math.ceil((a.expiresAt - now) / 1000))
          }))
          .filter(a => a.secondsLeft > 0)
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = (
    role: 'control_room' | 'driver' | 'hospital', 
    meta?: { ambulanceId?: string; hospitalId?: string }
  ) => {
    setCurrentRole(role);
    if (meta) setUserMeta(meta);
    if (role === 'control_room') setActiveTab('dashboard');
  };

  const handleLogout = () => {
    // Strictly logs out to role login screen so password must be entered for any new portal!
    setCurrentRole(null);
    setUserMeta({});
  };

  const handleCleanSession = async () => {
    if (window.confirm('Start Fresh Session? This will clear all test registrations and reset all ambulances to Available. (No old test calls will remain!)')) {
      try {
        await cleanSession();
        setTimedAlerts([]);
        await refreshAllData();
        alert('Fresh session initiated! All test records cleared. Ready for your new registrations.');
      } catch (err: any) {
        alert('Failed to clear session: ' + err.message);
      }
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset system data to initial clean sample state?')) {
      await resetSystem();
      setTimedAlerts([]);
      await refreshAllData();
    }
  };

  const dismissTimedAlert = (id: string) => {
    setTimedAlerts(prev => prev.filter(a => a.id !== id));
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // If not logged in, render the clean role portal selector
  if (!currentRole) {
    return (
      <RoleLogin
        ambulances={ambulances}
        hospitals={hospitals}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onLogout={handleLogout}
        queuedCount={queuedIncidents.length}
        userMeta={userMeta}
        onCleanSession={handleCleanSession}
      />

      {/* Floating 2-Minute Timed Alerts in Control Room */}
      {currentRole === 'control_room' && timedAlerts.length > 0 && (
        <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
          {timedAlerts.map(alert => (
            <div
              key={alert.id}
              className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border-2 flex items-start gap-3 animate-fadeIn ${
                alert.type === 'driver_accepted'
                  ? 'bg-emerald-600 text-white border-emerald-300 shadow-emerald-900/30'
                  : 'bg-blue-600 text-white border-blue-300 shadow-blue-900/30'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 border border-white/30">
                    {alert.type === 'driver_accepted' ? 'Driver Accepted' : 'Trip Completed'}
                  </span>

                  {/* 2-Minute Live Countdown Badge */}
                  <div className="flex items-center gap-1 text-[11px] font-mono bg-black/25 px-2 py-0.5 rounded-md font-bold text-yellow-300 border border-yellow-300/30">
                    <Clock className="w-3 h-3 text-yellow-300" />
                    <span>Disappears in: {formatCountdown(alert.secondsLeft)}</span>
                  </div>
                </div>

                <h4 className="font-extrabold text-sm text-white mt-1.5">
                  {alert.title}
                </h4>
                <p className="text-xs text-white/90 mt-0.5 leading-relaxed font-medium">
                  {alert.message}
                </p>

                {/* Progress bar showing remaining fraction of 120 seconds */}
                <div className="w-full bg-black/20 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="h-full bg-yellow-300 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(alert.secondsLeft / 120) * 100}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => dismissTimedAlert(alert.id)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                title="Dismiss Alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Role Content Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* 1. CONTROL ROOM OPERATOR PORTAL */}
        {currentRole === 'control_room' && (
          <div className="space-y-6">
            {/* Embedded 2-Minute Notification Banner across Control Room Header */}
            {timedAlerts.length > 0 && (
              <div className="space-y-3">
                {timedAlerts.map(alert => (
                  <div
                    key={'banner-' + alert.id}
                    className={`rounded-2xl p-4.5 border-2 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white ${
                      alert.type === 'driver_accepted'
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border-emerald-400'
                        : 'bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 animate-bounce">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-slate-900">
                            {alert.type === 'driver_accepted' ? 'Live Acceptance Alert' : 'Trip Completed Alert'}
                          </span>
                          <span className="text-xs font-mono font-bold text-yellow-200 bg-black/25 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3 h-3 text-yellow-300" />
                            Auto-dismiss in: {formatCountdown(alert.secondsLeft)}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold mt-1">
                          {alert.title}
                        </h3>
                        <p className="text-xs text-white/90 font-medium">
                          {alert.message}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => dismissTimedAlert(alert.id)}
                      className="w-full sm:w-auto px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl border border-white/30 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Dismiss Alert</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'dashboard' && (
              <ControlRoomDashboard
                stats={stats}
                ambulances={ambulances}
                incidents={incidents}
                notifications={notifications}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onSelectIncident={(inc) => {
                  setSelectedIncidentForDispatch(inc);
                  setActiveTab('ambulance_dispatch');
                }}
                recommendedIncident={topPriorityIncident}
              />
            )}

            {activeTab === 'register_call' && (
              <CallRegistrationForm
                onIncidentCreated={(newInc) => {
                  refreshAllData();
                  setSelectedIncidentForDispatch(newInc);
                }}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'ambulance_dispatch' && (
              <AmbulanceDispatchView
                onDispatchConfirmed={() => {
                  refreshAllData();
                  setActiveTab('dashboard');
                }}
                onNavigateTab={(tab) => setActiveTab(tab)}
                targetIncidentId={selectedIncidentForDispatch?.id}
              />
            )}

            {activeTab === 'active_incidents' && (
              <ActiveIncidentsView
                incidents={incidents}
                onSelectForDispatch={(inc) => {
                  setSelectedIncidentForDispatch(inc);
                }}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'ambulance_fleet' && (
              <AmbulanceFleetView
                ambulances={ambulances}
                onFleetUpdated={refreshAllData}
              />
            )}

            {activeTab === 'trip_history' && (
              <TripHistoryView ambulances={ambulances} />
            )}
          </div>
        )}

        {/* 2. AMBULANCE DRIVER PORTAL */}
        {currentRole === 'driver' && (
          <DriverDashboard
            ambulanceId={userMeta.ambulanceId || 'AMB-108-01'}
            onStatusUpdated={refreshAllData}
          />
        )}

        {/* 3. HOSPITAL PORTAL (Only accessed after password login into Hospital Portal!) */}
        {currentRole === 'hospital' && (
          <HospitalManagementView
            hospitals={hospitals}
            ambulances={ambulances}
            onHospitalsUpdated={refreshAllData}
            hospitalUserMetaId={userMeta.hospitalId || 'HOSP-01'}
          />
        )}
      </main>

      {/* Clean Bottom Footer with Reset Demo Utility */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-xs text-slate-500 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">
              108 Emergency Ambulance Dispatch System
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">
              Perundurai & Erode District Hub • Tamil Nadu EMS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCleanSession}
              className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold hover:bg-amber-100 transition-colors"
              title="Clear old test calls for tomorrow"
            >
              Start Fresh Session
            </button>
            <button
              onClick={handleLogout}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors"
            >
              Switch Role / Logout
            </button>
            <button
              onClick={handleResetDemo}
              className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold hover:bg-rose-100"
              title="Reset sample data"
            >
              Reset Sample Data
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
