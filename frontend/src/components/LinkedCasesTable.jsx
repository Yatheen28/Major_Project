import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link2, AlertTriangle, RefreshCw, Shield, Download } from "lucide-react";
import { getLinkedCases, getCertificateUrl } from "../api/client";

/* ======================================================================
   TYPE COLORS & LABELS — reused from CaseList.jsx per design.md
   ====================================================================== */
const TYPE_COLORS = {
  phone_number: { bg: "rgba(31,111,235,0.15)", border: "rgba(31,111,235,0.35)", text: "#1F6FEB" },
  upi_id: { bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.35)", text: "#8B5CF6" },
  url: { bg: "rgba(210,153,34,0.15)", border: "rgba(210,153,34,0.35)", text: "#D29922" },
  transaction_id: { bg: "rgba(0,217,255,0.1)", border: "rgba(0,217,255,0.25)", text: "#00D9FF" },
  bank_account: { bg: "rgba(248,81,73,0.15)", border: "rgba(248,81,73,0.35)", text: "#F85149" },
};

const TYPE_LABELS = {
  phone_number: "Phone",
  upi_id: "UPI",
  url: "URL",
  transaction_id: "TXN",
  bank_account: "Account",
};

const DEFAULT_COLOR = { bg: "rgba(139,148,158,0.15)", border: "rgba(139,148,158,0.35)", text: "#8B949E" };

/* ======================================================================
   RISK BADGE
   ====================================================================== */
function RiskBadge({ score }) {
  let color = "#2EA043";
  let label = "Low";
  if (score >= 60) {
    color = "#F85149";
    label = "High";
  } else if (score >= 30) {
    color = "#D29922";
    label = "Medium";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "10px",
        fontSize: "11px",
        fontWeight: "600",
        fontFamily: "JetBrains Mono, monospace",
        color,
        background: `${color}15`,
        border: `1px solid ${color}40`,
      }}
    >
      {score.toFixed(0)}
      <span style={{ fontSize: "9px", opacity: 0.7 }}>{label}</span>
    </span>
  );
}

/* ======================================================================
   LINKED CASES TABLE — Phase A4 per design.md
   ====================================================================== */
export default function LinkedCasesTable({ caseId }) {
  const navigate = useNavigate();
  const [links, setLinks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLinks() {
      try {
        setLoading(true);
        setError(null);
        const data = await getLinkedCases(caseId);
        if (!cancelled) setLinks(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLinks();
    return () => { cancelled = true; };
  }, [caseId]);

  /* Loading state */
  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <RefreshCw
          size={18}
          color="#00D9FF"
          style={{ animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  /* Error state */
  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 16px",
          background: "rgba(248,81,73,0.08)",
          border: "1px solid rgba(248,81,73,0.2)",
          borderRadius: "6px",
        }}
      >
        <AlertTriangle size={14} color="#F85149" />
        <span style={{ fontSize: "12px", color: "#F85149" }}>
          {error}
        </span>
      </div>
    );
  }

  const certUrl = getCertificateUrl(caseId);

  return (
    <div>
      {/* Header with certificate download */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link2 size={14} color="#00D9FF" />
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#E6EDF3" }}>
            Cross-Case Correlation
          </span>
          {links && links.length > 0 && (
            <span
              style={{
                fontSize: "11px",
                color: "#8B949E",
                background: "rgba(139,148,158,0.1)",
                padding: "1px 6px",
                borderRadius: "8px",
              }}
            >
              {links.length} link{links.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* BSA Certificate download */}
        <a
          href={certUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            fontSize: "11px",
            fontWeight: "500",
            color: "#2EA043",
            background: "rgba(46,160,67,0.1)",
            border: "1px solid rgba(46,160,67,0.25)",
            borderRadius: "4px",
            textDecoration: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Shield size={12} />
          BSA Certificate
          <Download size={10} />
        </a>
      </div>

      {/* Empty state */}
      {(!links || links.length === 0) && (
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            background: "#0D1117",
            border: "1px solid #21262D",
            borderRadius: "6px",
          }}
        >
          <Shield size={20} color="#30363D" style={{ marginBottom: "8px" }} />
          <p style={{ fontSize: "13px", color: "#484F58", margin: 0 }}>
            No cross-case links found for this complaint.
          </p>
          <p style={{ fontSize: "11px", color: "#30363D", marginTop: "4px" }}>
            Links appear when multiple cases share the same entity (phone, UPI, URL, etc.)
          </p>
        </div>
      )}

      {/* Table */}
      {links && links.length > 0 && (
        <div
          style={{
            background: "#0D1117",
            border: "1px solid #21262D",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #21262D",
                  background: "#161B22",
                }}
              >
                <th style={thStyle}>Linked Case</th>
                <th style={thStyle}>Shared Entity</th>
                <th style={thStyle}>Type</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link, idx) => {
                const color = TYPE_COLORS[link.shared_entity_type] || DEFAULT_COLOR;
                const label = TYPE_LABELS[link.shared_entity_type] || link.shared_entity_type;

                return (
                  <tr
                    key={`${link.case_id}-${link.shared_entity_value}-${idx}`}
                    style={{
                      borderBottom: "1px solid #21262D",
                      cursor: "pointer",
                      transition: "background 0.1s ease",
                    }}
                    onClick={() => navigate(`/cases/${link.case_id}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,217,255,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "12px",
                          color: "#00D9FF",
                          fontWeight: "600",
                        }}
                      >
                        {link.case_id}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "11px",
                          color: "#E6EDF3",
                        }}
                      >
                        {link.shared_entity_value}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "10px",
                          fontWeight: "600",
                          color: color.text,
                          background: color.bg,
                          border: `1px solid ${color.border}`,
                          textTransform: "uppercase",
                        }}
                      >
                        {label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <RiskBadge score={link.risk_score} />
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

/* ======================================================================
   TABLE STYLES
   ====================================================================== */
const thStyle = {
  padding: "8px 12px",
  textAlign: "left",
  fontSize: "10px",
  fontWeight: "600",
  color: "#484F58",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const tdStyle = {
  padding: "10px 12px",
  color: "#8B949E",
};
