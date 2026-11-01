import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Ambulance, Incident, Hospital } from '../types';

// Fix Leaflet's default icon URLs
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG-based DivIcons
const createAmbulanceIcon = (status: string) => {
  let bgColor = '#16a34a'; // Green for Available
  if (status === 'Dispatched' || status === 'En Route to Scene') bgColor = '#ea580c'; // Orange
  else if (['At Scene', 'Patient Picked Up', 'En Route to Hospital'].includes(status)) bgColor = '#dc2626'; // Red
  else if (status === 'Maintenance' || status === 'Unavailable') bgColor = '#64748b'; // Slate

  const html = `
    <div style="
      background-color: ${bgColor};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      cursor: pointer;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <path d="M9 17h6"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-amb-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const createIncidentIcon = (severity: string) => {
  const isHigh = severity === 'High';
  const color = isHigh ? '#dc2626' : (severity === 'Medium' ? '#ea580c' : '#eab308');

  const html = `
    <div style="position: relative; width: 36px; height: 36px;">
      <div class="pulse-emergency" style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(220, 38, 38, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="
        background-color: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.45);
        position: relative;
        z-index: 2;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-inc-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const createHospitalIcon = () => {
  const html = `
    <div style="
      background-color: #0284c7;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 6v12"/>
        <path d="M6 12h12"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-hosp-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });
};

function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function AutoFitBounds({ bounds }: { bounds: [number, number][] | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      try {
        const leafletBounds = L.latLngBounds(bounds);
        map.fitBounds(leafletBounds, { padding: [40, 40], maxZoom: 15 });
      } catch (e) {
        console.error('Fit bounds error:', e);
      }
    }
  }, [bounds, map]);
  return null;
}

// Generate road-following curve points between two coordinates
const generateRoadRoute = (start: [number, number], end: [number, number]): [number, number][] => {
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;
  const points: [number, number][] = [start];
  const steps = 6;
  for (let i = 1; i < steps; i++) {
    const fraction = i / steps;
    const interpLat = lat1 + (lat2 - lat1) * fraction;
    const interpLon = lon1 + (lon2 - lon1) * fraction;
    // Add highway curvature
    const curveOffset = Math.sin(fraction * Math.PI) * 0.0032;
    points.push([interpLat + curveOffset, interpLon - curveOffset * 0.45]);
  }
  points.push(end);
  return points;
};

interface MapProps {
  ambulances: Ambulance[];
  incidents: Incident[];
  hospitals: Hospital[];
  selectedIncident?: Incident | null;
  selectedAmbulance?: Ambulance | null;
  onSelectIncident?: (incident: Incident) => void;
  onSelectAmbulance?: (ambulance: Ambulance) => void;
  height?: string;
  zoom?: number;
  driverMode?: boolean;
  driverRouteDestination?: {
    latitude: number;
    longitude: number;
    name: string;
    type: 'incident' | 'hospital';
  } | null;
}

export const MapComponent: React.FC<MapProps> = ({
  ambulances,
  incidents,
  hospitals,
  selectedIncident,
  selectedAmbulance,
  onSelectIncident,
  onSelectAmbulance,
  height = '520px',
  zoom = 12,
  driverMode = false,
  driverRouteDestination
}) => {
  // Center of Perundurai & Erode region
  const defaultCenter: [number, number] = [11.2850, 77.6250];

  // If driver mode, use driver ambulance position
  const driverAmb = ambulances[0];

  let mapCenter: [number, number] = defaultCenter;
  let driverRoadCoords: [number, number][] | null = null;
  let fitBoundsTargets: [number, number][] | null = null;

  if (driverMode && driverAmb && driverRouteDestination) {
    const startPoint: [number, number] = [driverAmb.latitude, driverAmb.longitude];
    const endPoint: [number, number] = [driverRouteDestination.latitude, driverRouteDestination.longitude];
    driverRoadCoords = generateRoadRoute(startPoint, endPoint);
    fitBoundsTargets = [startPoint, endPoint];
    mapCenter = [(startPoint[0] + endPoint[0]) / 2, (startPoint[1] + endPoint[1]) / 2];
  } else if (selectedIncident) {
    mapCenter = [selectedIncident.latitude, selectedIncident.longitude];
  }

  // Control room general route
  let generalRouteCoords: [number, number][] | null = null;
  if (!driverMode && selectedIncident && selectedIncident.assigned_ambulance_id) {
    const assignedAmb = ambulances.find(a => a.id === selectedIncident.assigned_ambulance_id);
    if (assignedAmb) {
      generalRouteCoords = [
        [assignedAmb.latitude, assignedAmb.longitude],
        [selectedIncident.latitude, selectedIncident.longitude]
      ];
    }
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-lg border border-slate-200">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height, width: '100%' }}
      >
        <ChangeMapView center={mapCenter} zoom={zoom} />
        {fitBoundsTargets && <AutoFitBounds bounds={fitBoundsTargets} />}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* DRIVER MODE: EXCLUSIVE ROAD / ROUTE ONLY */}
        {driverMode && driverRoadCoords && (
          <>
            {/* Outer Road Casing */}
            <Polyline
              positions={driverRoadCoords}
              color="#0f172a"
              weight={9}
              opacity={0.65}
              lineCap="round"
              lineJoin="round"
            />
            {/* Inner Road Navigation Route */}
            <Polyline
              positions={driverRoadCoords}
              color="#2563eb"
              weight={5}
              opacity={0.95}
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}

        {/* GENERAL CONTROL ROOM ROUTE */}
        {!driverMode && generalRouteCoords && (
          <Polyline
            positions={generalRouteCoords}
            color="#dc2626"
            weight={4}
            dashArray="8, 8"
            opacity={0.8}
          />
        )}

        {/* DRIVER MODE: STRICTLY THIS AMBULANCE ONLY */}
        {driverMode && driverAmb && (
          <Marker
            position={[driverAmb.latitude, driverAmb.longitude]}
            icon={createAmbulanceIcon(driverAmb.status)}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="font-extrabold text-slate-900 border-b pb-1 mb-1 flex items-center justify-between">
                  <span>{driverAmb.vehicle_no}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    {driverAmb.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <p><strong>Your Ambulance Unit:</strong> {driverAmb.id}</p>
                  <p><strong>Driver:</strong> {driverAmb.driver_name}</p>
                  <p><strong>Base:</strong> {driverAmb.base_station}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* DRIVER MODE: STRICTLY THE SINGLE ACTIVE DESTINATION ONLY */}
        {driverMode && driverRouteDestination && (
          driverRouteDestination.type === 'incident' ? (
            <Marker
              position={[driverRouteDestination.latitude, driverRouteDestination.longitude]}
              icon={createIncidentIcon('High')}
            >
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <div className="font-extrabold text-red-700">🚨 Patient Location Destination</div>
                  <div className="font-bold text-slate-900">{driverRouteDestination.name}</div>
                  <div className="text-[11px] text-slate-600">Follow the highlighted blue road to reach scene.</div>
                </div>
              </Popup>
            </Marker>
          ) : (
            <Marker
              position={[driverRouteDestination.latitude, driverRouteDestination.longitude]}
              icon={createHospitalIcon()}
            >
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <div className="font-extrabold text-sky-700">🏥 Destination Hospital Transfer</div>
                  <div className="font-bold text-slate-900">{driverRouteDestination.name}</div>
                  <div className="text-[11px] text-slate-600">Follow the highlighted blue road for emergency admission.</div>
                </div>
              </Popup>
            </Marker>
          )
        )}

        {/* CONTROL ROOM MODE: ALL FLEET AMBULANCES */}
        {!driverMode && ambulances.map(amb => (
          <Marker
            key={amb.id}
            position={[amb.latitude, amb.longitude]}
            icon={createAmbulanceIcon(amb.status)}
            eventHandlers={{
              click: () => onSelectAmbulance && onSelectAmbulance(amb)
            }}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between font-bold text-slate-800 border-b pb-1 mb-1">
                  <span>{amb.vehicle_no}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    amb.status === 'Available' ? 'bg-green-100 text-green-700' :
                    amb.status.includes('En Route') || amb.status === 'Dispatched' ? 'bg-orange-100 text-orange-700' :
                    amb.status === 'Maintenance' ? 'bg-slate-100 text-slate-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {amb.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p><span className="font-medium">Unit ID:</span> {amb.id}</p>
                  <p><span className="font-medium">Driver:</span> {amb.driver_name} ({amb.driver_phone})</p>
                  <p><span className="font-medium">Type:</span> {amb.type}</p>
                  <p><span className="font-medium">Base:</span> {amb.base_station}</p>
                  {amb.assigned_incident_id && (
                    <p className="text-red-600 font-semibold mt-1">
                      Assigned: {amb.assigned_incident_id}
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* CONTROL ROOM MODE: ALL ACTIVE INCIDENTS */}
        {!driverMode && incidents
          .filter(inc => inc.status !== 'Completed' && inc.status !== 'Cancelled')
          .map(inc => (
            <Marker
              key={inc.id}
              position={[inc.latitude, inc.longitude]}
              icon={createIncidentIcon(inc.severity)}
              eventHandlers={{
                click: () => onSelectIncident && onSelectIncident(inc)
              }}
            >
              <Popup>
                <div className="p-1 min-w-[210px]">
                  <div className="flex items-center justify-between font-bold text-slate-800 border-b pb-1 mb-1">
                    <span className="text-red-600">{inc.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      inc.severity === 'High' ? 'bg-red-600 text-white' :
                      inc.severity === 'Medium' ? 'bg-orange-500 text-white' :
                      'bg-yellow-400 text-slate-900'
                    }`}>
                      {inc.severity} Priority
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <p className="font-bold text-slate-900">{inc.incident_type}</p>
                    <p className="text-slate-600">📍 {inc.location_name}</p>
                    <p>📞 Caller: {inc.caller_phone} ({inc.caller_name})</p>
                    <p className="text-blue-700 font-medium">Status: {inc.status}</p>
                    {inc.assigned_ambulance_id && (
                      <p className="text-green-700 font-medium">
                        🚑 Ambulance: {inc.assigned_ambulance_id}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* CONTROL ROOM MODE: ALL HOSPITALS */}
        {!driverMode && hospitals.map(hosp => (
          <Marker
            key={hosp.id}
            position={[hosp.latitude, hosp.longitude]}
            icon={createHospitalIcon()}
          >
            <Popup>
              <div className="p-1 min-w-[220px]">
                <div className="font-bold text-sky-800 border-b pb-1 mb-1">
                  🏥 {hosp.name}
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>📍 {hosp.location_name}</p>
                  <p>📞 {hosp.contact_phone}</p>
                  <div className="grid grid-cols-3 gap-1 bg-sky-50 p-1.5 rounded mt-1 border border-sky-200 text-center font-bold">
                    <div>
                      <div className="text-sky-900 text-[10px]">ER Beds</div>
                      <div className="text-sky-700 text-sm">{hosp.emergency_beds}</div>
                    </div>
                    <div>
                      <div className="text-red-900 text-[10px]">ICU</div>
                      <div className="text-red-700 text-sm">{hosp.icu_beds}</div>
                    </div>
                    <div>
                      <div className="text-teal-900 text-[10px]">O2 Beds</div>
                      <div className="text-teal-700 text-sm">{hosp.oxygen_beds}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm p-2.5 rounded-lg shadow-md border border-slate-200 z-[1000] text-xs space-y-1.5">
        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
          {driverMode ? 'Exclusive Driver Route Navigation' : 'Region: Perundurai & Erode'}
        </div>
        <div className="flex items-center gap-3">
          {driverMode ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                <span>Your Ambulance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-1.5 bg-blue-600 inline-block rounded"></span>
                <span>Active Road Path</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
                <span>Destination</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                <span>Available Amb</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                <span>Dispatched</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
                <span>Active Incident</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-sky-600 inline-block"></span>
                <span>Hospital</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
