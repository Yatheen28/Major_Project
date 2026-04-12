import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen,
  Cpu,
  Phone,
  CreditCard,
  Eye,
  ExternalLink,
  ShieldCheck,
  Database,
  Zap,
  Brain,
  GitBranch,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import { getStats, getCases } from "../api/client";

/* ======================================================================
   STAT CARD
   ====================================================================== */
const CARD_STYLES = [
  {
    gradient: "linear-gradient(135deg, #003D4F 0%, #001A22 100%)",
    glowColor: "rgba(0,217,255,0.12)",
    borderColor: "rgba(0,217,255,0.25)",
    accentColor: "#00D9FF",
    iconBg: "rgba(0,217,255,0.15)",
  },
  {
    gradient: "linear-gradient(135deg, #2D1B69 0%, #1C1033 100%)",
    glowColor: "rgba(139,92,246,0.12)",
    borderColor: "rgba(139,92,246,0.25)",
    accentColor: "#8B5CF6",
    iconBg: "rgba(139,92,246,0.15)",
  },
  {
    gradient: "linear-gradient(135deg, #0A2342 0%, #0D1117 100%)",
    glowColor: "rgba(31,111,235,0.10)",
    borderColor: "rgba(31,111,235,0.25)",
    accentColor: "#1F6FEB",
    iconBg: "rgba(31,111,235,0.15)",
  },
  {
    gradient: "linear-gradient(135deg, #0B3D1B 0%, #0D1117 100%)",
    glowColor: "rgba(46,160,67,0.10)",
    borderColor: "rgba(46,160,67,0.25)",
    accentColor: "#2EA043",
    iconBg: "rgba(46,160,67,0.15)",
  },
];

function StatCard({ icon: Icon, value, label, styleIdx, loading }) {
  const s = CARD_STYLES[styleIdx] || CARD_STYLES[0];

  return (
    <div
      className="relative rounded-xl p-5 border transition-transform duration-200 hover:scale-[1.02] group overflow-hidden"
      style={{
        background: s.gradient,
        borderColor: s.borderColor,
        boxShadow: `0 0 30px ${s.glowColor}`,
      }}
    >
      {/* Subtle top-right glow orb */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ background: s.accentColor }}
      />

      <div className="flex items-start justify-between relative">
        <div className="space-y-3">
          {loading ? (
            <>
              <div className="h-8 w-16 rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-text-primary tabular-nums">{value}</p>
              <p className="text-sm text-text-secondary">{label}</p>
            </>
          )}
        </div>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg"
          style={{ backgroundColor: s.iconBg }}
        >
          <Icon className="w-5 h-5" style={{ color: s.accentColor }} />
        </div>
      </div>
    </div>
  );
}

/* ======================================================================
   SKELETON ROW
   ====================================================================== */
function SkeletonRow() {
  return (
    <tr className="border-t border-border-muted">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-white/5 animate-pulse" style={{ width: `${50 + i * 15}%` }} />
        </td>
      ))}
    </tr>
  );
}

/* ======================================================================
   STATUS ITEM
   ====================================================================== */
function StatusItem({ icon, label, status, statusColor, active }) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
        active ? "bg-white/[0.02]" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-base">{icon}</span>
        <span className="text-sm text-text-primary">{label}</span>
      </div>
      <span
        className="text-xs font-medium px-2.5 py-1 rounded-full border"
        style={{
          color: statusColor,
          backgroundColor: `${statusColor}15`,
          borderColor: `${statusColor}30`,
        }}
      >
        {status}
      </span>
    </div>
  );
}

/* ======================================================================
   DASHBOARD
   ====================================================================== */
export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [statsData, casesData] = await Promise.all([getStats(), getCases()]);
        if (!cancelled) {
          setStats(statsData);
          setCases(casesData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          // Set fallback empty data so the UI still renders
          setStats({ total_cases: 0, total_entities: 0, by_type: {} });
          setCases([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const recentCases = cases ? cases.slice(0, 5) : [];

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-accent-orange/10 border border-accent-orange/30">
          <AlertTriangle className="w-4 h-4 text-accent-orange flex-shrink-0" />
          <p className="text-sm text-accent-orange">
            Backend unavailable — showing empty state. Start the API server to see live data.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={FolderOpen}
          value={stats?.total_cases ?? 0}
          label="Total Cases"
          styleIdx={0}
          loading={loading}
        />
        <StatCard
          icon={Cpu}
          value={stats?.total_entities ?? 0}
          label="Entities Extracted"
          styleIdx={1}
          loading={loading}
        />
        <StatCard
          icon={Phone}
          value={stats?.by_type?.PHONE_NUMBER ?? 0}
          label="Phone Numbers"
          styleIdx={2}
          loading={loading}
        />
        <StatCard
          icon={CreditCard}
          value={stats?.by_type?.UPI_ID ?? 0}
          label="UPI IDs"
          styleIdx={3}
          loading={loading}
        />
      </div>

      {/* Bottom grid: recent cases + system status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent cases table */}
        <div className="xl:col-span-2 bg-bg-card border border-border-default rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-muted">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-text-muted" />
              <h3 className="text-sm font-semibold text-text-primary">Recent Cases</h3>
            </div>
            {recentCases.length > 0 && (
              <button
                onClick={() => navigate("/cases")}
                className="text-xs text-accent-cyan hover:text-accent-cyan/80 flex items-center gap-1 transition-colors"
              >
                View all <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          {loading ? (
            <table className="w-full">
              <tbody>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </tbody>
            </table>
          ) : recentCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-border-muted flex items-center justify-center mb-4">
                <FolderOpen className="w-6 h-6 text-text-muted" />
              </div>
              <p className="text-sm text-text-secondary mb-1">No cases yet</p>
              <p className="text-xs text-text-muted">
                Submit a complaint to begin analysis
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-muted">
                  <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">
                    Case ID
                  </th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">
                    Submitted
                  </th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">
                    Entities
                  </th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((c) => {
                  const totalEntities = Object.values(c.entity_counts || {}).reduce(
                    (a, b) => a + b,
                    0
                  );
                  return (
                    <tr
                      key={c.case_id}
                      onClick={() => navigate(`/cases/${c.case_id}`)}
                      className="border-t border-border-muted hover:bg-bg-tertiary cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="font-mono text-sm text-accent-cyan">{c.case_id}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {new Date(c.submitted_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-text-secondary bg-bg-secondary px-2 py-1 rounded-md">
                          {totalEntities}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-accent-green bg-accent-green/10 border border-accent-green/25 rounded-full">
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cases/${c.case_id}`);
                          }}
                          className="p-1.5 rounded-md hover:bg-white/5 text-text-muted hover:text-accent-cyan transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* System status panel */}
        <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border-muted">
            <ShieldCheck className="w-4 h-4 text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary">System Status</h3>
          </div>

          <div className="p-4 space-y-1">
            <StatusItem
              icon="🔐"
              label="SHA-256 Hashing"
              status="Active"
              statusColor="#2EA043"
              active
            />
            <StatusItem
              icon="⚖️"
              label="BSA Section 63"
              status="Compliant"
              statusColor="#2EA043"
              active
            />
            <StatusItem
              icon="⚡"
              label="NER Engine"
              status="Regex v1.0"
              statusColor="#D29922"
              active
            />

            <div className="my-3 border-t border-border-muted" />

            <StatusItem
              icon="🧠"
              label="IndicBERT NER"
              status="Phase II"
              statusColor="#484F58"
              active={false}
            />
            <StatusItem
              icon="🔗"
              label="Neo4j Graph DB"
              status="Phase II"
              statusColor="#484F58"
              active={false}
            />
          </div>

          {/* Mini tech stack */}
          <div className="mx-4 mb-4 mt-2 p-3 rounded-lg bg-bg-secondary border border-border-muted">
            <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">
              Active Stack
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["FastAPI", "React 18", "Vite", "Tailwind", "SHA-256"].map((tech) => (
                <span
                  key={tech}
                  className="text-[11px] px-2 py-0.5 rounded bg-bg-tertiary text-text-secondary border border-border-muted"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
