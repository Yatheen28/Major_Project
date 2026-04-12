import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertTriangle, FileText } from "lucide-react";

import { getCase } from "../api/client";
import HashDisplay from "./HashDisplay";
import EntityDisplay from "./EntityDisplay";
import TimelineView from "./TimelineView";

/* ======================================================================
   TAB BAR
   ====================================================================== */
function TabBar({ active, onChange }) {
  const tabs = [
    { id: "entities", label: "Entities" },
    { id: "timeline", label: "Timeline" },
    { id: "raw", label: "Raw Text" },
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
    return () => { cancelled = true; };
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-12 space-y-4">
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-accent-red/10 border border-accent-red/30">
          <AlertTriangle className="w-4 h-4 text-accent-red mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-accent-red">Failed to load case</p>
            <p className="text-xs text-text-muted mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/cases")}
          className="flex items-center gap-2 text-sm text-accent-cyan hover:text-accent-cyan/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
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

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/cases")}
          className="p-2 rounded-lg border border-border-default hover:bg-white/[0.03] text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-text-primary font-mono">
            {caseData.case_id}
          </h1>
          <p className="text-xs text-text-muted">
            {totalEntities} entities extracted · {caseData.timeline?.length || 0} timeline
            events
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium text-accent-green bg-accent-green/10 border border-accent-green/25 rounded-full ml-auto">
          {caseData.status}
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left — hash + case info */}
        <div className="space-y-5">
          <HashDisplay
            caseId={caseData.case_id}
            sha256Hash={caseData.sha256_hash}
            submittedAt={caseData.submitted_at}
            submittedBy={caseData.submitted_by}
          />
        </div>

        {/* Right — entities / timeline / raw text */}
        <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
          <TabBar active={activeTab} onChange={setActiveTab} />
          <div className="p-5">
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
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <FileText className="w-4 h-4" />
                  <span>Original complaint text</span>
                </div>
                <div className="bg-bg-secondary rounded-lg p-4 border border-border-muted">
                  <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
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
