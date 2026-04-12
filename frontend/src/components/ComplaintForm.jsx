import React, { useState } from "react";
import {
  FilePlus,
  Loader2,
  AlertCircle,
  Lock,
  Send,
  User,
  FileText,
} from "lucide-react";

import { ingestComplaint } from "../api/client";
import EntityDisplay from "./EntityDisplay";
import TimelineView from "./TimelineView";
import HashDisplay from "./HashDisplay";

/* ======================================================================
   TAB BAR
   ====================================================================== */
function TabBar({ active, onChange }) {
  const tabs = [
    { id: "entities", label: "Entities" },
    { id: "timeline", label: "Timeline" },
  ];

  return (
    <div className="flex border-b border-border-muted">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
            active === tab.id
              ? "text-accent-cyan"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          {tab.label}
          {active === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-cyan rounded-t" />
          )}
        </button>
      ))}
    </div>
  );
}

/* ======================================================================
   COMPLAINT FORM
   ====================================================================== */
export default function ComplaintForm() {
  const [text, setText] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("entities");

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
      setError(err.message || "Failed to process complaint. Is the backend running?");
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* ============================================================
          LEFT — SUBMISSION PANEL
          ============================================================ */}
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-purple/15 border border-accent-purple/30">
            <FilePlus className="w-5 h-5 text-accent-purple" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              New Investigation Case
            </h2>
            <p className="text-xs text-text-muted">
              Paste a cybercrime complaint for NER analysis
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Officer / badge input */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <User className="w-3.5 h-3.5" />
              Investigating Officer
            </label>
            <input
              type="text"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              placeholder="Name or badge ID (optional)"
              className="w-full px-4 py-2.5 rounded-lg bg-bg-secondary border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-colors"
            />
          </div>

          {/* Complaint textarea */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <FileText className="w-3.5 h-3.5" />
              Complaint Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder={`Paste the cybercrime complaint here...\n\nExample: "Mujhe 15/03/2024 ko ek call aaya number 9876543210 se. Unhone bola aapka KYC expire ho gaya hai aur mujhse UPI se ₹25,000 transfer karwa liye..."`}
              className="w-full px-4 py-3 rounded-lg bg-bg-secondary border border-border-default text-text-primary text-sm leading-relaxed placeholder:text-text-muted/60 focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-colors resize-none font-sans"
            />
            {/* Character count */}
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-text-muted">
                {text.length < 20 && text.length > 0 && (
                  <span className="text-accent-orange">
                    Minimum 20 characters required
                  </span>
                )}
              </p>
              <p
                className={`text-[11px] font-mono ${
                  text.length >= 20 ? "text-accent-green" : "text-text-muted"
                }`}
              >
                {text.length} chars
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading || text.trim().length < 20}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent-cyan text-bg-primary text-sm font-semibold hover:bg-accent-cyan/90 focus:outline-none focus:ring-2 focus:ring-accent-cyan/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Analyze Complaint
                </>
              )}
            </button>

            {result && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 rounded-lg border border-border-default text-text-secondary text-sm hover:bg-white/[0.03] transition-colors"
              >
                Clear & New
              </button>
            )}
          </div>
        </form>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-accent-red/10 border border-accent-red/30">
            <AlertCircle className="w-4 h-4 text-accent-red mt-0.5 flex-shrink-0" />
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}

        {/* BSA compliance callout */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-accent-cyan/5 border border-accent-cyan/15">
          <Lock className="w-4 h-4 text-accent-cyan mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-text-secondary leading-relaxed">
              SHA-256 cryptographic hash is computed at ingestion.{" "}
              <span className="text-accent-cyan font-medium">
                BSA 2023 Section 63 Part B
              </span>{" "}
              compliant evidence integrity.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================
          RIGHT — RESULTS PANEL
          ============================================================ */}
      <div
        className={`space-y-5 transition-all duration-500 ${
          result
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-4 pointer-events-none"
        }`}
      >
        {result && (
          <>
            {/* Hash certificate */}
            <HashDisplay
              caseId={result.case_id}
              sha256Hash={result.sha256_hash}
              submittedAt={result.submitted_at}
              submittedBy={result.submitted_by}
            />

            {/* Entity / Timeline tabs */}
            <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
              <TabBar active={activeTab} onChange={setActiveTab} />

              <div className="p-5">
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
          </>
        )}
      </div>
    </div>
  );
}
