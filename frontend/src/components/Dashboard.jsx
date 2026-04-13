import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen,
  Cpu,
  Phone,
  CreditCard,
  AlertTriangle,
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
   ENTITY DISTRIBUTION CONFIG
   ====================================================================== */
const ENTITY_COLORS = {
  PHONE_NUMBER: '#1F6FEB',
  UPI_ID: '#8B5CF6',
  URL: '#D29922',
  TRANSACTION_ID: '#F0883E',
  AMOUNT: '#2EA043',
  DATE: '#00D9FF',
  BANK_ACCOUNT: '#F85149',
};

const ENTITY_LABELS = {
  PHONE_NUMBER: 'Phone Numbers',
  UPI_ID: 'UPI IDs',
  URL: 'URLs',
  TRANSACTION_ID: 'Transaction IDs',
  AMOUNT: 'Amounts',
  DATE: 'Dates',
  BANK_ACCOUNT: 'Bank Accounts',
};

/* ======================================================================
   DASHBOARD
   ====================================================================== */
export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entityStats, setEntityStats] = useState({});

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
          setEntityStats(statsData.by_type || {});
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setStats({ total_cases: 0, total_entities: 0, by_type: {} });
          setCases([]);
          setEntityStats({});
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
          ENTITY DISTRIBUTION + INVESTIGATION COVERAGE
          ============================================================ */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginTop:'16px'}}>
        {/* Card 1 — Entity Distribution */}
        <div style={{background:'#161B22', border:'1px solid #30363D', borderRadius:'6px', padding:'20px'}}>
          <div style={{marginBottom:'16px'}}>
            <span style={{color:'#E6EDF3', fontWeight:'600', fontSize:'14px'}}>Entity Distribution</span>
            <span style={{display:'block', color:'#8B949E', fontSize:'12px', marginTop:'2px'}}>Across all processed cases</span>
          </div>
          {Object.keys(entityStats).length === 0 ? (
            <div style={{color:'#484F58', fontSize:'13px', textAlign:'center', padding:'24px 0'}}>No cases processed yet</div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              {Object.entries(ENTITY_LABELS).map(([type, label]) => {
                const count = entityStats[type] || 0;
                const maxCount = Math.max(...Object.values(entityStats), 1);
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={type}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                      <span style={{fontSize:'12px', color:'#8B949E'}}>{label}</span>
                      <span style={{fontSize:'12px', color: ENTITY_COLORS[type], fontFamily:'JetBrains Mono, monospace', fontWeight:'600'}}>{count}</span>
                    </div>
                    <div style={{height:'4px', background:'#21262D', borderRadius:'2px', overflow:'hidden'}}>
                      <div style={{height:'100%', width:`${pct}%`, background: ENTITY_COLORS[type], borderRadius:'2px', transition:'width 0.6s ease', opacity: count === 0 ? 0.2 : 1}} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card 2 — Investigation Coverage */}
        <div style={{background:'#161B22', border:'1px solid #30363D', borderRadius:'6px', padding:'20px'}}>
          <div style={{marginBottom:'16px'}}>
            <span style={{color:'#E6EDF3', fontWeight:'600', fontSize:'14px'}}>Investigation Coverage</span>
            <span style={{display:'block', color:'#8B949E', fontSize:'12px', marginTop:'2px'}}>Supported complaint types</span>
          </div>

          <div style={{marginBottom:'16px'}}>
            <div style={{fontSize:'10px', color:'#484F58', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>Crime Categories</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
              {['UPI Fraud', 'Phishing', 'Identity Theft', 'Job Scam', 'Investment Fraud', 'Parcel Scam', 'KYC Fraud', 'Romance Scam'].map(type => (
                <span key={type} style={{padding:'3px 10px', background:'rgba(0,217,255,0.08)', border:'1px solid rgba(0,217,255,0.2)', borderRadius:'20px', fontSize:'11px', color:'#8B949E'}}>{type}</span>
              ))}
            </div>
          </div>

          <div style={{marginBottom:'16px'}}>
            <div style={{fontSize:'10px', color:'#484F58', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>Language Support</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
              {['English', 'Hinglish', 'Kannada-EN', 'Telugu-EN', 'Tamil-EN'].map(lang => (
                <span key={lang} style={{padding:'3px 10px', background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:'20px', fontSize:'11px', color:'#8B949E'}}>{lang}</span>
              ))}
            </div>
          </div>

          <div>
            <div style={{fontSize:'10px', color:'#484F58', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>Extracted Entity Types</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
              {['Phone Numbers', 'UPI IDs', 'URLs', 'Transaction IDs', 'Amounts (\u20B9)', 'Dates', 'Bank Accounts'].map(e => (
                <span key={e} style={{padding:'3px 10px', background:'rgba(46,160,67,0.08)', border:'1px solid rgba(46,160,67,0.2)', borderRadius:'20px', fontSize:'11px', color:'#8B949E'}}>{e}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
