import React, { useState } from "react";
import {
  Phone,
  CreditCard,
  Link,
  Hash,
  DollarSign,
  Calendar,
  Building2,
  Copy,
  CheckCircle,
  Layers,
} from "lucide-react";

/* ======================================================================
   ENTITY TYPE CONFIGURATION
   ====================================================================== */
const ENTITY_CONFIG = {
  PHONE_NUMBER: {
    label: "Phone",
    color: "#1F6FEB",
    bg: "rgba(31,111,235,0.12)",
    icon: Phone,
  },
  UPI_ID: {
    label: "UPI ID",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.12)",
    icon: CreditCard,
  },
  URL: {
    label: "URL",
    color: "#D29922",
    bg: "rgba(210,153,34,0.12)",
    icon: Link,
  },
  TRANSACTION_ID: {
    label: "Txn ID",
    color: "#F0883E",
    bg: "rgba(240,136,62,0.12)",
    icon: Hash,
  },
  AMOUNT: {
    label: "Amount",
    color: "#2EA043",
    bg: "rgba(46,160,67,0.12)",
    icon: DollarSign,
  },
  DATE: {
    label: "Date",
    color: "#00D9FF",
    bg: "rgba(0,217,255,0.12)",
    icon: Calendar,
  },
  BANK_ACCOUNT: {
    label: "Bank A/C",
    color: "#F85149",
    bg: "rgba(248,81,73,0.12)",
    icon: Building2,
  },
};

const FALLBACK_CONFIG = {
  label: "Unknown",
  color: "#8B949E",
  bg: "rgba(139,148,158,0.12)",
  icon: Layers,
};

/* ======================================================================
   ENTITY PILL
   ====================================================================== */
function EntityPill({ entity, config }) {
  const [copied, setCopied] = useState(false);
  const Icon = config.icon;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(entity.value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = entity.value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        background: config.bg,
        border: `1px solid ${config.color}40`,
        borderRadius: "4px",
        cursor: "pointer",
        position: "relative",
        transition: "border-color 0.15s ease",
      }}
      onClick={handleCopy}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = config.color + "80")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = config.color + "40")
      }
      title="Click to copy"
    >
      <Icon size={12} color={config.color} />
      <span
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "13px",
          color: "#E6EDF3",
        }}
      >
        {entity.value}
      </span>
      <span
        style={{
          fontSize: "10px",
          color: config.color,
          fontWeight: "700",
          marginLeft: "4px",
        }}
      >
        {Math.round(entity.confidence * 100)}%
      </span>
      {copied && (
        <span
          style={{
            position: "absolute",
            top: "-28px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#161B22",
            border: "1px solid #30363D",
            borderRadius: "4px",
            padding: "2px 8px",
            fontSize: "10px",
            color: "#2EA043",
            whiteSpace: "nowrap",
            zIndex: 10,
          }}
        >
          Copied!
        </span>
      )}
    </div>
  );
}

/* ======================================================================
   ENTITY DISPLAY
   ====================================================================== */
export default function EntityDisplay({ entities, entityCounts }) {
  if (!entities || entities.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <Layers
          size={32}
          color="#484F58"
          style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }}
        />
        <p style={{ fontSize: "14px", color: "#8B949E", marginBottom: "4px" }}>
          No entities extracted
        </p>
        <p style={{ fontSize: "12px", color: "#484F58" }}>
          The NER engine did not find recognizable forensic artifacts
        </p>
      </div>
    );
  }

  // Group entities by type
  const grouped = {};
  for (const entity of entities) {
    if (!grouped[entity.entity_type]) {
      grouped[entity.entity_type] = [];
    }
    grouped[entity.entity_type].push(entity);
  }

  return (
    <div>
      {/* Summary bar (count pills) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "20px",
        }}
      >
        {Object.entries(grouped).map(([type, items]) => {
          const config = ENTITY_CONFIG[type] || FALLBACK_CONFIG;
          const Icon = config.icon;
          return (
            <div
              key={type}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                background: config.bg,
                border: `1px solid ${config.color}40`,
                borderRadius: "20px",
              }}
            >
              <Icon size={12} color={config.color} />
              <span
                style={{
                  fontSize: "12px",
                  color: config.color,
                  fontWeight: "600",
                }}
              >
                {items.length}
              </span>
              <span style={{ fontSize: "12px", color: "#8B949E" }}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Grouped sections */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {Object.entries(grouped).map(([type, ents]) => {
          const config = ENTITY_CONFIG[type] || FALLBACK_CONFIG;
          const Icon = config.icon;
          return (
            <div key={type}>
              {/* Section header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <Icon size={14} color={config.color} />
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: config.color,
                  }}
                >
                  {config.label}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#484F58",
                  }}
                >
                  ({ents.length})
                </span>
              </div>
              {/* Entity pills */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {ents.map((entity, idx) => (
                  <EntityPill
                    key={`${entity.value}-${idx}`}
                    entity={entity}
                    config={config}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
