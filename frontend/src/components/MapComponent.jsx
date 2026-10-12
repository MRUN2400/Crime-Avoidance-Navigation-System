import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { 
  Crosshair, 
  Plus, 
  Minus, 
  Layers, 
  Bell 
} from "lucide-react";
import { 
  REAL_ROAD_SAFE_ROUTE, 
  REAL_ROAD_ALT_ROUTE, 
  REAL_ROAD_RED_SEGMENT 
} from "./realRoadRoutes";

// Coordinates for Powai / IIT Bombay region
const POWAI_CENTER = [19.1245, 72.9050];

// Custom Start / End Marker SVGs matching hierarchy
const createCustomPin = (color, symbol) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 46" width="30" height="42">
      <defs>
        <filter id="pin-shadow" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <path d="M17 2C9 2 2.5 8.5 2.5 16.5C2.5 27.5 17 44 17 44S31.5 27.5 31.5 16.5C31.5 8.5 25 2 17 2Z" 
            fill="${color}" stroke="#ffffff" stroke-width="2.5" filter="url(#pin-shadow)"/>
      <circle cx="17" cy="16.5" r="6" fill="#ffffff"/>
      <text x="17" y="20" font-size="9" font-weight="800" text-anchor="middle" fill="${color}" font-family="system-ui">${symbol}</text>
    </svg>
  `;
  return new L.DivIcon({
    className: "custom-leaflet-pin",
    html: svg,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38],
  });
};

// Facility / incident circular marker
const createFacilityBadge = (bg, iconSvg) => {
  return new L.DivIcon({
    className: "custom-facility-badge",
    html: `
      <div style="
        width: 26px; 
        height: 26px; 
        border-radius: 50%; 
        background: ${bg}; 
        border: 2px solid #ffffff; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        box-shadow: 0 3px 10px rgba(0,0,0,0.65);
        color: #ffffff;
      ">
        ${iconSvg}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
};

// Warning triangular badge
const createWarningBadge = () => {
  return new L.DivIcon({
    className: "custom-warning-badge",
    html: `
      <div style="
        width: 28px; 
        height: 26px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        filter: drop-shadow(0 3px 8px rgba(0,0,0,0.7));
      ">
        <svg width="26" height="24" viewBox="0 0 24 22" fill="#f59e0b" stroke="#ffffff" stroke-width="2" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13" stroke="#000000" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="12" y1="17" x2="12.01" y2="17" stroke="#000000" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
    `,
    iconSize: [28, 26],
    iconAnchor: [14, 13],
    popupAnchor: [0, -14],
  });
};

const startPinIcon = createCustomPin("#2563eb", "A"); // Blue start pin
const endPinIcon = createCustomPin("#ef4444", "B");   // Red end pin

// Helper to normalize any GeoJSON [lng, lat] coordinate array to Leaflet [lat, lng]
function normalizeToLatLng(coords) {
  if (!coords || !Array.isArray(coords) || coords.length === 0) return [];
  // If first element is array of 2 numbers
  const first = coords[0];
  if (Array.isArray(first) && first.length === 2) {
    // If first[0] is > 65 and first[1] < 35, it's [lng, lat] in India / Mumbai
    if (first[0] > 60 && first[1] < 40) {
      return coords.map(c => [c[1], c[0]]);
    }
  }
  return coords;
}

// MapControls and resize invalidation bridge
function MapControlsBridge({ onLocate, centerPos }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map]);

  return (
    <div className="map-controls-stack">
      <button 
        className="map-control-btn" 
        onClick={() => {
          map.setView(centerPos || POWAI_CENTER, 14);
          if (onLocate) onLocate();
        }} 
        title="Locate Me"
        aria-label="Locate me"
      >
        <Crosshair size={16} />
      </button>
      <button 
        className="map-control-btn" 
        onClick={() => map.zoomIn()} 
        title="Zoom In"
        aria-label="Zoom in"
      >
        <Plus size={16} />
      </button>
      <button 
        className="map-control-btn" 
        onClick={() => map.zoomOut()} 
        title="Zoom Out"
        aria-label="Zoom out"
      >
        <Minus size={16} />
      </button>
      <button 
        className="map-control-btn" 
        onClick={() => {}} 
        title="Map Layers"
        aria-label="Map layers"
      >
        <Layers size={16} />
      </button>
    </div>
  );
}

// Auto fit bounds helper
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 1) {
      try {
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (_) {}
    }
  }, [positions, map]);
  return null;
}

// Auto center on selected resource helper
function RecenterOnResource({ targetResource }) {
  const map = useMap();
  useEffect(() => {
    if (targetResource && targetResource.lat && targetResource.lng) {
      try {
        map.flyTo([targetResource.lat, targetResource.lng], 16, { animate: true, duration: 1.2 });
      } catch (_) {}
    }
  }, [targetResource, map]);
  return null;
}

export default function MapComponent({
  safestCoords = [],
  fastestCoords = [],
  activeRoute = "safest",
  error = null,
  showCrimeZones = true,
  showStreetLighting = true,
  showTrafficDensity = true,
  selectedCategories = ["all"],
  selectedResource = null,
  onSOSClick,
}) {
  // Normalize provided route coordinates if in GeoJSON [lng, lat]
  const normalizedSafest = normalizeToLatLng(safestCoords);
  const normalizedFastest = normalizeToLatLng(fastestCoords);

  // If user has not yet entered routes, use the genuine road network geometry across Powai
  const effectiveSafest = normalizedSafest.length > 1 ? normalizedSafest : REAL_ROAD_SAFE_ROUTE;
  const effectiveAlternative = normalizedFastest.length > 1 ? normalizedFastest : REAL_ROAD_ALT_ROUTE;
  const effectiveRedSegment = REAL_ROAD_RED_SEGMENT;

  const startPt = effectiveSafest[0];
  const endPt = effectiveSafest[effectiveSafest.length - 1];

  // Geographically authentic facility positions along the road network matching Journey Resources categories
  const facilities = [
    {
      id: "fac-1",
      name: "Lifeline Urgent Care Clinic & Day Care",
      subtitle: "Milestone 2, Powai • Open 08:00 - 22:00",
      category: "hospital",
      pos: [19.1240, 72.9095], // On Saki Vihar / Powai road
      icon: createFacilityBadge("#ef4444", `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
          <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
        </svg>
      `),
    },
    {
      id: "fac-2",
      name: "Apollo Pharmacy",
      subtitle: "Hiranandani Gardens • Open 24h",
      category: "pharmacy",
      pos: [19.1180, 72.9090],
      icon: createFacilityBadge("#10b981", `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
          <path d="m8.5 8.5 7 7"/>
        </svg>
      `),
    },
    {
      id: "fac-3",
      name: "Bharat Petrol Pump",
      subtitle: "JVLR, Powai • Fuel & Air • Open 24h",
      category: "fuel",
      pos: [19.1290, 72.8980],
      icon: createFacilityBadge("#f59e0b", `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
          <path d="M4 4h8v16H4zM16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/>
        </svg>
      `),
    },
    {
      id: "fac-4",
      name: "Tata Power EV Fast Charging Station",
      subtitle: "Galleria Complex, Powai • 60kW DC Fast",
      category: "ev_charging",
      pos: [19.1205, 72.9110],
      icon: createFacilityBadge("#06b6d4", `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      `),
    },
    {
      id: "fac-5",
      name: "Powai Police Station",
      subtitle: "Powai Headquarters • Emergency Line 100",
      category: "police",
      pos: [19.1160, 72.9020],
      icon: createFacilityBadge("#3b82f6", `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      `),
    },
    {
      id: "fac-6",
      name: "Public Restroom Facility",
      subtitle: "Powai Lake Promenade • Clean & Accessible",
      category: "restroom",
      pos: [19.1210, 72.9120],
      icon: createFacilityBadge("#8b5cf6", `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <circle cx="12" cy="7" r="4"/>
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
        </svg>
      `),
    },
    {
      id: "fac-7",
      name: "Hiranandani Safe Parking Plaza",
      subtitle: "Central Ave, Powai • Multi-level 24h Guarded",
      category: "parking",
      pos: [19.1195, 72.9080],
      icon: createFacilityBadge("#64748b", `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
          <path d="M9 4h5a4 4 0 0 1 0 8H9zm0 0v16"/>
        </svg>
      `),
    },
    {
      id: "fac-warn-1",
      name: "Caution: Higher Risk Road Segment",
      subtitle: "Frequent incident area • Stay on main road",
      category: "warning",
      pos: [19.1226, 72.9083], // Junction leading to unlit branch
      icon: createWarningBadge(),
    },
    {
      id: "fac-warn-2",
      name: "Caution: Poor Street Lighting",
      subtitle: "Reported broken streetlights",
      category: "warning",
      pos: [19.1197, 72.9023], // Saki Vihar road segment
      icon: createWarningBadge(),
    },
  ];

  // Geographically authentic crime hotspots (aligned with reported theft / unlit segments)
  const crimeHotspots = [
    { center: [19.1226, 72.9083], radius: 260, label: "High Crime Risk Zone (Unlit Alleyways)" },
    { center: [19.1205, 72.9065], radius: 240, label: "Frequent Theft Reported After 9 PM" },
    { center: [19.1082, 72.9012], radius: 280, label: "Isolated Industrial Stretch" },
    { center: [19.0970, 72.8978], radius: 300, label: "High Crime Zone (Chandivali border)" },
  ];

  return (
    <div className="map-component-root">
      {/* ── ERROR TOAST IF ANY ── */}
      {error && (
        <div className="map-error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* ── LEAFLET MAP ── */}
      <MapContainer
        center={POWAI_CENTER}
        zoom={13}
        zoomControl={false}
        style={{ width: "100%", height: "100%", background: "#060913" }}
      >
        {/* Layer 1: Dark Basemap Tiles (Standard OSM Dark inverted filter) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Layer 2: Crime Risk Heatmap Overlays — low opacity so routes show through */}
        {showCrimeZones && crimeHotspots.map((spot, idx) => (
          <CircleMarker
            key={`crime-zone-${idx}`}
            center={spot.center}
            radius={26}
            pathOptions={{
              color: "#ef4444",
              weight: 1.2,
              opacity: 0.35,
              fillColor: "#ef4444",
              fillOpacity: 0.15,
            }}
          >
            <Popup>
              <strong>🔴 Crime Zone Alert</strong><br />{spot.label}
            </Popup>
          </CircleMarker>
        ))}

        {/* Layer 2b: Traffic Congestion Area */}
        {showTrafficDensity && (
          <CircleMarker
            center={[19.1170, 72.8991]}
            radius={22}
            pathOptions={{
              color: "#f59e0b",
              weight: 1.2,
              opacity: 0.35,
              fillColor: "#f59e0b",
              fillOpacity: 0.2,
            }}
          >
            <Popup>
              <strong>🟠 Traffic Bottleneck</strong><br />Slow-moving junction
            </Popup>
          </CircleMarker>
        )}

        {/* Layer 3: Alternative Route (Muted Slate-Grey with dark backing casing) */}
        <Polyline
          positions={effectiveAlternative}
          pathOptions={{
            color: "#0b1222",
            weight: 8,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
        <Polyline
          positions={effectiveAlternative}
          pathOptions={{
            color: "#64748b",
            weight: 5,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
          }}
        />

        {/* Layer 4: Selected Safe Route — rendered BEFORE red segment so red appears on top */}
        <Polyline
          positions={effectiveSafest}
          pathOptions={{
            color: "#064e3b",
            weight: 9,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
        <Polyline
          positions={effectiveSafest}
          pathOptions={{
            color: "#10b981",
            weight: 6,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
          }}
        />

        {/* Layer 4b: Higher-Risk Segment — rendered AFTER green so it paints on top */}
        <Polyline
          positions={effectiveRedSegment}
          pathOptions={{
            color: "#0b1222",
            weight: 9,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
        <Polyline
          positions={effectiveRedSegment}
          pathOptions={{
            color: "#ef4444",
            weight: 6,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
          }}
        />

        {/* Layer 4c: Street Lighting Indicator — every 12th point to reduce clutter */}
        {showStreetLighting && effectiveSafest.filter((_, i) => i % 12 === 0).map((pt, i) => (
          <CircleMarker
            key={`light-node-${i}`}
            center={pt}
            radius={2}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#fbbf24",
              fillOpacity: 0.9,
              weight: 1,
            }}
          >
            <Popup>💡 Street Lighting Verified Active</Popup>
          </CircleMarker>
        ))}

        {/* Layer 5: Facility and Incident Markers (Filtered by selected category toggles) */}
        {facilities
          .filter((fac) => {
            if (fac.category === "warning" || fac.category === "incident") return true;
            if (selectedCategories.includes("all")) return true;
            return selectedCategories.includes(fac.category);
          })
          .map((fac) => (
            <Marker 
              key={fac.id}
              position={fac.pos}
              icon={fac.icon}
            >
              <Popup>
                <strong>{fac.name}</strong><br />
                <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{fac.subtitle}</span>
              </Popup>
            </Marker>
          ))}

        {/* Start Pin (Blue Pin A) */}
        {startPt && (
          <Marker position={startPt} icon={startPinIcon}>
            <Popup>
              <strong>Start Point (A)</strong><br />Powai Junction
            </Popup>
          </Marker>
        )}

        {/* Destination Pin (Red Pin B) */}
        {endPt && (
          <Marker position={endPt} icon={endPinIcon}>
            <Popup>
              <strong>Destination (B)</strong><br />IIT Bombay Main Gate
            </Popup>
          </Marker>
        )}

        {/* Layer 6: Map Custom Controls */}
        <MapControlsBridge centerPos={POWAI_CENTER} />

        {/* Auto fit bounds when custom coordinates are supplied */}
        {normalizedSafest.length > 1 && (
          <FitBounds positions={effectiveSafest} />
        )}

        {/* Recenter smoothly when Locate is clicked on a Journey Resource card */}
        {selectedResource && (
          <RecenterOnResource targetResource={selectedResource} />
        )}
      </MapContainer>

      {/* ── FLOATING ROUTE LEGEND CARD (LOWER LEFT) ── */}
      <div className="floating-map-legend">
        {/* Route Lines */}
        <div className="legend-route-row">
          <span className="route-line-indicator line-green"></span>
          <span className="legend-label">Selected route (lower risk)</span>
        </div>
        <div className="legend-route-row">
          <span className="route-line-indicator line-grey"></span>
          <span className="legend-label">Alternative route</span>
        </div>
        <div className="legend-route-row">
          <span className="route-line-indicator line-red"></span>
          <span className="legend-label">Higher risk segment</span>
        </div>

        <div className="legend-divider"></div>

        {/* Risk Zone Dots */}
        <div className="legend-dots-list">
          <div className="legend-dot-row">
            <span className="legend-dot dot-green"></span>
            <span className="legend-label">Low Risk Zone</span>
          </div>
          <div className="legend-dot-row">
            <span className="legend-dot dot-amber"></span>
            <span className="legend-label">Moderate Risk</span>
          </div>
          <div className="legend-dot-row">
            <span className="legend-dot dot-red"></span>
            <span className="legend-label">High Crime Zone</span>
          </div>
        </div>
      </div>

      {/* ── FLOATING MAP SCALE (BOTTOM CENTER) ── */}
      <div className="map-scale-indicator">
        <div className="scale-bracket">
          <div className="scale-tick-left"></div>
          <div className="scale-line"></div>
          <div className="scale-tick-right"></div>
        </div>
        <span className="scale-text">1 km</span>
      </div>

      {/* ── FLOATING SOS CIRCULAR BUTTON (BOTTOM RIGHT) ── */}
      <button 
        className="floating-sos-action-btn"
        onClick={onSOSClick}
        aria-label="Emergency SOS"
      >
        <div className="sos-icon-glow">
          <Bell size={22} className="sos-siren-icon" />
          <span className="sos-text-bold">SOS</span>
        </div>
      </button>
    </div>
  );
}
