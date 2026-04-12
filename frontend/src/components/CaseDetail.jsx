import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  FileText,
} from "lucide-react";

import { getCase } from "../api/client";
import HashDisplay from "./HashDisplay";
import EntityDisplay from "./EntityDisplay";
import TimelineView from "./TimelineView";

/* ======================================================================
   CASE DETAIL
   ====================================================================== */
export default function CaseDetail() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("entities");

  useEffect(() => {
    let cancelled = false;

    async function fetchCase() {
      try {
        const data = await getCase(caseId);
        if (!cancelled) setCaseData(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCase();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

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

  if (error) {
    return (
      <div style={{ maxWidth: "480px", margin: "48px auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "6px",
            background: "rgba(248,81,73,0.1)",
            border: "1px solid rgba(248,81,73,0.3)",
            marginBottom: "16px",
          }}
        >
          <AlertTriangle
            size={16}
            color="#F85149"
            style={{ flexShrink: 0, marginTop: "1px" }}
          />
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#F85149",
                marginBottom: "4px",
              }}
            >
              Failed to load case
            </p>
            <p style={{ fontSize: "12px", color: "#484F58" }}>{error}</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/cases")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "#00D9FF",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <ArrowLeft size={14} />
          Back to cases
        </button>
      </div>
    );
  }

  if (!caseData) return null;

  const totalEntities = Object.values(caseData.entity_counts || {}).reduce(
    (a, b) => a + b,
    0
  );

  const tabs = [
    { id: "entities", label: "Entities" },
    { id: "timeline", label: "Timeline" },
    { id: "raw", label: "Raw Text" },
  ];

  return (
    <div>
      {/* Back + header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={() => navigate("/cases")}
          style={{
            padding: "8px",
            background: "transparent",
            border: "1px solid #30363D",
            borderRadius: "4px",
            color: "#8B949E",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#E6EDF3",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {caseData.case_id}
          </h1>
          <p style={{ fontSize: "12px", color: "#484F58" }}>
            {totalEntities} entities extracted &middot;{" "}
            {caseData.timeline?.length || 0} timeline events
          </p>
        </div>
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
          {caseData.status || "PROCESSED"}
        </span>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Left — hash + case info */}
        <div>
          <HashDisplay
            caseId={caseData.case_id}
            sha256Hash={caseData.sha256_hash}
            submittedAt={caseData.submitted_at}
            submittedBy={caseData.submitted_by}
          />
        </div>

        {/* Right — entities / timeline / raw text */}
        <div
          style={{
            background: "#161B22",
            border: "1px solid #30363D",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #21262D",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: activeTab === tab.id ? "#00D9FF" : "#484F58",
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    activeTab === tab.id
                      ? "2px solid #00D9FF"
                      : "2px solid transparent",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "color 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: "20px" }}>
            {activeTab === "entities" && (
              <EntityDisplay
                entities={caseData.entities}
                entityCounts={caseData.entity_counts}
              />
            )}
            {activeTab === "timeline" && (
              <TimelineView timeline={caseData.timeline} />
            )}
            {activeTab === "raw" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <FileText size={14} color="#484F58" />
                  <span style={{ fontSize: "13px", color: "#484F58" }}>
                    Original complaint text
                  </span>
                </div>
                <div
                  style={{
                    background: "#0D1117",
                    border: "1px solid #21262D",
                    borderRadius: "4px",
                    padding: "16px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#E6EDF3",
                      lineHeight: "1.7",
                      whiteSpace: "pre-wrap",
                      margin: 0,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {caseData.raw_text}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
