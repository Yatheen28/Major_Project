import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

import { getCases } from "../api/client";

/* ======================================================================
   ENTITY TYPE COLORS & LABELS
   ====================================================================== */
const TYPE_COLORS = {
  PHONE_NUMBER: { bg: "rgba(31,111,235,0.15)", border: "rgba(31,111,235,0.35)", text: "#1F6FEB" },
  UPI_ID: { bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.35)", text: "#8B5CF6" },
  URL: { bg: "rgba(210,153,34,0.15)", border: "rgba(210,153,34,0.35)", text: "#D29922" },
  TRANSACTION_ID: { bg: "rgba(0,217,255,0.1)", border: "rgba(0,217,255,0.25)", text: "#00D9FF" },
  AMOUNT: { bg: "rgba(46,160,67,0.15)", border: "rgba(46,160,67,0.35)", text: "#2EA043" },
  DATE: { bg: "rgba(0,217,255,0.08)", border: "rgba(0,217,255,0.18)", text: "#00D9FF" },
  BANK_ACCOUNT: { bg: "rgba(248,81,73,0.15)", border: "rgba(248,81,73,0.35)", text: "#F85149" },
};

const TYPE_LABELS = {
  PHONE_NUMBER: "Phone",
  UPI_ID: "UPI",
  URL: "URL",
  TRANSACTION_ID: "TXN",
  AMOUNT: "Amount",
  DATE: "Date",
  BANK_ACCOUNT: "Account",
};

/* ======================================================================
   CASE LIST
   ====================================================================== */
export default function CaseList() {
  const navigate = useNavigate();
  const [cases, setCases] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCases() {
      try {
        const data = await getCases();
        if (!cancelled) setCases(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setCases([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCases();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "96px 0",
        }}
      >
        <RefreshCw
          size={24}
          color="#00D9FF"
          style={{ animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#E6EDF3",
          }}
        >
          Investigation Cases
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            background: "#161B22",
            border: "1px solid #30363D",
            borderRadius: "4px",
          }}
        >
          <span style={{ fontSize: "13px", color: "#8B949E" }}>
            {cases ? cases.length : 0} cases
          </span>
        </div>
      </div>

      {/* Error */}
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
            marginBottom: "16px",
          }}
        >
          <AlertTriangle size={16} color="#D29922" />
          <span style={{ fontSize: "13px", color: "#D29922" }}>
            Backend unavailable — start the API server to load cases.
          </span>
        </div>
      )}

      {/* Empty state or table */}
      {cases && cases.length === 0 ? (
        <div
          style={{
            background: "#161B22",
            border: "1px solid #30363D",
            borderRadius: "6px",
            padding: "64px 24px",
            textAlign: "center",
          }}
        >
          <FolderOpen
            size={40}
            color="#484F58"
            style={{ margin: "0 auto 16px", display: "block", opacity: 0.4 }}
          />
          <p
            style={{
              color: "#8B949E",
              fontSize: "15px",
              marginBottom: "8px",
            }}
          >
            No cases submitted yet
          </p>
          <p
            style={{
              color: "#484F58",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            Submit a complaint through New Case to begin forensic analysis
          </p>
          <button
            onClick={() => navigate("/new-case")}
            style={{
              padding: "8px 20px",
              background: "rgba(0,217,255,0.1)",
              border: "1px solid rgba(0,217,255,0.25)",
              borderRadius: "4px",
              color: "#00D9FF",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Submit First Case <ArrowRight size={12} style={{ display: "inline", verticalAlign: "middle", marginLeft: "2px" }} />
          </button>
        </div>
      ) : (
        <div
          style={{
            background: "#161B22",
            border: "1px solid #30363D",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0D1117" }}>
                {[
                  "Case ID",
                  "Submitted",
                  "Officer",
                  "Entities",
                  "Top Types",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 20px",
                      textAlign: "left",
                      color: "#8B949E",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: "500",
                      borderBottom: "1px solid #30363D",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(cases || []).map((c) => {
                const totalEntities = Object.values(
                  c.entity_counts || {}
                ).reduce((a, b) => a + b, 0);

                const topTypes = Object.entries(c.entity_counts || {})
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3);

                return (
                  <tr
                    key={c.case_id}
                    onClick={() => navigate(`/cases/${c.case_id}`)}
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
                  >
                    <td
                      style={{
                        padding: "14px 20px",
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "13px",
                        color: "#00D9FF",
                      }}
                    >
                      {c.case_id}
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: "13px",
                        color: "#8B949E",
                      }}
                    >
                      {new Date(c.submitted_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: "13px",
                        color: "#8B949E",
                      }}
                    >
                      {c.submitted_by || "investigator"}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
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
                    <td style={{ padding: "14px 20px" }}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                        }}
                      >
                        {topTypes.map(([type]) => {
                          const color = TYPE_COLORS[type] || {
                            bg: "rgba(255,255,255,0.05)",
                            border: "rgba(255,255,255,0.1)",
                            text: "#E6EDF3",
                          };
                          return (
                            <span
                              key={type}
                              style={{
                                fontSize: "10px",
                                fontWeight: "500",
                                padding: "1px 8px",
                                borderRadius: "4px",
                                border: `1px solid ${color.border}`,
                                background: color.bg,
                                color: color.text,
                              }}
                            >
                              {TYPE_LABELS[type] || type}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
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
                    <td style={{ padding: "14px 20px" }}>
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
                        View <ArrowRight size={11} style={{ display: "inline", verticalAlign: "middle", marginLeft: "2px" }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
