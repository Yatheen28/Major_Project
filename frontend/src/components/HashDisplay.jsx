import React, { useState } from "react";
import {
  Lock,
  Copy,
  CheckCircle,
  Info,
  Search,
  ShieldCheck,
  ShieldAlert,
  X,
} from "lucide-react";

import { verifyHash } from "../api/client";

/* ======================================================================
   VERIFY MODAL
   ====================================================================== */
function VerifyModal({ caseId, onClose }) {
  const [hashInput, setHashInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    if (!hashInput.trim()) return;
    setVerifying(true);
    setError(null);
    setResult(null);

    try {
      const res = await verifyHash(caseId, hashInput.trim());
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "440px",
          margin: "0 16px",
          background: "#161B22",
          border: "1px solid #30363D",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #21262D",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={16} color="#00D9FF" />
            <span
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#E6EDF3",
              }}
            >
              Verify Evidence Hash
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#8B949E",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>
          <label
            style={{
              fontSize: "12px",
              color: "#8B949E",
              fontWeight: "500",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Paste the SHA-256 hash to verify
          </label>
          <textarea
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            rows={3}
            placeholder="e.g. A1B2C3D4E5F6..."
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "#0D1117",
              border: "1px solid #30363D",
              borderRadius: "4px",
              color: "#E6EDF3",
              fontSize: "12px",
              fontFamily: "JetBrains Mono, monospace",
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
              marginBottom: "12px",
            }}
          />

          <button
            onClick={handleVerify}
            disabled={verifying || !hashInput.trim()}
            style={{
              width: "100%",
              padding: "10px",
              background:
                verifying || !hashInput.trim()
                  ? "#1C2128"
                  : "linear-gradient(135deg, #0A4A52, #003D4F)",
              border: "1px solid #00D9FF",
              borderRadius: "4px",
              color: "#00D9FF",
              fontSize: "13px",
              fontWeight: "600",
              cursor:
                verifying || !hashInput.trim() ? "not-allowed" : "pointer",
              opacity: verifying || !hashInput.trim() ? 0.5 : 1,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {verifying ? "Verifying..." : "Verify Hash"}
          </button>

          {/* Result */}
          {result && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "12px",
                borderRadius: "4px",
                marginTop: "12px",
                background: result.verified
                  ? "rgba(46,160,67,0.1)"
                  : "rgba(248,81,73,0.1)",
                border: result.verified
                  ? "1px solid rgba(46,160,67,0.3)"
                  : "1px solid rgba(248,81,73,0.3)",
              }}
            >
              {result.verified ? (
                <ShieldCheck size={18} color="#2EA043" style={{ flexShrink: 0, marginTop: "1px" }} />
              ) : (
                <ShieldAlert size={18} color="#F85149" style={{ flexShrink: 0, marginTop: "1px" }} />
              )}
              <div>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: result.verified ? "#2EA043" : "#F85149",
                    marginBottom: "6px",
                  }}
                >
                  {result.verified
                    ? "Hash Match — Evidence Intact"
                    : "Hash Mismatch — Possible Tampering"}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#484F58",
                    fontFamily: "JetBrains Mono, monospace",
                    wordBreak: "break-all",
                  }}
                >
                  Stored: {result.stored_hash}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#484F58",
                    fontFamily: "JetBrains Mono, monospace",
                    wordBreak: "break-all",
                  }}
                >
                  Provided: {result.provided_hash}
                </p>
              </div>
            </div>
          )}

          {error && (
            <p
              style={{
                fontSize: "12px",
                color: "#F85149",
                marginTop: "12px",
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ======================================================================
   HASH DISPLAY — Evidence Integrity Certificate
   ====================================================================== */
export default function HashDisplay({
  caseId,
  sha256Hash,
  submittedAt,
  submittedBy,
}) {
  const [showVerify, setShowVerify] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const formattedDate = (() => {
    try {
      return (
        new Date(submittedAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "UTC",
        }) + " UTC"
      );
    } catch {
      return submittedAt;
    }
  })();

  const rows = [
    { label: "Case ID", value: caseId, mono: false },
    { label: "SHA-256 Hash", value: sha256Hash, mono: true, long: true },
    { label: "Ingestion Timestamp (UTC)", value: formattedDate, mono: false },
    { label: "Submitted By", value: submittedBy, mono: false },
  ];

  const handleCopy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <>
      <div
        style={{
          background: "#161B22",
          border: "1px solid #30363D",
          borderRadius: "6px",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Lock size={16} color="#00D9FF" />
            <span
              style={{
                color: "#E6EDF3",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Evidence Integrity Certificate
            </span>
          </div>
          <span
            style={{
              fontSize: "11px",
              color: "#00D9FF",
              border: "1px solid rgba(0,217,255,0.25)",
              borderRadius: "4px",
              padding: "2px 8px",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            BSA §63 — Part B
          </span>
        </div>

        {/* Data rows */}
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "10px 0",
              borderBottom: "1px solid #21262D",
            }}
          >
            <span
              style={{
                width: "180px",
                flexShrink: 0,
                fontSize: "11px",
                color: "#8B949E",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                paddingTop: "2px",
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                flex: 1,
                fontFamily: row.mono
                  ? "JetBrains Mono, monospace"
                  : "Inter, sans-serif",
                fontSize: row.mono ? "11px" : "13px",
                color: "#E6EDF3",
                wordBreak: "break-all",
                lineHeight: "1.6",
              }}
            >
              {row.value}
            </span>
            <button
              onClick={() => handleCopy(row.value, row.label)}
              style={{
                background: "none",
                border: "1px solid #30363D",
                borderRadius: "4px",
                padding: "2px 8px",
                color:
                  copiedField === row.label ? "#2EA043" : "#8B949E",
                fontSize: "11px",
                cursor: "pointer",
                flexShrink: 0,
                fontFamily: "Inter, sans-serif",
                transition: "color 0.15s ease",
              }}
            >
              {copiedField === row.label ? "Copied" : "Copy"}
            </button>
          </div>
        ))}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              color: "#484F58",
            }}
          >
            <Info size={11} />
            <span>
              Hash computed at ingestion. Recompute to verify chain of custody.
            </span>
          </div>
          <button
            onClick={() => setShowVerify(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              background: "rgba(0,217,255,0.08)",
              border: "1px solid rgba(0,217,255,0.2)",
              borderRadius: "4px",
              color: "#00D9FF",
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <Search size={12} />
            Verify
          </button>
        </div>
      </div>

      {/* Verify modal */}
      {showVerify && (
        <VerifyModal
          caseId={caseId}
          onClose={() => setShowVerify(false)}
        />
      )}
    </>
  );
}
