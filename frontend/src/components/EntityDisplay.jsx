import React, { useState } from "react";
import {
  Phone,
  CreditCard,
  Link,
  Hash,
  IndianRupee,
  Calendar,
  Building2,
  Copy,
  Check,
  Layers,
} from "lucide-react";

/* ======================================================================
   ENTITY TYPE CONFIGURATION
   ====================================================================== */
const ENTITY_CONFIG = {
  PHONE_NUMBER: {
    label: "Phone Number",
    bgColor: "rgba(31,111,235,0.15)",
    borderColor: "rgba(31,111,235,0.4)",
    textColor: "#1F6FEB",
    Icon: Phone,
  },
  UPI_ID: {
    label: "UPI ID",
    bgColor: "rgba(139,92,246,0.15)",
    borderColor: "rgba(139,92,246,0.4)",
    textColor: "#8B5CF6",
    Icon: CreditCard,
  },
  URL: {
    label: "URL",
    bgColor: "rgba(210,153,34,0.15)",
    borderColor: "rgba(210,153,34,0.4)",
    textColor: "#D29922",
    Icon: Link,
  },
  TRANSACTION_ID: {
    label: "Transaction ID",
    bgColor: "rgba(0,217,255,0.1)",
    borderColor: "rgba(0,217,255,0.3)",
    textColor: "#00D9FF",
    Icon: Hash,
  },
  AMOUNT: {
    label: "Amount",
    bgColor: "rgba(46,160,67,0.15)",
    borderColor: "rgba(46,160,67,0.4)",
    textColor: "#2EA043",
    Icon: IndianRupee,
  },
  DATE: {
    label: "Date",
    bgColor: "rgba(0,217,255,0.08)",
    borderColor: "rgba(0,217,255,0.2)",
    textColor: "#7ECFDD",
    Icon: Calendar,
  },
  BANK_ACCOUNT: {
    label: "Bank Account",
    bgColor: "rgba(248,81,73,0.15)",
    borderColor: "rgba(248,81,73,0.4)",
    textColor: "#F85149",
    Icon: Building2,
  },
};

/* ======================================================================
   SINGLE ENTITY PILL
   ====================================================================== */
function EntityPill({ entity, config }) {
  const [copied, setCopied] = useState(false);
  const { Icon, bgColor, borderColor, textColor } = config;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(entity.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for insecure contexts
      const textarea = document.createElement("textarea");
      textarea.value = entity.value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 group cursor-pointer"
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        boxShadow: `0 0 12px ${bgColor}`,
      }}
      title="Click to copy"
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: textColor }} />
      <span className="font-mono text-[13px]" style={{ color: textColor }}>
        {entity.value}
      </span>
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-text-muted font-medium">
        {Math.round(entity.confidence * 100)}%
      </span>
      {copied ? (
        <Check className="w-3 h-3 text-accent-green" />
      ) : (
        <Copy className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

/* ======================================================================
   ENTITY DISPLAY
   ====================================================================== */
export default function EntityDisplay({ entities, entityCounts }) {
  if (!entities || entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Layers className="w-8 h-8 text-text-muted mb-3" />
        <p className="text-sm text-text-secondary">No entities extracted</p>
        <p className="text-xs text-text-muted mt-1">
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
    <div className="space-y-5">
      {/* Summary count row */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(entityCounts || {}).map(([type, count]) => {
          const config = ENTITY_CONFIG[type];
          if (!config) return null;
          return (
            <div
              key={type}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium"
              style={{
                backgroundColor: config.bgColor,
                borderColor: config.borderColor,
                color: config.textColor,
              }}
            >
              <config.Icon className="w-3 h-3" />
              <span>{config.label}</span>
              <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px]">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Grouped entity sections */}
      {Object.entries(grouped).map(([type, ents]) => {
        const config = ENTITY_CONFIG[type] || {
          label: type,
          bgColor: "rgba(255,255,255,0.05)",
          borderColor: "rgba(255,255,255,0.1)",
          textColor: "#E6EDF3",
          Icon: Layers,
        };

        return (
          <div key={type} className="space-y-2">
            <div className="flex items-center gap-2">
              <config.Icon
                className="w-4 h-4"
                style={{ color: config.textColor }}
              />
              <h4
                className="text-sm font-semibold"
                style={{ color: config.textColor }}
              >
                {config.label}
              </h4>
              <span className="text-[10px] text-text-muted">({ents.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
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
  );
}
