import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  FilePlus,
  FolderOpen,
  Info,
  Zap,
  Activity,
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
   ABOUT PAGE (inline — small enough to co-locate)
   ====================================================================== */
function About() {
  const team = [
    { name: "Sahil S Puthran", usn: "4SO23CD046" },
    { name: "Shashank", usn: "4SO23CD049" },
    { name: "Swasthik Shetty", usn: "4SO23CD056" },
    { name: "Yatheen Shetty B", usn: "4SO23CD063" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 border border-accent-cyan/30 mb-2">
          <Shield className="w-8 h-8 text-accent-cyan" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary">CyberIntel</h1>
        <p className="text-text-secondary text-lg">
          AI-Assisted Cybercrime Investigation &amp; Forensic Intelligence System
        </p>
        <span className="inline-block px-3 py-1 text-xs font-mono rounded-full bg-accent-purple/15 text-accent-purple border border-accent-purple/30">
          Phase I — Major Project
        </span>
      </div>

      {/* Description */}
      <div className="bg-bg-card border border-border-default rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Project Overview</h2>
        <p className="text-text-secondary leading-relaxed">
          CyberIntel is a forensic intelligence platform designed for Indian law enforcement
          to analyze cybercrime complaints. Using NLP-based entity extraction, SHA-256
          evidence hashing compliant with BSA 2023 Section 63 Part B, and chronological
          timeline reconstruction, the system transforms unstructured Hinglish complaint
          narratives into structured, court-admissible investigative data.
        </p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-bg-secondary rounded-lg p-3 border border-border-muted">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Phase I</p>
            <p className="text-sm text-accent-green font-medium">Regex NER Pipeline</p>
          </div>
          <div className="bg-bg-secondary rounded-lg p-3 border border-border-muted">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Phase II</p>
            <p className="text-sm text-text-muted font-medium">IndicBERT + Neo4j</p>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="bg-bg-card border border-border-default rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Project Team</h2>
        <div className="space-y-3">
          {team.map((member) => (
            <div
              key={member.usn}
              className="flex items-center justify-between bg-bg-secondary rounded-lg px-4 py-3 border border-border-muted"
            >
              <span className="text-text-primary font-medium">{member.name}</span>
              <span className="font-mono text-xs text-accent-cyan">{member.usn}</span>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-border-muted">
          <p className="text-sm text-text-secondary">
            <span className="text-text-muted">Guide:</span>{" "}
            <span className="text-text-primary font-medium">Tejas Raghu Pujari</span>
          </p>
          <p className="text-sm text-text-secondary mt-1">
            <span className="text-text-muted">Institution:</span>{" "}
            <span className="text-text-primary">
              St Joseph Engineering College, Mangaluru
            </span>
          </p>
          <p className="text-sm text-text-secondary mt-1">
            <span className="text-text-muted">Programme:</span>{" "}
            <span className="text-text-primary">BE CSE (Data Science)</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ======================================================================
   CASE DETAIL WRAPPER
   ====================================================================== */
function CaseDetailWrapper() {
  return <CaseDetail />;
}

/* ======================================================================
   NAV ITEM
   ====================================================================== */
function SidebarLink({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-4 py-2.5 rounded-r-lg text-sm font-medium transition-all duration-200 relative ${
          isActive
            ? "text-accent-cyan bg-accent-cyan/8 border-l-2 border-accent-cyan"
            : "text-text-secondary hover:text-text-primary hover:bg-white/[0.03] border-l-2 border-transparent"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-cyan rounded-r blur-[3px]" />
          )}
          <Icon
            className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
              isActive ? "text-accent-cyan" : "text-text-muted group-hover:text-text-secondary"
            }`}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

/* ======================================================================
   MAIN APP
   ====================================================================== */
export default function App() {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Resolve page title from current path
  const getPageTitle = () => {
    if (location.pathname.startsWith("/cases/")) {
      return "Case Detail";
    }
    return PAGE_TITLES[location.pathname] || "CyberIntel";
  };

  return (
    <div className="flex min-h-screen bg-bg-primary">
      {/* ============================================================
          SIDEBAR — fixed 240px
          ============================================================ */}
      <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-bg-secondary border-r border-border-default flex flex-col z-50">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-border-muted">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 border border-accent-cyan/30">
              <Shield className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-text-primary tracking-tight">
                CyberIntel
              </h1>
              <p className="text-[10px] text-text-muted uppercase tracking-widest">
                Forensic Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          <p className="px-4 pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
            Main
          </p>
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" end />
          <SidebarLink to="/new-case" icon={FilePlus} label="New Case" />
          <SidebarLink to="/cases" icon={FolderOpen} label="Cases" />

          <div className="my-4 mx-4 border-t border-border-muted" />

          <p className="px-4 pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
            System
          </p>
          <SidebarLink to="/about" icon={Info} label="About" />
        </nav>

        {/* Bottom phase indicator */}
        <div className="px-4 py-4 border-t border-border-muted space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-cyan/8 border border-accent-cyan/20">
            <Zap className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="text-[11px] font-medium text-accent-cyan">
              Phase I — Regex NER
            </span>
          </div>
          <p className="text-[10px] text-text-muted px-1 leading-relaxed">
            Phase II: IndicBERT + Neo4j
          </p>
        </div>
      </aside>

      {/* ============================================================
          MAIN CONTENT
          ============================================================ */}
      <main className="ml-[240px] flex-1 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-14 bg-bg-primary/80 backdrop-blur-xl border-b border-border-muted flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-text-primary">{getPageTitle()}</h2>

          <div className="flex items-center gap-4">
            {/* System online indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green" />
              </span>
              <span className="text-xs text-accent-green font-medium">System Online</span>
            </div>

            {/* Clock */}
            <div className="flex items-center gap-2 text-text-secondary">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-xs font-mono">
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

        {/* Page content */}
        <div className="p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new-case" element={<ComplaintForm />} />
            <Route path="/cases" element={<CaseList />} />
            <Route path="/cases/:caseId" element={<CaseDetailWrapper />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
