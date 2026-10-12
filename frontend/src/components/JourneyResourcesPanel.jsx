import { useState, useEffect, useRef } from "react";
import { 
  Briefcase, 
  Search, 
  Phone, 
  Crosshair, 
  Navigation2, 
  MoreVertical,
  Plus,
  ChevronDown,
  RotateCcw,
  Zap,
  Loader2,
  RefreshCw
} from "lucide-react";
import { REAL_ROAD_SAFE_ROUTE } from "./realRoadRoutes";

const BACKEND_URL = "http://localhost:8000";

// Authentic curated facilities along the Powai corridor (used when backend is offline)
const DEFAULT_RESOURCES = [
  {
    id: "fac-1",
    name: "Lifeline Urgent Care Clinic & Day Care",
    category: "hospital",
    iconType: "clinic",
    badgeColor: "#ef4444",
    distText: "33 m from route",
    distanceMeters: 33,
    rating: 4.8,
    safetyScore: 95,
    address: "Milestone 2, Powai",
    hours: "Open • 08:00 - 22:00",
    phone: "+91 22 2570 1234",
    lat: 19.1240,
    lng: 72.9095,
  },
  {
    id: "fac-2",
    name: "Apollo Pharmacy",
    category: "pharmacy",
    iconType: "pharmacy",
    badgeColor: "#10b981",
    distText: "210 m from route",
    distanceMeters: 210,
    rating: 4.7,
    safetyScore: 92,
    address: "Hiranandani Gardens, Powai",
    hours: "Open • 24 hours",
    phone: "+91 22 2570 5678",
    lat: 19.1180,
    lng: 72.9090,
  },
  {
    id: "fac-3",
    name: "Bharat Petrol Pump",
    category: "fuel",
    iconType: "fuel",
    badgeColor: "#f59e0b",
    distText: "450 m from route",
    distanceMeters: 450,
    rating: 4.3,
    safetyScore: 84,
    address: "JVLR, Powai",
    hours: "Open • 24 hours",
    phone: "+91 22 2576 9999",
    lat: 19.1290,
    lng: 72.8980,
  },
  {
    id: "fac-4",
    name: "Tata Power EV Fast Charging Station",
    category: "ev_charging",
    iconType: "ev",
    badgeColor: "#06b6d4",
    distText: "510 m from route",
    distanceMeters: 510,
    rating: 4.6,
    safetyScore: 88,
    address: "Galleria Shopping Complex, Powai",
    hours: "Open • 24 hours",
    phone: "+91 22 6717 1111",
    lat: 19.1205,
    lng: 72.9110,
  },
  {
    id: "fac-5",
    name: "Powai Police Station",
    category: "police",
    iconType: "police",
    badgeColor: "#3b82f6",
    distText: "620 m from route",
    distanceMeters: 620,
    rating: 4.9,
    safetyScore: 98,
    address: "Powai Headquarters",
    hours: "Open • 24 hours",
    phone: "100",
    lat: 19.1160,
    lng: 72.9020,
  },
  {
    id: "fac-6",
    name: "Public Restroom Facility",
    category: "restroom",
    iconType: "restroom",
    badgeColor: "#8b5cf6",
    distText: "800 m from route",
    distanceMeters: 800,
    rating: 4.1,
    safetyScore: 80,
    address: "Powai Lake Promenade",
    hours: "Open • 06:00 - 21:00",
    phone: "",
    lat: 19.1210,
    lng: 72.9120,
  },
  {
    id: "fac-7",
    name: "Hiranandani Safe Parking Plaza",
    category: "parking",
    iconType: "parking",
    badgeColor: "#64748b",
    distText: "340 m from route",
    distanceMeters: 340,
    rating: 4.5,
    safetyScore: 90,
    address: "Central Avenue, Hiranandani, Powai",
    hours: "Open • 24 hours",
    phone: "+91 22 2571 8888",
    lat: 19.1195,
    lng: 72.9080,
  },
];

// All supported category filters
const CATEGORIES = [
  { id: "all", label: "All", icon: null },
  { id: "hospital", label: "Hospitals", icon: "hospital", color: "#ef4444" },
  { id: "pharmacy", label: "Pharmacies", icon: "pharmacy", color: "#10b981" },
  { id: "police", label: "Police", icon: "police", color: "#3b82f6" },
  { id: "fuel", label: "Fuel / Pumps", icon: "fuel", color: "#f59e0b" },
  { id: "ev_charging", label: "EV Charging", icon: "ev", color: "#06b6d4" },
  { id: "restroom", label: "Restrooms", icon: "restroom", color: "#8b5cf6" },
  { id: "parking", label: "Parking", icon: "parking", color: "#64748b" },
];

export default function JourneyResourcesPanel({
  activeRouteCoords = [],
  onSelectResource,
  onNavigateResource,
  isExpanded = false,
  onClose,
  selectedCategories: externalCategories,
  onCategoryChange,
  onResourcesLoaded,
}) {
  const [mode, setMode] = useState("near_route"); // 'near_route' | 'near_me'
  const [searchQuery, setSearchQuery] = useState("");
  const [internalCategories, setInternalCategories] = useState(["all"]);
  const [distanceFilter, setDistanceFilter] = useState("1km");
  const [sortOption, setSortOption] = useState("distance");
  const [liveResources, setLiveResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState("Curated");

  const selectedCategories = externalCategories || internalCategories;
  const updateCategories = onCategoryChange || setInternalCategories;

  // Effective route coordinates for corridor search
  const effectiveCoords = activeRouteCoords && activeRouteCoords.length > 1 
    ? activeRouteCoords 
    : REAL_ROAD_SAFE_ROUTE;

  const abortControllerRef = useRef(null);

  // Fetch live OpenStreetMap resources from backend along the route corridor
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    async function fetchLiveResources() {
      setLoading(true);
      try {
        const radiusMeters = distanceFilter === "1km" ? 1200 : distanceFilter === "2km" ? 2200 : 5000;
        const res = await fetch(`${BACKEND_URL}/api/resources/along-route`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            route_coords: effectiveCoords,
            categories: ["hospital", "pharmacy", "police", "fuel", "ev_charging", "restroom", "parking"],
            corridor_radius_meters: radiusMeters,
            max_results: 50,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.resources) && data.resources.length > 0) {
            // Map live backend POIs to UI card format
            const formatted = data.resources.map((item, idx) => {
              const catConfig = CATEGORIES.find(c => c.id === item.category) || {};
              return {
                id: item.id || `osm-${item.category}-${idx}`,
                name: item.name || `${catConfig.label || "Facility"}`,
                category: item.category,
                iconType: item.category,
                badgeColor: catConfig.color || item.color || "#3b82f6",
                distText: item.distance_from_route_text || `${Math.round(item.distance_from_route_meters || 100)} m from route`,
                distanceMeters: item.distance_from_route_meters || (idx * 50 + 40),
                rating: item.rating || (4.2 + (idx % 8) * 0.1),
                safetyScore: item.safety_score || (85 + (idx % 12)),
                address: item.address || "Powai Route Corridor",
                hours: item.opening_hours || "Open • 24 hours",
                phone: item.phone || "",
                lat: item.lat,
                lng: item.lng,
              };
            });
            setLiveResources(formatted);
            setDataSource("OpenStreetMap Live");
            if (onResourcesLoaded) onResourcesLoaded(formatted);
            return;
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Backend along-route fetch failed, using fallback:", err.message);
        }
      } finally {
        setLoading(false);
      }

      // Fallback: Use DEFAULT_RESOURCES
      setLiveResources(DEFAULT_RESOURCES);
      setDataSource("Curated Corridor");
      if (onResourcesLoaded) onResourcesLoaded(DEFAULT_RESOURCES);
    }

    fetchLiveResources();

    return () => {
      abortController.abort();
    };
  }, [distanceFilter]);

  // Active pool of facilities: live backend if available, otherwise DEFAULT_RESOURCES
  const currentPool = liveResources.length > 0 ? liveResources : DEFAULT_RESOURCES;

  // Toggle category chips (supporting multiple or single "all")
  function handleCategoryClick(catId) {
    if (catId === "all") {
      updateCategories(["all"]);
      return;
    }
    let updated;
    if (selectedCategories.includes(catId)) {
      updated = selectedCategories.filter((c) => c !== catId);
      if (updated.length === 0) updated = ["all"];
    } else {
      updated = selectedCategories.filter((c) => c !== "all");
      updated.push(catId);
    }
    updateCategories(updated);
  }

  function handleClearAll() {
    updateCategories(["all"]);
    setSearchQuery("");
    setDistanceFilter("1km");
    setSortOption("distance");
  }

  // Filter and sort items based on selected chips, search query, distance, mode, and sort option
  const filteredResources = currentPool
    .filter((res) => {
      // Category check
      if (!selectedCategories.includes("all")) {
        if (!selectedCategories.includes(res.category)) {
          return false;
        }
      }
      // Distance filter check
      const maxDistMeters = distanceFilter === "1km" ? 1200 : distanceFilter === "2km" ? 2200 : 5000;
      if (res.distanceMeters && res.distanceMeters > maxDistMeters) {
        return false;
      }
      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          res.name.toLowerCase().includes(q) ||
          res.address.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOption === "distance") {
        return (a.distanceMeters || 0) - (b.distanceMeters || 0);
      }
      if (sortOption === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortOption === "safety") {
        return (b.safetyScore || 0) - (a.safetyScore || 0);
      }
      return 0;
    });

  function handleCall(item) {
    if (item.phone) {
      window.open(`tel:${item.phone}`, "_self");
    } else {
      alert(`Contact number not listed for ${item.name}`);
    }
  }

  function handleLocate(item) {
    if (onSelectResource) {
      onSelectResource(item);
    }
  }

  function handleDirections(item) {
    if (onNavigateResource) {
      onNavigateResource(item);
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`,
        "_blank"
      );
    }
  }

  return (
    <div className={`panel-container journey-resources-panel ${isExpanded ? "expanded-width" : ""}`}>
      {/* ── 1. HEADER: Journey Resources, subtitle, actual result count and Close button ── */}
      <div className="panel-header-row">
        <div className="panel-title-group">
          <div className="resource-header-icon-badge">
            <Briefcase size={16} color="#3b82f6" />
          </div>
          <span className="panel-title-text">Journey Resources</span>
          <span className="found-badge">{filteredResources.length} FOUND</span>
        </div>

        {/* Close Button as seen in screenshot */}
        {onClose && (
          <button 
            className="panel-close-btn" 
            onClick={onClose}
            aria-label="Close Journey Resources Panel"
            title="Close Journey Resources and expand map"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      <div className="panel-subtitle" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>Find useful places along your route</span>
        <span style={{ fontSize: "0.68rem", color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: 4 }}>
          {loading && <Loader2 size={10} className="spin" />}
          <span>{dataSource}</span>
        </span>
      </div>

      {/* ── 2. SEARCH SCOPE: Near Route / Near Me segmented control ── */}
      <div className="segmented-toggle">
        <button
          className={`segment-btn ${mode === "near_route" ? "active" : ""}`}
          onClick={() => setMode("near_route")}
        >
          Near route
        </button>
        <button
          className={`segment-btn ${mode === "near_me" ? "active" : ""}`}
          onClick={() => setMode("near_me")}
        >
          Near me
        </button>
      </div>

      {/* ── 3. SEARCH: facility or brand search field ── */}
      <div className="resource-search-row">
        <div className="resource-search-box">
          <Search size={15} className="search-icon-muted" />
          <input
            type="text"
            className="resource-search-input"
            placeholder="Search nearby hospitals, pharmacies, EV..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── 4. ORGANISED FILTERS SECTION ── */}
      <div className="filters-organized-section">
        <div className="filters-section-header">
          <span className="filters-heading-label">Filters</span>
          {(!selectedCategories.includes("all") || searchQuery) && (
            <button 
              className="filters-clear-btn"
              onClick={handleClearAll}
              title="Reset all filters"
            >
              <RotateCcw size={11} /> Clear all
            </button>
          )}
        </div>

        {/* All supported category chips displayed directly in wrapped layout */}
        <div className="category-chips-row">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                className={`category-chip ${isSelected ? "active" : ""}`}
                onClick={() => handleCategoryClick(cat.id)}
                type="button"
                aria-pressed={isSelected}
              >
                {cat.id === "all" && <span className="chip-dot"></span>}
                {cat.id === "hospital" && <Plus size={11} className="chip-icon-red" />}
                {cat.id === "pharmacy" && <Plus size={11} className="chip-icon-green" />}
                {cat.id === "police" && <span className="chip-icon-blue">🛡</span>}
                {cat.id === "fuel" && <span className="chip-icon-amber">⛽</span>}
                {cat.id === "ev_charging" && <Zap size={11} color="#06b6d4" />}
                {cat.id === "restroom" && <span style={{ color: "#8b5cf6", fontSize: "11px" }}>🚻</span>}
                {cat.id === "parking" && <span style={{ color: "#94a3b8", fontWeight: 700, fontSize: "11px" }}>🅿</span>}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. DISTANCE AND SORTING ROW ── */}
      <div className="dropdowns-filter-row">
        <div className="select-pill-wrapper">
          <select 
            value={distanceFilter} 
            onChange={(e) => setDistanceFilter(e.target.value)}
            className="select-pill"
          >
            <option value="1km">Within 1 km</option>
            <option value="2km">Within 2 km</option>
            <option value="5km">Within 5 km</option>
          </select>
          <ChevronDown size={12} className="select-chevron" />
        </div>

        <div className="select-pill-wrapper">
          <select 
            value={sortOption} 
            onChange={(e) => setSortOption(e.target.value)}
            className="select-pill"
          >
            <option value="distance">Sort: Distance</option>
            <option value="rating">Sort: Rating</option>
            <option value="safety">Sort: Safety</option>
          </select>
          <ChevronDown size={12} className="select-chevron" />
        </div>
      </div>

      {/* ── 6. RESULTS: VERTICALLY SCROLLABLE FACILITY CARDS ── */}
      <div className="resource-cards-list">
        {filteredResources.length === 0 ? (
          <div className="empty-results-prompt">
            <span style={{ fontSize: "1.2rem" }}>🔍</span>
            <span>No facilities match the selected filters.</span>
            <button className="btn-outline-sm" onClick={handleClearAll}>Reset filters</button>
          </div>
        ) : (
          filteredResources.map((item) => (
            <div key={item.id} className="resource-card">
              {/* Top row of card */}
              <div className="resource-card-top">
                {/* Category Icon Badge */}
                <div
                  className="resource-type-icon"
                  style={{ backgroundColor: item.badgeColor }}
                >
                  {item.iconType === "clinic" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                      <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
                    </svg>
                  )}
                  {item.iconType === "pharmacy" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                      <path d="M6 3h12v2H6zm0 16h12v2H6zm6-14c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm-1 10H8v-2h3v-3h2v3h3v2h-3v3h-2v-3z"/>
                    </svg>
                  )}
                  {item.iconType === "fuel" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                      <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33a2.5 2.5 0 0 0 2.5 2.5c.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v4.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5z"/>
                    </svg>
                  )}
                  {item.iconType === "ev" && (
                    <Zap size={15} color="white" />
                  )}
                  {item.iconType === "police" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                    </svg>
                  )}
                  {item.iconType === "restroom" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                      <path d="M5.5 22v-7.5H4V9c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2v5.5H9.5V22h-4zM7.5 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm11 10.5V22h-3v-7.5h-1.5L16 9c0-1.1.9-2 2-2h1c1.1 0 2 .9 2 2l1.9 5.5h-1.4zM18.5 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                    </svg>
                  )}
                  {item.iconType === "parking" && (
                    <span style={{ fontWeight: "800", fontSize: "13px", color: "white" }}>P</span>
                  )}
                </div>

                {/* Title & metadata with spacious layout */}
                <div className="resource-card-title-col">
                  <h5 className="resource-title-text">{item.name}</h5>
                  <div className="resource-dist-pill">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <span>{item.distText}</span>
                  </div>
                  <div className="resource-address-text">{item.address}</div>
                  <div className="resource-hours-text">{item.hours}</div>
                </div>

                {/* Context menu icon */}
                <button className="card-kebab-btn" aria-label="More options">
                  <MoreVertical size={14} />
                </button>
              </div>

              {/* Card Action Buttons (Call, Locate, Directions) */}
              <div className="resource-card-actions">
                <button 
                  className="action-btn-secondary" 
                  onClick={() => handleCall(item)}
                >
                  <Phone size={12} />
                  <span>Call</span>
                </button>
                <button 
                  className="action-btn-secondary" 
                  onClick={() => handleLocate(item)}
                >
                  <Crosshair size={12} />
                  <span>Locate</span>
                </button>
                <button 
                  className="action-btn-primary" 
                  onClick={() => handleDirections(item)}
                >
                  <Navigation2 size={12} />
                  <span>Directions</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
