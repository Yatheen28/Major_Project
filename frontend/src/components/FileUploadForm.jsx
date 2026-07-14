import React, { useState, useRef } from "react";
import { Upload, FileText, Image, AlertTriangle, LoaderCircle, CheckCircle2 } from "lucide-react";
import { ingestUpload } from "../api/client";
import EntityDisplay from "./EntityDisplay";
import HashDisplay from "./HashDisplay";

const ACCEPTED = ".jpg,.jpeg,.png,.pdf,.tiff,.bmp";

export default function FileUploadForm() {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [submittedBy, setSubmittedBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    setFile(f);
    setError(null);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select a file."); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const caseData = await ingestUpload(file, submittedBy.trim() || "investigator");
      setResult(caseData);
    } catch (err) {
      setError(err.message || "OCR processing failed.");
    } finally {
      setLoading(false);
    }
  };

  const fileIcon = file?.type === "application/pdf" ? FileText : Image;
  const FileIcon = fileIcon;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#00D9FF" : file ? "#2EA043" : "#30363D"}`,
            borderRadius: "8px",
            padding: "32px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "rgba(0,217,255,0.04)" : file ? "rgba(46,160,67,0.04)" : "#0D1117",
            transition: "all 0.2s ease",
            marginBottom: "16px",
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            style={{ display: "none" }}
          />
          {file ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <FileIcon size={20} color="#2EA043" />
              <span style={{ fontSize: "14px", color: "#E6EDF3", fontWeight: "500" }}>{file.name}</span>
              <span style={{ fontSize: "11px", color: "#8B949E" }}>({(file.size / 1024).toFixed(0)} KB)</span>
            </div>
          ) : (
            <>
              <Upload size={28} color="#484F58" style={{ marginBottom: "8px" }} />
              <p style={{ fontSize: "14px", color: "#8B949E", margin: "4px 0" }}>
                Drop a photo or PDF here, or click to browse
              </p>
              <p style={{ fontSize: "11px", color: "#484F58" }}>
                Supports: JPEG, PNG, PDF, TIFF, BMP
              </p>
            </>
          )}
        </div>

        {/* Officer field */}
        <input
          type="text"
          value={submittedBy}
          onChange={(e) => setSubmittedBy(e.target.value)}
          placeholder="Officer name / badge ID (optional)"
          style={{
            width: "100%",
            padding: "10px 14px",
            fontSize: "13px",
            color: "#E6EDF3",
            background: "#0D1117",
            border: "1px solid #30363D",
            borderRadius: "6px",
            fontFamily: "Inter, sans-serif",
            marginBottom: "16px",
            boxSizing: "border-box",
            outline: "none",
          }}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !file}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "14px",
            fontWeight: "600",
            color: loading || !file ? "#484F58" : "#FFFFFF",
            background: loading || !file ? "#21262D" : "linear-gradient(135deg, #00D9FF 0%, #1F6FEB 100%)",
            border: "none",
            borderRadius: "6px",
            cursor: loading || !file ? "not-allowed" : "pointer",
            fontFamily: "Inter, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease",
          }}
        >
          {loading ? (
            <>
              <LoaderCircle size={16} style={{ animation: "spin 1s linear infinite" }} />
              Processing OCR...
            </>
          ) : (
            <>
              <Upload size={16} />
              Extract & Analyze
            </>
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "12px 16px", marginTop: "16px",
          background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.2)",
          borderRadius: "6px",
        }}>
          <AlertTriangle size={14} color="#F85149" />
          <span style={{ fontSize: "12px", color: "#F85149" }}>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ marginTop: "24px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            marginBottom: "16px",
          }}>
            <CheckCircle2 size={16} color="#2EA043" />
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#2EA043" }}>
              Case {result.case_id} created
            </span>
          </div>

          <HashDisplay
            caseId={result.case_id}
            sha256Hash={result.sha256_hash}
            submittedAt={result.submitted_at}
            submittedBy={result.submitted_by}
          />

          <div style={{ marginTop: "16px" }}>
            <EntityDisplay
              entities={result.entities}
              entityCounts={result.entity_counts}
            />
          </div>

          {/* Show extracted text preview */}
          <div style={{
            marginTop: "16px", padding: "12px",
            background: "#0D1117", border: "1px solid #21262D",
            borderRadius: "6px",
          }}>
            <p style={{ fontSize: "11px", color: "#484F58", marginBottom: "8px", fontWeight: "600" }}>
              EXTRACTED TEXT
            </p>
            <p style={{
              fontSize: "12px", color: "#8B949E", lineHeight: "1.6",
              whiteSpace: "pre-wrap", margin: 0, maxHeight: "150px",
              overflow: "auto",
            }}>
              {result.raw_text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
