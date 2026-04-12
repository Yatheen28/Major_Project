import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen,
  Cpu,
  Phone,
  CreditCard,
  AlertTriangle,
  Lock,
  Activity,
  Database,
  Zap,
  Brain,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { getStats, getCases } from "../api/client";

/* ======================================================================
   STAT CARD CONFIGS
   ====================================================================== */
const STAT_CARDS = [
  {
    key: "total_cases",
    label: "Total Cases",
    subtitle: "since session start",
    icon: FolderOpen,
    accentColor: "#00D9FF",
    gradient: "linear-gradient(90deg, #00D9FF, transparent)",
    getValue: (stats) => stats?.total_cases ?? 0,
  },
  {
    key: "total_entities",
    label: "Entities Extracted",
    subtitle: "across all cases",
    icon: Cpu,
    accentColor: "#8B5CF6",
    gradient: "linear-gradient(90deg, #8B5CF6, transparent)",
    getValue: (stats) => stats?.total_entities ?? 0,
  },
  {
    key: "phone_numbers",
    label: "Phone Numbers",
    subtitle: "detected",
    icon: Phone,
    accentColor: "#1F6FEB",
    gradient: "linear-gradient(90deg, #1F6FEB, transparent)",
    getValue: (stats) => stats?.by_type?.PHONE_NUMBER ?? 0,
  },
  {
    key: "upi_ids",
    label: "UPI IDs",
    subtitle: "identified",
    icon: CreditCard,
    accentColor: "#2EA043",
    gradient: "linear-gradient(90deg, #2EA043, transparent)",
    getValue: (stats) => stats?.by_type?.UPI_ID ?? 0,
  },
];

/* ======================================================================
   SYSTEM STATUS CONFIG
   ====================================================================== */
const STATUS_ITEMS = [
  {
    label: "SHA-256 Hashing",
    status: "Active",
    color: "#2EA043",
    icon: Lock,
  },
  {
    label: "BSA Section 63",
    status: "Compliant",
    color: "#2EA043",
    icon: Activity,
  },
  {
    label: "NER Engine",
    status: "Regex v1.0",
    color: "#D29922",
    icon: Zap,
  },
];

const PHASE_II_ITEMS = [
  {
    label: "IndicBERT NER",
    status: "Phase II",
    color: "#484F58",
    icon: Brain,
  },
  {
    label: "Neo4j Graph DB",
    status: "Phase II",
    color: "#484F58",
    icon: Database,
  },
];

const TECH_STACK = ["FastAPI", "React 18", "Vite", "Tailwind", "SHA-256"];

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
        const [statsData, casesData] = await Promise.all([
          getStats(),
          getCases(),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setCases(casesData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
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
    <div>
      {/* Error banner */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 16px",
            borderRadius: "6px",
            background: "rgba(210,153,34,0.1)",
            border: "1px solid rgba(210,153,34,0.3)",
            marginBottom: "20px",
          }}
        >
          <AlertTriangle size={16} color="#D29922" />
          <span style={{ fontSize: "13px", color: "#D29922" }}>
            Backend unavailable — showing empty state. Start the API server to
            see live data.
          </span>
        </div>
      )}

      {/* ============================================================
          STAT CARDS — 4 columns
          ============================================================ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            style={{
              background: "#161B22",
              border: "1px solid #30363D",
              borderRadius: "6px",
              padding: "20px",
              position: "relative",
              overflow: "hidden",
              transition: "border-color 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = card.accentColor + "60")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "#30363D")
            }
          >
            {/* Top accent bar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: card.gradient,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  color: "#8B949E",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {card.label}
              </span>
              <card.icon size={16} color={card.accentColor} />
            </div>
            {loading ? (
              <div
                style={{
                  height: "32px",
                  width: "60px",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.05)",
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#E6EDF3",
                  fontFamily: "JetBrains Mono, monospace",
                  marginBottom: "4px",
                  lineHeight: "1",
                }}
              >
                {card.getValue(stats)}
              </div>
            )}
            <div style={{ fontSize: "11px", color: "#484F58" }}>
              {card.subtitle}
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================
          RECENT CASES TABLE
          ============================================================ */}
      <div
        style={{
          background: "#161B22",
          border: "1px solid #30363D",
          borderRadius: "6px",
          marginBottom: "24px",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #21262D",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#E6EDF3", fontWeight: "600", fontSize: "14px" }}>
            Recent Cases
          </span>
          <span style={{ color: "#8B949E", fontSize: "12px" }}>
            {cases ? cases.length : 0} total
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <RefreshCw
              size={20}
              color="#484F58"
              style={{ margin: "0 auto 8px", animation: "spin 1s linear infinite" }}
            />
            <p style={{ fontSize: "13px", color: "#484F58" }}>Loading cases...</p>
          </div>
        ) : recentCases.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <FolderOpen
              size={32}
              color="#484F58"
              style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }}
            />
            <p style={{ fontSize: "14px", color: "#8B949E", marginBottom: "4px" }}>
              No cases yet
            </p>
            <p style={{ fontSize: "12px", color: "#484F58" }}>
              Submit a complaint to begin analysis
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #21262D" }}>
                {["Case ID", "Submitted", "Entities", "Status", "Action"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 20px",
                        textAlign: "left",
                        color: "#8B949E",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: "500",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {recentCases.map((c) => {
                const totalEntities = Object.values(
                  c.entity_counts || {}
                ).reduce((a, b) => a + b, 0);
                return (
                  <tr
                    key={c.case_id}
                    style={{
                      borderBottom: "1px solid #21262D",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#1C2128")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() => navigate(`/cases/${c.case_id}`)}
                  >
                    <td
                      style={{
                        padding: "12px 20px",
                        fontFamily: "JetBrains Mono, monospace",
                        color: "#00D9FF",
                        fontSize: "13px",
                      }}
                    >
                      {c.case_id}
                    </td>
                    <td
                      style={{
                        padding: "12px 20px",
                        fontSize: "13px",
                        color: "#8B949E",
                      }}
                    >
                      {new Date(c.submitted_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <span
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "13px",
                          color: "#E6EDF3",
                        }}
                      >
                        {totalEntities}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <span
                        style={{
                          padding: "2px 10px",
                          background: "rgba(46,160,67,0.15)",
                          border: "1px solid rgba(46,160,67,0.3)",
                          borderRadius: "20px",
                          fontSize: "11px",
                          color: "#2EA043",
                          fontWeight: "600",
                        }}
                      >
                        {c.status || "PROCESSED"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/cases/${c.case_id}`);
                        }}
                        style={{
                          padding: "6px 14px",
                          background: "rgba(0,217,255,0.08)",
                          border: "1px solid rgba(0,217,255,0.2)",
                          borderRadius: "4px",
                          color: "#00D9FF",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        View <ArrowRight size={11} style={{ display: "inline", marginLeft: "2px", verticalAlign: "middle" }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ============================================================
          SYSTEM STATUS
          ============================================================ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        {/* Left: Module status */}
        <div
          style={{
            background: "#161B22",
            border: "1px solid #30363D",
            borderRadius: "6px",
            padding: "20px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#E6EDF3",
              marginBottom: "16px",
            }}
          >
            System Status
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {STATUS_ITEMS.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: item.color,
                      display: "inline-block",
                    }}
                  />
                  <item.icon size={14} color="#8B949E" />
                  <span style={{ fontSize: "13px", color: "#E6EDF3" }}>
                    {item.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: item.color,
                    padding: "2px 10px",
                    borderRadius: "20px",
                    border: `1px solid ${item.color}40`,
                    background: `${item.color}15`,
                  }}
                >
                  {item.status}
                </span>
              </div>
            ))}

            <div
              style={{
                borderTop: "1px solid #21262D",
                margin: "4px 0",
              }}
            />

            {PHASE_II_ITEMS.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  opacity: 0.6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: item.color,
                      display: "inline-block",
                    }}
                  />
                  <item.icon size={14} color="#484F58" />
                  <span style={{ fontSize: "13px", color: "#484F58" }}>
                    {item.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: item.color,
                    padding: "2px 10px",
                    borderRadius: "20px",
                    border: `1px solid ${item.color}40`,
                    background: `${item.color}15`,
                  }}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active stack */}
        <div
          style={{
            background: "#161B22",
            border: "1px solid #30363D",
            borderRadius: "6px",
            padding: "20px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#E6EDF3",
              marginBottom: "16px",
            }}
          >
            Active Stack
          </h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {TECH_STACK.map((tech) => (
              <span
                key={tech}
                style={{
                  fontSize: "12px",
                  padding: "6px 14px",
                  borderRadius: "4px",
                  background: "#0D1117",
                  border: "1px solid #30363D",
                  color: "#8B949E",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Architecture info */}
          <div style={{ marginTop: "20px" }}>
            <p
              style={{
                fontSize: "11px",
                color: "#484F58",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "10px",
                fontWeight: "600",
              }}
            >
              Architecture
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {[
                { label: "NER Engine", value: "Compiled Regex (7 types)" },
                { label: "Evidence Hash", value: "SHA-256 (hashlib)" },
                { label: "Storage", value: "In-memory (Thread-safe)" },
                { label: "API", value: "FastAPI + Uvicorn" },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#8B949E" }}>
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#E6EDF3",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
