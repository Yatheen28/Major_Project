import React from "react";
import { Clock, AlertTriangle } from "lucide-react";

/* ======================================================================
   TIMELINE VIEW — Vertical timeline with dots and cards
   ====================================================================== */
export default function TimelineView({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: "#484F58" }}>
        <Clock
          size={32}
          style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }}
        />
        <p style={{ fontSize: "14px", color: "#8B949E" }}>
          No dated events found in this complaint
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "20px",
          fontSize: "11px",
          color: "#484F58",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#00D9FF",
            }}
          />
          <span>Confirmed date</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#D29922",
            }}
          />
          <span>Uncertain / relative</span>
        </div>
      </div>

      {/* Vertical line */}
      <div
        style={{
          position: "absolute",
          left: "119px",
          top: "56px",
          bottom: "16px",
          width: "1px",
          background: "#30363D",
        }}
      />

      {/* Timeline events */}
      {timeline.map((event, i) => {
        const isUncertain = event.is_uncertain;
        const dotColor = isUncertain ? "#D29922" : "#00D9FF";

        return (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "20px",
              marginBottom: "20px",
              alignItems: "flex-start",
            }}
          >
            {/* Timestamp */}
            <div
              style={{
                width: "100px",
                flexShrink: 0,
                textAlign: "right",
              }}
            >
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "12px",
                  color: dotColor,
                }}
              >
                {event.timestamp}
              </span>
            </div>

            {/* Dot on line */}
            <div
              style={{
                width: "20px",
                flexShrink: 0,
                display: "flex",
                justifyContent: "center",
                paddingTop: "2px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: dotColor,
                  border: `2px solid ${dotColor}`,
                  boxShadow: `0 0 8px ${dotColor}60`,
                }}
              />
            </div>

            {/* Content card */}
            <div
              style={{
                flex: 1,
                background: "#161B22",
                border: `1px solid ${isUncertain ? "#D2992240" : "#30363D"}`,
                borderRadius: "4px",
                padding: "12px",
                borderLeft: isUncertain
                  ? "2px solid #D29922"
                  : "2px solid #30363D",
              }}
            >
              {isUncertain && event.uncertainty_reason && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "8px",
                  }}
                >
                  <AlertTriangle size={12} color="#D29922" />
                  <span style={{ fontSize: "11px", color: "#D29922" }}>
                    Uncertain — {event.uncertainty_reason}
                  </span>
                </div>
              )}
              <p
                style={{
                  fontSize: "13px",
                  color: "#E6EDF3",
                  lineHeight: "1.5",
                  margin: 0,
                }}
              >
                {event.action_context}
              </p>

              {/* Referenced entities */}
              {event.entities_referenced &&
                event.entities_referenced.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginTop: "8px",
                    }}
                  >
                    {event.entities_referenced.map((val, idx) => (
                      <span
                        key={`${val}-${idx}`}
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "rgba(0,217,255,0.1)",
                          border: "1px solid rgba(0,217,255,0.2)",
                          fontSize: "11px",
                          fontFamily: "JetBrains Mono, monospace",
                          color: "#00D9FF",
                        }}
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
