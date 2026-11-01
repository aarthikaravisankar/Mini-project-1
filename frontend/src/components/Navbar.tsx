import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Clock, 
  LogOut, 
  Flame, 
  Truck, 
  Layers, 
  History, 
  PhoneCall, 
  Radio,
  Sparkles 
} from 'lucide-react';
import { soundManager } from '../utils/sound';

interface NavbarProps {
  currentRole: 'control_room' | 'driver' | 'hospital';
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  queuedCount: number;
  userMeta?: { ambulanceId?: string; hospitalId?: string };
  onCleanSession?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  onLogout,
  queuedCount,
  userMeta,
  onCleanSession
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [isSirenOn, setIsSirenOn] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSiren = () => {
    soundManager.toggleSiren((playing) => setIsSirenOn(playing));
  };

  return (
    <header className="bg-navy-900 border-b border-navy-700 text-white sticky top-0 z-50 shadow-lg">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-black text-xl text-white shadow-md shadow-red-600/40 border border-white/20">
              108
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-base sm:text-lg">
                  EMERGENCY DISPATCH SYSTEM
                </span>
                <span className="text-[10px] bg-red-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  TN-108
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Perundurai & Erode Control Command Hub
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Clock */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 bg-navy-800 px-3 py-1.5 rounded-lg border border-navy-700 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{timeStr}</span>
            </div>

            {/* Siren Simulation Toggle */}
            <button
              onClick={handleToggleSiren}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                isSirenOn
                  ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-600/50 animate-pulse'
                  : 'bg-navy-800 text-slate-300 border-navy-700 hover:bg-navy-700'
              }`}
              title="Simulate 108 Emergency Siren Audio"
            >
              {isSirenOn ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Siren ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">108 Siren</span>
                </>
              )}
            </button>

            {/* Role Badge */}
            <div className="flex items-center gap-1.5 bg-navy-800 border border-navy-700 px-3 py-1 rounded-lg text-xs">
              <span className={`w-2 h-2 rounded-full ${
                currentRole === 'control_room' ? 'bg-red-500' :
                currentRole === 'driver' ? 'bg-emerald-400' : 'bg-sky-400'
              }`}></span>
              <span className="font-semibold text-slate-200">
                {currentRole === 'control_room' && 'Control Room Operator'}
                {currentRole === 'driver' && `Driver (${userMeta?.ambulanceId || 'AMB-108-01'})`}
                {currentRole === 'hospital' && 'Hospital Desk'}
              </span>
            </div>

            {/* Fresh Session / Reset Test Calls */}
            {currentRole === 'control_room' && onCleanSession && (
              <button
                onClick={onCleanSession}
                className="flex items-center gap-1.5 text-xs bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 px-3 py-1.5 rounded-lg border border-amber-500/40 transition-colors font-bold"
                title="Clear test calls and start fresh session for tomorrow"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fresh Session</span>
              </button>
            )}

            {/* Switch Role / Logout */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white px-3 py-1.5 rounded-lg border border-red-500/40 transition-colors font-bold"
              title="Log out and switch to another portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Role</span>
            </button>
          </div>
        </div>

        {/* Control Room Tab Navigation (Strictly Control Room Only, No Hospital Bed Tab!) */}
        {currentRole === 'control_room' && (
          <div className="flex items-center space-x-1 sm:space-x-2 py-2 border-t border-navy-800 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-navy-800 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onTabChange('register_call')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'register_call'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-navy-800 hover:text-white'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Register Emergency Call</span>
            </button>

            {/* Renamed from Priority Queue to Ambulance Dispatch */}
            <button
              onClick={() => onTabChange('ambulance_dispatch')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors relative ${
                activeTab === 'ambulance_dispatch'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-navy-800 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Ambulance Dispatch</span>
              {queuedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full font-bold text-[10px]">
                  {queuedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('active_incidents')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'active_incidents'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-navy-800 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Active Incidents</span>
            </button>

            <button
              onClick={() => onTabChange('ambulance_fleet')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'ambulance_fleet'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-navy-800 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Ambulance Fleet</span>
            </button>

            <button
              onClick={() => onTabChange('trip_history')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'trip_history'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-navy-800 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Trip History</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
