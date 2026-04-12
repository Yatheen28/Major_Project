import React, { useState } from "react";
import {
  Lock,
  Copy,
  Check,
  Clipboard,
  ShieldCheck,
  ShieldAlert,
  X,
  Search,
} from "lucide-react";

import { verifyHash } from "../api/client";

/* ======================================================================
   COPY BUTTON (reusable)
   ====================================================================== */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-white/5 text-text-muted hover:text-accent-cyan transition-colors flex-shrink-0"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-accent-green" />
      ) : (
        <Clipboard className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

/* ======================================================================
   DATA ROW
   ====================================================================== */
function DataRow({ label, value, mono = false, small = false, copyable = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-xs text-text-muted uppercase tracking-wider flex-shrink-0 w-20 pt-0.5">
        {label}
      </span>
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <span
          className={`flex-1 text-text-primary break-all ${
            mono ? "font-mono" : ""
          } ${small ? "text-xs leading-relaxed" : "text-sm"}`}
        >
          {value}
        </span>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-bg-card border border-border-default rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-muted">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-sm font-semibold text-text-primary">
              Verify Evidence Hash
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/5 text-text-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-text-secondary font-medium">
              Paste the SHA-256 hash to verify
            </label>
            <textarea
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              rows={3}
              placeholder="E.g. A1B2C3D4E5F6..."
              className="w-full px-3 py-2.5 rounded-lg bg-bg-secondary border border-border-default text-text-primary text-xs font-mono placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 resize-none"
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={verifying || !hashInput.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-cyan text-bg-primary text-sm font-semibold hover:bg-accent-cyan/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {verifying ? "Verifying…" : "Verify Hash"}
          </button>

          {/* Result */}
          {result && (
            <div
              className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${
                result.verified
                  ? "bg-accent-green/10 border-accent-green/30"
                  : "bg-accent-red/10 border-accent-red/30"
              }`}
            >
              {result.verified ? (
                <ShieldCheck className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p
                  className={`text-sm font-semibold ${
                    result.verified ? "text-accent-green" : "text-accent-red"
                  }`}
                >
                  {result.verified
                    ? "✓ Hash Match — Evidence Intact"
                    : "✗ Hash Mismatch — Possible Tampering"}
                </p>
                <p className="text-[11px] text-text-muted font-mono break-all">
                  Stored: {result.stored_hash}
                </p>
                <p className="text-[11px] text-text-muted font-mono break-all">
                  Provided: {result.provided_hash}
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-accent-red">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ======================================================================
   HASH DISPLAY
   ====================================================================== */
export default function HashDisplay({ caseId, sha256Hash, submittedAt, submittedBy }) {
  const [showVerify, setShowVerify] = useState(false);

  const formattedDate = (() => {
    try {
      return new Date(submittedAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }) + " UTC";
    } catch {
      return submittedAt;
    }
  })();

  return (
    <>
      <div className="bg-bg-card border border-border-default rounded-xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-sm font-semibold text-text-primary">
              Evidence Integrity Certificate
            </h3>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-mono font-medium text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 rounded-full">
            BSA §63 Part B
          </span>
        </div>

        <div className="border-t border-border-muted" />

        {/* Data rows */}
        <div className="space-y-0.5">
          <DataRow label="Case ID" value={caseId} mono copyable />
          <DataRow label="SHA-256" value={sha256Hash} mono small copyable />
          <DataRow label="Ingested" value={formattedDate} />
          <DataRow label="Officer" value={submittedBy} />
        </div>

        <div className="border-t border-border-muted" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-text-muted leading-relaxed max-w-[260px]">
            Recompute hash from original text to verify evidence integrity.
          </p>
          <button
            onClick={() => setShowVerify(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent-cyan/30 text-accent-cyan text-xs font-medium hover:bg-accent-cyan/10 transition-colors"
          >
            <Search className="w-3 h-3" />
            Verify
          </button>
        </div>
      </div>

      {/* Verify modal */}
      {showVerify && (
        <VerifyModal caseId={caseId} onClose={() => setShowVerify(false)} />
      )}
    </>
  );
}
