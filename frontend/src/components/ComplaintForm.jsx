import React, { useState } from "react";
import {
  FilePlus,
  LoaderCircle,
  AlertTriangle,
  Lock,
  User,
  FileText,
} from "lucide-react";

import { ingestComplaint } from "../api/client";
import EntityDisplay from "./EntityDisplay";
import TimelineView from "./TimelineView";
import HashDisplay from "./HashDisplay";

/* ======================================================================
   COMPLAINT FORM — Two-column layout
   ====================================================================== */
export default function ComplaintForm() {
  const [text, setText] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("entities");
  const [officerFocused, setOfficerFocused] = useState(false);
  const [textFocused, setTextFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (text.trim().length < 20) {
      setError("Complaint text must be at least 20 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const caseData = await ingestComplaint(
        text.trim(),
        submittedBy.trim() || "investigator"
      );
      setResult(caseData);
    } catch (err) {
      setError(
        err.message || "Failed to process complaint. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setSubmittedBy("");
    setError(null);
    setResult(null);
    setActiveTab("entities");
  };

  const canSubmit = text.trim().length >= 20 && !loading;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: result ? "1fr 1fr" : "1fr",
        gap: "24px",
        alignItems: "start",
      }}
    >
      {/* ============================================================
          LEFT — FORM PANEL
          ============================================================ */}
      <div
        style={{
          background: "#161B22",
          border: "1px solid #30363D",
          borderRadius: "6px",
          padding: "24px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <FilePlus size={20} color="#00D9FF" />
          <div>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#E6EDF3",
              }}
            >
              New Investigation Case
            </h2>
            <p style={{ fontSize: "12px", color: "#8B949E" }}>
              Paste a cybercrime complaint for NER analysis
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Officer input */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: "500",
                color: "#8B949E",
                marginBottom: "6px",
              }}
            >
              <User size={13} />
              Investigating Officer
            </label>
            <input
              type="text"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              onFocus={() => setOfficerFocused(true)}
              onBlur={() => setOfficerFocused(false)}
              placeholder="Name or badge ID (optional)"
              style={{
                width: "100%",
                background: "#0D1117",
                border: `1px solid ${officerFocused ? "#00D9FF" : "#30363D"}`,
                borderRadius: "4px",
                padding: "10px 12px",
                color: "#E6EDF3",
                fontSize: "14px",
                outline: "none",
                fontFamily: "Inter, sans-serif",
                transition: "border-color 0.15s ease",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Textarea */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: "500",
                color: "#8B949E",
                marginBottom: "6px",
              }}
            >
              <FileText size={13} />
              Complaint Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setTextFocused(true)}
              onBlur={() => setTextFocused(false)}
              placeholder={'Paste the cybercrime complaint here...\n\nExample: "Mujhe 15/03/2024 ko ek call aaya number 9876543210 se. Unhone bola aapka KYC expire ho gaya hai..."'}
              style={{
                width: "100%",
                minHeight: "300px",
                background: "#0D1117",
                border: `1px solid ${textFocused ? "#00D9FF" : "#30363D"}`,
                borderRadius: "4px",
                padding: "12px",
                color: "#E6EDF3",
                fontSize: "14px",
                fontFamily: "Inter, sans-serif",
                resize: "vertical",
                outline: "none",
                lineHeight: "1.6",
                transition: "border-color 0.15s ease",
                boxSizing: "border-box",
              }}
            />
            {/* Character count */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "6px",
              }}
            >
              <span style={{ fontSize: "11px", color: "#D29922" }}>
                {text.length > 0 && text.length < 20
                  ? "Minimum 20 characters required"
                  : ""}
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: text.length >= 20 ? "#2EA043" : "#8B949E",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {text.length} chars
              </span>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                background: "rgba(248,81,73,0.1)",
                border: "1px solid rgba(248,81,73,0.3)",
                borderRadius: "4px",
                marginBottom: "16px",
              }}
            >
              <AlertTriangle size={14} color="#F85149" />
              <span style={{ fontSize: "13px", color: "#F85149" }}>
                {error}
              </span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: "100%",
              padding: "12px",
              background: loading
                ? "#1C2128"
                : "linear-gradient(135deg, #0A4A52, #003D4F)",
              border: "1px solid #00D9FF",
              borderRadius: "4px",
              color: "#00D9FF",
              fontSize: "14px",
              fontWeight: "600",
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              letterSpacing: "0.02em",
              fontFamily: "Inter, sans-serif",
              transition: "opacity 0.15s ease",
            }}
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Analyzing...
              </>
            ) : (
              "Analyze Complaint \u2192"
            )}
          </button>

          {/* Clear button */}
          {result && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                width: "100%",
                padding: "10px",
                background: "transparent",
                border: "1px solid #30363D",
                borderRadius: "4px",
                color: "#8B949E",
                fontSize: "13px",
                cursor: "pointer",
                marginTop: "8px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Clear & New Case
            </button>
          )}
        </form>

        {/* BSA info strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "16px",
            padding: "10px 12px",
            background: "rgba(0,217,255,0.05)",
            border: "1px solid rgba(0,217,255,0.2)",
            borderRadius: "4px",
          }}
        >
          <Lock size={12} color="#00D9FF" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "#8B949E" }}>
            SHA-256 hash computed at ingestion — BSA 2023 Section 63 Part B
            compliant
          </span>
        </div>
      </div>

      {/* ============================================================
          RIGHT — RESULTS PANEL (only when result exists)
          ============================================================ */}
      {result && (
        <div>
          {/* Hash certificate */}
          <HashDisplay
            caseId={result.case_id}
            sha256Hash={result.sha256_hash}
            submittedAt={result.submitted_at}
            submittedBy={result.submitted_by}
          />

          {/* Entity / Timeline tabs */}
          <div
            style={{
              background: "#161B22",
              border: "1px solid #30363D",
              borderRadius: "6px",
              overflow: "hidden",
              marginTop: "16px",
            }}
          >
            {/* Tab bar */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #21262D",
              }}
            >
              {["entities", "timeline"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 20px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: activeTab === tab ? "#00D9FF" : "#484F58",
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      activeTab === tab
                        ? "2px solid #00D9FF"
                        : "2px solid transparent",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    fontFamily: "Inter, sans-serif",
                    transition: "color 0.15s ease",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: "20px" }}>
              {activeTab === "entities" ? (
                <EntityDisplay
                  entities={result.entities}
                  entityCounts={result.entity_counts}
                />
              ) : (
                <TimelineView timeline={result.timeline} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
