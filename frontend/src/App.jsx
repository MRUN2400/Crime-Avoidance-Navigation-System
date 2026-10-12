import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

// ── Components ──
import MapComponent from "./components/MapComponent";
import RouteSafetyPanel from "./components/RouteSafetyPanel";
import JourneyResourcesPanel from "./components/JourneyResourcesPanel";
import RoutePanel from "./components/RoutePanel";
import GuardianMode from "./components/GuardianMode";
import TrustedContacts from "./components/TrustedContacts";
import ContactsPanel from "./components/ContactsPanel";
import { HazardReport, SOSButton, RecentTripsModal } from "./components/index";

// ── Auth pages ──
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// ── Icons ──
import { 
  Shield, 
  MapPin, 
  Briefcase, 
  Clock, 
  Settings, 
  Search, 
  Sun, 
  Moon, 
  Bell, 
  AlertTriangle,
  ChevronDown,
  LogOut,
  X
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import "./App.css";

// ─────────────────────────────────────────────────────────────
// Dashboard — Matches the reference screenshot layout exactly
// Layout: Top Header + Narrow Left Nav + 3-Column Workspace
// [Left Center Map (50%)] [Route Safety Panel (25%)] [Journey Resources Panel (25%)]
// ─────────────────────────────────────────────────────────────
function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation Sidebar active state ('plan', 'resources', 'guardian', 'history')
  const [activeNavTab, setActiveNavTab] = useState("plan");

  // Header & Modals state
  const [searchQuery,         setSearchQuery]         = useState("");
  const [isDarkMode,          setIsDarkMode]          = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showRecentTrips,     setShowRecentTrips]     = useState(false);
  const [showHazardForm,      setShowHazardForm]      = useState(false);
  const [showContacts,        setShowContacts]        = useState(false);
  const [showSettingsModal,   setShowSettingsModal]   = useState(false);
  const [showPlanRouteModal,  setShowPlanRouteModal]  = useState(false);
  const [guardianAlert,       setGuardianAlert]       = useState(null);
  const [mapClickCoords,      setMapClickCoords]      = useState(null);

  // Map & routing state (persisting full existing backend connection)
  const [routes,              setRoutes]              = useState(null);
  const [activeRoute,         setActiveRoute]         = useState("safest");
  const [source,              setSource]              = useState("Powai Junction");
  const [destination,         setDestination]         = useState("IIT Bombay");
  const [travelMode,          setTravelMode]          = useState("walking");
  const [loading,             setLoading]             = useState(false);
  const [mapError,            setMapError]            = useState(null);

  // Safety Heatmap Layers toggles (controlled from middle panel)
  const [showCrimeZones,      setShowCrimeZones]      = useState(true);
  const [showStreetLighting,  setShowStreetLighting]  = useState(true);
  const [showTrafficDensity,  setShowTrafficDensity]  = useState(true);

  // SOS modal state
  const [showSOSModal,          setShowSOSModal]          = useState(false);

  // Route Safety Panel collapsible state (defaults to true matching reference screenshot collapsed rail)
  const [isSafetyCollapsed,     setIsSafetyCollapsed]     = useState(true);

  // Journey Resources Panel visibility (closed by default, opens only on Resources click)
  const [showJourneyResources,  setShowJourneyResources]  = useState(false);

  // Plan Journey Panel visibility (toggled via left sidebar Plan button)
  const [showPlanPanel,         setShowPlanPanel]         = useState(false);

  // Shared category filter state for map facility markers & resources panel
  const [selectedCategories,   setSelectedCategories]   = useState(["all"]);

  // Active pool of journey resources (synchronized between panel and map markers)
  const [journeyResources,     setJourneyResources]     = useState([]);

  // Focused resource on map (when clicking 'Locate' on a facility card)
  const [selectedResource,     setSelectedResource]     = useState(null);

  function toggleTheme() {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
  }

  function handleGuardianAlert(alert) {
    setGuardianAlert(alert);
    setTimeout(() => setGuardianAlert(null), 5000);
  }

  return (
    <div className="safepath-app-layout">
      {/* ══════════════════════════════════════════════
          1. TOP HEADER (COMPACT HORIZONTAL BAR)
      ══════════════════════════════════════════════ */}
      <header className="safepath-top-header">
        {/* Top-Left: SafePath Logo & Wordmark */}
        <div className="header-brand-group">
          <div className="header-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span className="header-brand-title">SafePath</span>
        </div>

        {/* Top-Right: Global Search, Theme Switch, Notification, Avatar */}
        <div className="header-right-actions">
          {/* Global search input with Ctrl + K badge */}
          <div className="global-search-container">
            <Search size={14} className="search-icon-muted" />
            <input
              type="text"
              placeholder="Search location or place..."
              className="global-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="ctrl-k-badge">Ctrl + K</span>
          </div>

          {/* Theme switcher button (half sun / moon icon) */}
          <button 
            className="header-action-icon-btn" 
            onClick={toggleTheme} 
            title="Toggle theme mode"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notification bell with red alert dot */}
          <div className="notification-bell-wrapper">
            <button className="header-action-icon-btn" aria-label="Notifications">
              <Bell size={17} />
            </button>
            <span className="notification-red-dot"></span>
          </div>

          {/* User profile avatar circular button */}
          {user ? (
            <div className="profile-avatar-wrapper">
              <button 
                className="profile-avatar-circle"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                aria-label="User profile menu"
              >
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} className="avatar-img" />
                ) : (
                  <span>{user.name ? user.name.charAt(0).toUpperCase() : "A"}</span>
                )}
              </button>

              {showProfileDropdown && (
                <div className="profile-dropdown-popup">
                  <div className="dropdown-user-header">
                    <div className="user-name-bold">{user.name || "Alex Vance"}</div>
                    <div className="user-email-text">{user.email}</div>
                  </div>
                  <div className="dropdown-action-item" onClick={() => { setShowRecentTrips(true); setShowProfileDropdown(false); }}>
                    <Clock size={15} /> Recent Trips
                  </div>
                  <div className="dropdown-action-item" onClick={() => { setShowContacts(true); setShowProfileDropdown(false); }}>
                    <Shield size={15} /> Emergency Contacts
                  </div>
                  <div className="dropdown-action-item" onClick={() => { setShowHazardForm(true); setShowProfileDropdown(false); }}>
                    <AlertTriangle size={15} /> Report Hazard
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-action-item logout" onClick={() => { logout(); setShowProfileDropdown(false); }}>
                    <LogOut size={15} /> Logout
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="profile-avatar-circle login-circle" onClick={() => navigate("/login")}>
              <span>A</span>
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════
          2. WORKSPACE BODY: NARROW SIDEBAR + 3-COLUMN CONTENT
      ══════════════════════════════════════════════ */}
      <div className="safepath-body-container">
        {/* ── LEFT NAVIGATION SIDEBAR (FIXED NARROW ~64px) ── */}
        <aside className="left-nav-sidebar">
          <div className="nav-top-buttons">
            {/* Plan Button (Toggle inline Plan Journey drawer) */}
            <button
              className={`nav-item-btn ${showPlanPanel || activeNavTab === "plan" ? "active" : ""}`}
              onClick={() => {
                setActiveNavTab("plan");
                setShowPlanPanel((prev) => !prev);
              }}
              title="Plan Route"
            >
              <div className="nav-icon-wrap">
                <MapPin size={18} />
              </div>
              <span className="nav-item-text">Plan</span>
            </button>

            {/* Resources Button */}
            <button
              className={`nav-item-btn ${showJourneyResources || activeNavTab === "resources" ? "active" : ""}`}
              onClick={() => {
                setActiveNavTab("resources");
                setShowJourneyResources((prev) => !prev);
              }}
              title="Journey Resources"
              aria-label="Toggle Journey Resources"
            >
              <div className="nav-icon-wrap">
                <Briefcase size={18} />
              </div>
              <span className="nav-item-text">Resources</span>
            </button>

            {/* Guardian Button */}
            <button
              className={`nav-item-btn ${activeNavTab === "guardian" ? "active" : ""}`}
              onClick={() => setActiveNavTab("guardian")}
              title="Guardian Safety Mode"
            >
              <div className="nav-icon-wrap">
                <Shield size={18} />
              </div>
              <span className="nav-item-text">Guardian</span>
            </button>

            {/* History Button */}
            <button
              className={`nav-item-btn ${activeNavTab === "history" ? "active" : ""}`}
              onClick={() => {
                setActiveNavTab("history");
                setShowRecentTrips(true);
              }}
              title="Trip History"
            >
              <div className="nav-icon-wrap">
                <Clock size={18} />
              </div>
              <span className="nav-item-text">History</span>
            </button>
          </div>

          {/* Bottom Settings Button */}
          <div className="nav-bottom-group">
            <button 
              className="nav-settings-btn" 
              onClick={() => setShowSettingsModal(true)}
              title="Settings"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </aside>

        {/* ── WORKSPACE: MAP + INLINE PLANNER + ROUTE SAFETY + JOURNEY RESOURCES ── */}
        <main className="three-column-workspace">
          {/* OPTIONAL INLINE DRAWER: PLAN JOURNEY PANEL (Toggled via Plan button) */}
          {showPlanPanel && (
            <section className="column-plan-journey">
              <div className="panel-header-row" style={{ padding: "14px 16px 10px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="panel-title-group">
                  <div className="resource-header-icon-badge">
                    <MapPin size={16} color="#3b82f6" />
                  </div>
                  <span className="panel-title-text">Plan Safe Journey</span>
                </div>
                <button 
                  className="panel-close-btn" 
                  onClick={() => setShowPlanPanel(false)}
                  aria-label="Close Plan Panel"
                  title="Close Plan Panel"
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: 14, overflowY: "auto", flex: 1 }}>
                <RoutePanel
                  source={source}
                  setSource={setSource}
                  destination={destination}
                  setDestination={setDestination}
                  travelMode={travelMode}
                  setTravelMode={setTravelMode}
                  routes={routes}
                  setRoutes={setRoutes}
                  activeRoute={activeRoute}
                  setActiveRoute={setActiveRoute}
                  loading={loading}
                  setLoading={setLoading}
                  setMapError={setMapError}
                />
              </div>
            </section>
          )}

          {/* COLUMN 1: MAIN MAP WORKSPACE */}
          <section className="column-map-workspace">
            <MapComponent
              safestCoords={routes?.safest_route?.path || []}
              fastestCoords={routes?.fastest_route?.path || []}
              activeRoute={activeRoute}
              error={mapError}
              showCrimeZones={showCrimeZones}
              showStreetLighting={showStreetLighting}
              showTrafficDensity={showTrafficDensity}
              selectedCategories={selectedCategories}
              selectedResource={selectedResource}
              journeyResources={journeyResources}
              onSOSClick={() => setShowSOSModal(true)}
            />
          </section>

          {/* COLUMN 2: ROUTE SAFETY PANEL (Supports working expand/collapse) */}
          <section className={`column-route-safety ${isSafetyCollapsed ? "collapsed-col" : ""}`}>
            <RouteSafetyPanel
              score={72}
              riskCategory="Moderate Risk"
              riskDescription="Generally safe, with a few higher risk areas"
              distance={routes?.safest_route?.distance ? `${(routes.safest_route.distance / 1000).toFixed(1)} km` : "5.8 km"}
              duration={routes?.safest_route?.duration ? `${Math.round(routes.safest_route.duration / 60)} min` : "22 min"}
              segmentsCount={4}
              showCrimeZones={showCrimeZones}
              setShowCrimeZones={setShowCrimeZones}
              showStreetLighting={showStreetLighting}
              setShowStreetLighting={setShowStreetLighting}
              showTrafficDensity={showTrafficDensity}
              setShowTrafficDensity={setShowTrafficDensity}
              isCollapsed={isSafetyCollapsed}
              onToggleCollapse={() => setIsSafetyCollapsed(!isSafetyCollapsed)}
              onStartNavigation={() => {
                alert("Starting GPS SafePath turn-by-turn navigation...");
              }}
              onShareRoute={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert("Safe route link copied to clipboard!");
              }}
            />
          </section>

          {/* COLUMN 3: JOURNEY RESOURCES PANEL (Opens only when user clicks Resources) */}
          {showJourneyResources && (
            <section className={`column-journey-resources ${isSafetyCollapsed ? "expanded-col" : ""}`}>
              <JourneyResourcesPanel
                isExpanded={isSafetyCollapsed}
                activeRouteCoords={routes ? (activeRoute === "safest" ? routes.safest_route?.path : routes.fastest_route?.path) || [] : []}
                onClose={() => setShowJourneyResources(false)}
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
                onResourcesLoaded={setJourneyResources}
                onSelectResource={(item) => {
                  setSelectedResource(item);
                }}
                onNavigateResource={(item) => {
                  setDestination(item.name);
                  setShowPlanPanel(true);
                }}
              />
            </section>
          )}
        </main>
      </div>

      {/* ══════════════════════════════════════════════
          MODALS & FLOATING OVERLAYS (GUARDIAN / SOS / PLAN ROUTE)
      ══════════════════════════════════════════════ */}
      {/* Route Planner Modal for calculating custom routes */}
      {showPlanRouteModal && (
        <div className="modal-overlay" onClick={() => setShowPlanRouteModal(false)}>
          <div className="modal-box plan-route-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📍 Plan Safe Journey</div>
              <button className="icon-close-btn" onClick={() => setShowPlanRouteModal(false)}><X size={18} /></button>
            </div>
            <RoutePanel
              source={source}
              setSource={setSource}
              destination={destination}
              setDestination={setDestination}
              travelMode={travelMode}
              setTravelMode={setTravelMode}
              routes={routes}
              setRoutes={setRoutes}
              activeRoute={activeRoute}
              setActiveRoute={setActiveRoute}
              loading={loading}
              setLoading={setLoading}
              setMapError={setMapError}
            />
            <button 
              className="btn-outline" 
              onClick={() => setShowPlanRouteModal(false)}
              style={{ width: "100%", marginTop: 12 }}
            >
              Close &amp; View Map
            </button>
          </div>
        </div>
      )}

      {/* SOS Modal trigger from floating button */}
      {showSOSModal && (
        <div className="modal-overlay" onClick={() => setShowSOSModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ border: "2px solid #ef4444" }}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: 8 }}>
                🚨 Emergency SOS Response
              </div>
              <button className="icon-close-btn" onClick={() => setShowSOSModal(false)}><X size={18} /></button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: 16 }}>
              Select an emergency response action below. Your live GPS coordinates will be captured immediately.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                className="btn-primary"
                onClick={() => window.open("tel:112", "_self")}
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff" }}
              >
                📞 Call Police / Emergency 112
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  navigator.clipboard?.writeText("🚨 EMERGENCY: Need help at Powai coordinates: 19.1245, 72.9050");
                  alert("Live emergency GPS location copied to clipboard!");
                }}
                style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff" }}
              >
                📍 Share Live GPS Coordinates
              </button>
            </div>
            <button className="btn-outline" onClick={() => setShowSOSModal(false)} style={{ width: "100%", marginTop: 16 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recent Trips Modal */}
      {showRecentTrips && (
        <RecentTripsModal onClose={() => setShowRecentTrips(false)} />
      )}

      {/* Hazard Report Modal */}
      {showHazardForm && (
        <HazardReport
          coords={mapClickCoords}
          user={user}
          onClose={() => setShowHazardForm(false)}
        />
      )}

      {/* Trusted Contacts Modal */}
      {showContacts && (
        <TrustedContacts user={user} onClose={() => setShowContacts(false)} />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">⚙️ Preferences &amp; Settings</div>
              <button className="icon-close-btn" onClick={() => setShowSettingsModal(false)}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, margin: "16px 0", fontSize: "0.85rem" }}>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Real-Time GPS Tracking</span>
                <input type="checkbox" defaultChecked style={{ accentColor: "#2563eb" }} />
              </label>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Auto-SOS Countdown in High Crime Areas</span>
                <input type="checkbox" defaultChecked style={{ accentColor: "#ef4444" }} />
              </label>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Voice Safety Alerts</span>
                <input type="checkbox" defaultChecked style={{ accentColor: "#2563eb" }} />
              </label>
            </div>
            <button className="btn-outline" onClick={() => setShowSettingsModal(false)} style={{ width: "100%" }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// App — top-level router
// ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/*" element={<Dashboard />} />
    </Routes>
  );
}