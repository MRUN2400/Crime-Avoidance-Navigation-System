import { useState } from "react";
import { 
  ShieldAlert, 
  Lightbulb, 
  Car, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  Info, 
  Navigation, 
  Share2 
} from "lucide-react";

export default function RouteSafetyPanel({
  score = 72,
  riskCategory = "Moderate Risk",
  riskDescription = "Generally safe, with a few higher risk areas",
  distance = "5.8 km",
  duration = "22 min",
  segmentsCount = 4,
  segments = [
    { id: 1, name: "Segment 1", risk: "Low Risk", riskType: "low", distance: "1.2 km" },
    { id: 2, name: "Segment 2", risk: "Moderate Risk", riskType: "mod", distance: "1.8 km" },
    { id: 3, name: "Segment 3", risk: "Higher Risk", riskType: "high", distance: "1.4 km" },
    { id: 4, name: "Segment 4", risk: "Low Risk", riskType: "low", distance: "1.4 km" },
  ],
  showCrimeZones,
  setShowCrimeZones,
  showStreetLighting,
  setShowStreetLighting,
  showTrafficDensity,
  setShowTrafficDensity,
  onStartNavigation,
  onShareRoute,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  // SVG circular gauge calculation: 270 degree arc or full circle
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (260 / 360);
  const strokeDashoffset = arcLength - (arcLength * Math.min(Math.max(score, 0), 100)) / 100;

  function handleShare() {
    if (onShareRoute) {
      onShareRoute();
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2500);
    }
  }

  // ── COLLAPSED VIEW: COMPACT RAIL MATCHING SCREENSHOT EXACTLY ──
  if (isCollapsed) {
    return (
      <div className="panel-container route-safety-panel collapsed-panel-view">
        <div className="collapsed-header-vertical">
          <button 
            className="collapse-toggle-btn expand-btn"
            onClick={onToggleCollapse}
            aria-label="Expand Route Safety Panel"
            title="Expand Route Safety Panel"
          >
            <ChevronRight size={18} />
          </button>

          <div className="collapsed-title-group">
            <div className="shield-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="collapsed-vertical-text">ROUTE SAFETY</span>
          </div>

          {/* Circular ring score badge as seen in screenshot */}
          <div className="collapsed-circular-score-badge" title={`Safety Score: ${score}/100 (${riskCategory})`}>
            <svg className="collapsed-score-ring" width="38" height="38" viewBox="0 0 40 40">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="#1e293b"
                strokeWidth="3.5"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3.5"
                strokeDasharray="100.5"
                strokeDashoffset={100.5 - (100.5 * score) / 100}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
              />
            </svg>
            <span className="collapsed-score-number">{score}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── EXPANDED VIEW: COMPLETE ROUTE SAFETY PANEL ──
  return (
    <div className="panel-container route-safety-panel">
      {/* ── PANEL HEADER WITH COLLAPSE TOGGLE ── */}
      <div className="panel-header-row">
        <div className="panel-title-group">
          <div className="shield-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span className="panel-title-text">Route Safety</span>
          <button className="icon-info-btn" title="Safety methodology details" aria-label="Route Safety Info">
            <Info size={14} />
          </button>
        </div>

        {/* Panel Collapse Toggle Button */}
        <button 
          className="collapse-toggle-btn"
          onClick={onToggleCollapse}
          aria-label="Collapse Route Safety Panel"
          title="Collapse panel to expand Journey Resources"
        >
          <ChevronLeft size={17} />
        </button>
      </div>

      <div className="panel-scroll-content">
        {/* ── SAFETY SCORE GAUGE ── */}
        <div className="gauge-card">
          <div className="gauge-meter-wrapper">
            <svg className="gauge-svg" width="130" height="130" viewBox="0 0 140 140">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
              {/* Background Track */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                className="gauge-bg-arc"
                strokeWidth="11"
                strokeDasharray={`${arcLength} ${circumference}`}
                transform="rotate(140 70 70)"
              />
              {/* Colored Progress Arc */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                className="gauge-progress-arc"
                stroke="url(#gaugeGradient)"
                strokeWidth="11"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(140 70 70)"
              />
            </svg>
            <div className="gauge-score-center">
              <span className="gauge-score-val">{score}</span>
              <span className="gauge-score-denom">/100</span>
            </div>
          </div>

          <div className="gauge-info-text">
            <h3 className="gauge-risk-status">{riskCategory}</h3>
            <p className="gauge-risk-desc">{riskDescription}</p>
          </div>
        </div>

        {/* ── STATS ROW (3 CARDS) ── */}
        <div className="stats-row-grid">
          <div className="stat-card">
            <span className="stat-card-value">{distance}</span>
            <span className="stat-card-label">Distance</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value">{duration}</span>
            <span className="stat-card-label">Duration</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value">{segmentsCount}</span>
            <span className="stat-card-label">Segments</span>
          </div>
        </div>

        {/* ── SEGMENT RISK BREAKDOWN ── */}
        <div className="breakdown-section">
          <h4 className="section-heading-sm">Segment Risk Breakdown</h4>
          <div className="segments-list">
            {segments.map((seg) => (
              <div key={seg.id} className="segment-row-item">
                <div className="segment-indicator-dot" data-risk={seg.riskType}></div>
                <span className="segment-name">{seg.name}</span>
                <span className={`segment-risk-badge badge-${seg.riskType}`}>
                  {seg.risk}
                </span>
                <span className="segment-distance-text">{seg.distance}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SAFETY HEATMAP LAYERS ── */}
        <div className="heatmap-section-wrapper">
          <div 
            className="heatmap-section-header"
            onClick={() => setLayersCollapsed(!layersCollapsed)}
          >
            <div className="heatmap-header-title">
              <span>Safety Heatmap Layers</span>
              <span className="info-icon-muted"><Info size={13} /></span>
            </div>
            <button className="collapse-chevron-btn" aria-label="Toggle layers collapse">
              {layersCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>

          {!layersCollapsed && (
            <div className="heatmap-layers-content">
              {/* Layer 1: Crime Zones */}
              <div className="layer-row">
                <div className="layer-icon-badge badge-crime">
                  <ShieldAlert size={15} color="#ef4444" />
                </div>
                <span className="layer-label">Crime Zones</span>
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={showCrimeZones}
                    onChange={(e) => setShowCrimeZones(e.target.checked)}
                  />
                  <span className="slider-round"></span>
                </label>
              </div>

              {/* Layer 2: Street Lighting */}
              <div className="layer-row">
                <div className="layer-icon-badge badge-lighting">
                  <Lightbulb size={15} color="#eab308" />
                </div>
                <span className="layer-label">Street Lighting</span>
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={showStreetLighting}
                    onChange={(e) => setShowStreetLighting(e.target.checked)}
                  />
                  <span className="slider-round"></span>
                </label>
              </div>

              {/* Layer 3: Traffic Density */}
              <div className="layer-row">
                <div className="layer-icon-badge badge-traffic">
                  <Car size={15} color="#f59e0b" />
                </div>
                <span className="layer-label">Traffic Density</span>
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={showTrafficDensity}
                    onChange={(e) => setShowTrafficDensity(e.target.checked)}
                  />
                  <span className="slider-round"></span>
                </label>
              </div>

              {/* Risk Legend Dots Footer */}
              <div className="layer-legend-dots">
                <div className="legend-dot-item">
                  <span className="dot dot-low"></span>
                  <span>Low Risk Zone</span>
                </div>
                <div className="legend-dot-item">
                  <span className="dot dot-mod"></span>
                  <span>Moderate Risk</span>
                </div>
                <div className="legend-dot-item">
                  <span className="dot dot-high"></span>
                  <span>High Crime Zone</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM ACTIONS ── */}
      <div className="panel-actions-footer">
        <button 
          className="btn-start-nav"
          onClick={onStartNavigation}
        >
          <Navigation size={16} fill="white" />
          <span>Start Navigation</span>
        </button>
        <button 
          className="btn-share-route"
          onClick={handleShare}
          title={shareFeedback ? "Link Copied!" : "Share Route"}
        >
          <Share2 size={16} />
          <span>{shareFeedback ? "Copied!" : "Share"}</span>
        </button>
      </div>
    </div>
  );
}
