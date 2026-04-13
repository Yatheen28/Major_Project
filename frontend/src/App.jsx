import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  FilePlus,
  FolderOpen,
  Info,
  Activity,
  Zap,
  Rocket,
  Database,
  Brain,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

import Dashboard from "./components/Dashboard";
import ComplaintForm from "./components/ComplaintForm";
import CaseList from "./components/CaseList";
import CaseDetail from "./components/CaseDetail";

/* ======================================================================
   PAGE TITLE MAP
   ====================================================================== */
const PAGE_TITLES = {
  "/": "Dashboard",
  "/new-case": "New Case",
  "/cases": "Investigation Cases",
  "/about": "About",
};

/* ======================================================================
   ABOUT PAGE — Professional roadmap (no personal info)
   ====================================================================== */
function About() {
  const phases = [
    {
      phase: "Phase I",
      title: "Regex NER Pipeline",
      status: "ACTIVE",
      statusColor: "#2EA043",
      items: [
        "7-type entity extraction via compiled regex patterns",
        "SHA-256 evidence hashing (BSA 2023 §63 Part B)",
        "Chronological timeline reconstruction",
        "Thread-safe in-memory case storage",
        "Dark forensic dashboard with real-time analytics",
      ],
    },
    {
      phase: "Phase II",
      title: "IndicBERT + Neo4j Integration",
      status: "PLANNED",
      statusColor: "#484F58",
      items: [
        "IndicBERT transformer-based NER for Hinglish text",
        "Neo4j graph database for cross-case entity linking",
        "Relationship mapping between suspects, accounts, and transactions",
        "Confidence scoring with model ensemble",
        "Graph-based investigation path suggestions",
      ],
    },
    {
      phase: "Phase III",
      title: "Production Deployment",
      status: "FUTURE",
      statusColor: "#484F58",
      items: [
        "PostgreSQL persistence layer",
        "Role-based access control (RBAC)",
        "PDF/DOCX report generation",
        "Audit trail and chain-of-custody logging",
        "Docker containerization and CI/CD pipeline",
      ],
    },
  ];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "12px",
            background: "rgba(0,217,255,0.1)",
            border: "1px solid rgba(0,217,255,0.3)",
            marginBottom: "12px",
          }}
        >
          <Shield size={28} color="#00D9FF" />
        </div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#E6EDF3",
            marginBottom: "6px",
          }}
        >
          CyberIntel
        </h1>
        <p style={{ fontSize: "14px", color: "#8B949E" }}>
          AI-Assisted Cybercrime Investigation & Forensic Intelligence System
        </p>
      </div>

      {/* Description card */}
      <div
        style={{
          background: "#161B22",
          border: "1px solid #30363D",
          borderRadius: "6px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <p style={{ fontSize: "14px", color: "#8B949E", lineHeight: "1.7" }}>
          CyberIntel is a forensic intelligence platform designed for Indian law
          enforcement to analyze cybercrime complaints. Using NLP-based entity
          extraction, SHA-256 evidence hashing compliant with BSA 2023 Section 63
          Part B, and chronological timeline reconstruction, the system transforms
          unstructured Hinglish complaint narratives into structured,
          court-admissible investigative data.
        </p>
      </div>

      {/* Roadmap */}
      <h2
        style={{
          fontSize: "11px",
          color: "#484F58",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "16px",
          fontWeight: "600",
        }}
      >
        Development Roadmap
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {phases.map((p) => (
          <div
            key={p.phase}
            style={{
              background: "#161B22",
              border: "1px solid #30363D",
              borderRadius: "6px",
              padding: "20px",
              borderLeft:
                p.status === "ACTIVE"
                  ? "2px solid #2EA043"
                  : "2px solid #30363D",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#00D9FF",
                    fontWeight: "600",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {p.phase}
                </span>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "#E6EDF3",
                  }}
                >
                  {p.title}
                </span>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "600",
                  color: p.statusColor,
                  padding: "2px 10px",
                  borderRadius: "20px",
                  border: `1px solid ${p.statusColor}40`,
                  background: `${p.statusColor}15`,
                }}
              >
                {p.status}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {p.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  {p.status === "ACTIVE" ? (
                    <CheckCircle
                      size={13}
                      color="#2EA043"
                      style={{ marginTop: "2px", flexShrink: 0 }}
                    />
                  ) : (
                    <Clock
                      size={13}
                      color="#484F58"
                      style={{ marginTop: "2px", flexShrink: 0 }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: "13px",
                      color: p.status === "ACTIVE" ? "#8B949E" : "#484F58",
                      lineHeight: "1.5",
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================================================================
   SIDEBAR NAV ITEM
   ====================================================================== */
function SidebarLink({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: "500",
        color: isActive ? "#00D9FF" : "#8B949E",
        background: isActive ? "rgba(0,217,255,0.08)" : "transparent",
        borderLeft: isActive ? "2px solid #00D9FF" : "2px solid transparent",
        textDecoration: "none",
        transition: "all 0.15s ease",
        borderRadius: "0 4px 4px 0",
        fontFamily: "Inter, sans-serif",
      })}
      onMouseEnter={(e) => {
        if (!e.currentTarget.classList.contains("active")) {
          e.currentTarget.style.color = "#E6EDF3";
          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        }
      }}
      onMouseLeave={(e) => {
        const isActive = e.currentTarget.getAttribute("aria-current") === "page";
        if (!isActive) {
          e.currentTarget.style.color = "#8B949E";
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  );
}

/* ======================================================================
   MAIN APP
   ====================================================================== */
export default function App() {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionStats, setSessionStats] = React.useState({ total_cases: 0, total_entities: 0 });

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/stats');
        const data = await res.json();
        setSessionStats(data);
      } catch {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    if (location.pathname.startsWith("/cases/")) return "Case Detail";
    return PAGE_TITLES[location.pathname] || "CyberIntel";
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: "#0D1117",
        overflow: "hidden",
      }}
    >
      {/* ============================================================
          SIDEBAR — fixed 220px, never collapses
          ============================================================ */}
      <aside
        style={{
          width: "220px",
          minWidth: "220px",
          background: "#010409",
          borderRight: "1px solid #21262D",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "20px 16px 16px",
            borderBottom: "1px solid #21262D",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Shield size={22} color="#00D9FF" />
            <div>
              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#00D9FF",
                  lineHeight: "1.2",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                CyberIntel
              </h1>
              <p
                style={{
                  fontSize: "11px",
                  color: "#8B949E",
                  lineHeight: "1.2",
                }}
              >
                Forensic Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: "16px 8px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            overflowY: "auto",
          }}
        >
          <p
            style={{
              padding: "4px 16px 8px",
              fontSize: "10px",
              fontWeight: "600",
              color: "#484F58",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            MAIN
          </p>
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" end />
          <SidebarLink to="/new-case" icon={FilePlus} label="New Case" />
          <SidebarLink to="/cases" icon={FolderOpen} label="Cases" />

          <div
            style={{
              margin: "12px 16px",
              borderTop: "1px solid #21262D",
            }}
          />

          <p
            style={{
              padding: "4px 16px 8px",
              fontSize: "10px",
              fontWeight: "600",
              color: "#484F58",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            SYSTEM
          </p>
          <SidebarLink to="/about" icon={Info} label="About" />
        </nav>

        {/* Bottom session stats */}
        <div style={{marginTop:'auto', padding:'16px', borderTop:'1px solid #21262D'}}>
          <div style={{fontSize:'10px', color:'#484F58', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px'}}>Session</div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'6px'}}>
            <span style={{fontSize:'12px', color:'#8B949E'}}>Cases processed</span>
            <span style={{fontSize:'12px', color:'#00D9FF', fontFamily:'JetBrains Mono, monospace', fontWeight:'600'}}>{sessionStats.total_cases}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px'}}>
            <span style={{fontSize:'12px', color:'#8B949E'}}>Entities extracted</span>
            <span style={{fontSize:'12px', color:'#8B5CF6', fontFamily:'JetBrains Mono, monospace', fontWeight:'600'}}>{sessionStats.total_entities}</span>
          </div>
          <div style={{height:'1px', background:'#21262D', marginBottom:'10px'}} />
          <div style={{fontSize:'10px', color:'#484F58', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px'}}>NER Engine</div>
          <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
            <div style={{width:'6px', height:'6px', borderRadius:'50%', background:'#2EA043'}} />
            <span style={{fontSize:'12px', color:'#8B949E'}}>Regex Pipeline — Active</span>
          </div>
        </div>
      </aside>

      {/* ============================================================
          MAIN CONTENT AREA
          ============================================================ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          background: "#0D1117",
          minWidth: 0,
        }}
      >
        {/* TOP BAR */}
        <header
          style={{
            borderBottom: "1px solid #21262D",
            padding: "12px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#010409",
            position: "sticky",
            top: 0,
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#E6EDF3",
            }}
          >
            {getPageTitle()}
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            {/* System online */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px",
                borderRadius: "20px",
                background: "rgba(46,160,67,0.1)",
                border: "1px solid rgba(46,160,67,0.2)",
              }}
            >
              <span
                style={{
                  position: "relative",
                  display: "inline-flex",
                  width: "8px",
                  height: "8px",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: "#2EA043",
                    animation: "pulse-dot 2s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    borderRadius: "50%",
                    width: "8px",
                    height: "8px",
                    background: "#2EA043",
                  }}
                />
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: "#2EA043",
                  fontWeight: "500",
                }}
              >
                System Online
              </span>
            </div>

            {/* Clock */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Activity size={14} color="#8B949E" />
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "JetBrains Mono, monospace",
                  color: "#8B949E",
                }}
              >
                {currentTime.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{ padding: "24px", flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new-case" element={<ComplaintForm />} />
            <Route path="/cases" element={<CaseList />} />
            <Route path="/cases/:caseId" element={<CaseDetail />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
