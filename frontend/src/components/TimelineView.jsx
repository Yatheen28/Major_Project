import React from "react";
import { Clock, AlertTriangle } from "lucide-react";

/* ======================================================================
   ENTITY CHIP (inline mini tag)
   ====================================================================== */
function EntityChip({ value }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
      {value}
    </span>
  );
}

/* ======================================================================
   TIMELINE EVENT NODE
   ====================================================================== */
function TimelineNode({ event, isLast }) {
  const { timestamp, action_context, entities_referenced, is_uncertain, uncertainty_reason } = event;

  return (
    <div className="flex gap-4 group">
      {/* Left — timestamp */}
      <div className="w-28 flex-shrink-0 text-right pt-1">
        <p className="text-sm font-mono text-accent-cyan leading-tight">
          {timestamp}
        </p>
      </div>

      {/* Center — line and node */}
      <div className="flex flex-col items-center flex-shrink-0">
        {/* Circle node */}
        <div
          className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1.5 ${
            is_uncertain
              ? "border-accent-orange bg-accent-orange/30"
              : "border-accent-cyan bg-accent-cyan/30"
          }`}
        />
        {/* Vertical line */}
        {!isLast && (
          <div
            className={`w-px flex-1 min-h-[40px] ${
              is_uncertain
                ? "border-l border-dashed border-accent-orange/30"
                : "bg-border-default"
            }`}
          />
        )}
      </div>

      {/* Right — content card */}
      <div
        className={`flex-1 mb-6 rounded-lg p-4 border transition-colors ${
          is_uncertain
            ? "bg-bg-card border-l-2 border-l-accent-orange border-t-border-muted border-r-border-muted border-b-border-muted"
            : "bg-bg-card border-border-muted hover:border-border-default"
        }`}
      >
        {/* Action context */}
        <p className="text-sm text-text-primary leading-relaxed">
          …{action_context}…
        </p>

        {/* Referenced entities */}
        {entities_referenced.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {entities_referenced.map((val, idx) => (
              <EntityChip key={`${val}-${idx}`} value={val} />
            ))}
          </div>
        )}

        {/* Uncertainty badge */}
        {is_uncertain && uncertainty_reason && (
          <div className="flex items-center gap-2 mt-3 px-2.5 py-1.5 rounded-md bg-accent-orange/10 border border-accent-orange/20 w-fit">
            <AlertTriangle className="w-3 h-3 text-accent-orange flex-shrink-0" />
            <span className="text-[11px] text-accent-orange font-medium">
              {uncertainty_reason}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================================================================
   TIMELINE VIEW
   ====================================================================== */
export default function TimelineView({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="w-8 h-8 text-text-muted mb-3" />
        <p className="text-sm text-text-secondary">No dated events extracted</p>
        <p className="text-xs text-text-muted mt-1">
          The complaint did not contain recognizable date references
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-6 text-[11px] text-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-cyan" />
          <span>Confirmed date</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-orange" />
          <span>Uncertain / relative</span>
        </div>
      </div>

      {/* Timeline nodes */}
      {timeline.map((event, idx) => (
        <TimelineNode
          key={idx}
          event={event}
          isLast={idx === timeline.length - 1}
        />
      ))}
    </div>
  );
}
