import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Eye, Loader2, AlertTriangle } from "lucide-react";

import { getCases } from "../api/client";

/* ======================================================================
   ENTITY TYPE COLORS (mini version for inline pills)
   ====================================================================== */
const TYPE_COLORS = {
  PHONE_NUMBER: { bg: "rgba(31,111,235,0.15)", border: "rgba(31,111,235,0.35)", text: "#1F6FEB" },
  UPI_ID: { bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.35)", text: "#8B5CF6" },
  URL: { bg: "rgba(210,153,34,0.15)", border: "rgba(210,153,34,0.35)", text: "#D29922" },
  TRANSACTION_ID: { bg: "rgba(0,217,255,0.1)", border: "rgba(0,217,255,0.25)", text: "#00D9FF" },
  AMOUNT: { bg: "rgba(46,160,67,0.15)", border: "rgba(46,160,67,0.35)", text: "#2EA043" },
  DATE: { bg: "rgba(0,217,255,0.08)", border: "rgba(0,217,255,0.18)", text: "#7ECFDD" },
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
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-primary">Investigation Cases</h1>
          <span className="px-2.5 py-1 text-xs font-mono font-medium text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 rounded-full">
            {cases?.length ?? 0}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-accent-orange/10 border border-accent-orange/30">
          <AlertTriangle className="w-4 h-4 text-accent-orange flex-shrink-0" />
          <p className="text-sm text-accent-orange">
            Backend unavailable — start the API server to load cases.
          </p>
        </div>
      )}

      {/* Empty state */}
      {cases && cases.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border-default flex items-center justify-center mb-5">
            <FolderOpen className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">No cases found</h3>
          <p className="text-sm text-text-muted max-w-sm">
            Submit a cybercrime complaint through the &ldquo;New Case&rdquo; page to begin
            forensic analysis.
          </p>
        </div>
      ) : (
        /* Table */
        <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-muted">
                <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-5 py-3">
                  Case ID
                </th>
                <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-3">
                  Submitted
                </th>
                <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-3">
                  Entities
                </th>
                <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-3">
                  Types
                </th>
                <th className="text-left text-[11px] font-medium text-text-muted uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-right text-[11px] font-medium text-text-muted uppercase tracking-wider px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {(cases || []).map((c) => {
                const totalEntities = Object.values(c.entity_counts || {}).reduce(
                  (a, b) => a + b,
                  0
                );
                // Get top 3 entity types
                const topTypes = Object.entries(c.entity_counts || {})
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3);

                const formattedDate = (() => {
                  try {
                    return new Date(c.submitted_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }) +
                      " " +
                      new Date(c.submitted_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZone: "UTC",
                      }) +
                      " UTC";
                  } catch {
                    return c.submitted_at;
                  }
                })();

                return (
                  <tr
                    key={c.case_id}
                    onClick={() => navigate(`/cases/${c.case_id}`)}
                    className="border-t border-border-muted hover:bg-bg-tertiary cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm text-accent-cyan group-hover:underline underline-offset-2">
                        {c.case_id}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-text-secondary">
                      {formattedDate}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-text-secondary bg-bg-secondary px-2 py-1 rounded-md">
                        {totalEntities}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {topTypes.map(([type]) => {
                          const color = TYPE_COLORS[type] || {
                            bg: "rgba(255,255,255,0.05)",
                            border: "rgba(255,255,255,0.1)",
                            text: "#E6EDF3",
                          };
                          return (
                            <span
                              key={type}
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded border"
                              style={{
                                backgroundColor: color.bg,
                                borderColor: color.border,
                                color: color.text,
                              }}
                            >
                              {TYPE_LABELS[type] || type}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium text-accent-green bg-accent-green/10 border border-accent-green/25 rounded-full">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
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
        </div>
      )}
    </div>
  );
}
