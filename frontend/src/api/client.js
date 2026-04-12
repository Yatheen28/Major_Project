/**
 * CyberIntel API Client
 *
 * Axios-based HTTP client for communicating with the FastAPI backend.
 * All functions are async and throw descriptive errors on failure.
 */

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

/**
 * Ingest a new cybercrime complaint for analysis.
 * @param {string} text - Raw complaint text (min 20 chars).
 * @param {string} submittedBy - Officer name or badge ID.
 * @returns {Promise<object>} Full CaseOut record.
 */
export async function ingestComplaint(text, submittedBy = "investigator") {
  try {
    const response = await api.post("/api/ingest", {
      text,
      submitted_by: submittedBy,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail || error.message || "Failed to ingest complaint"
    );
  }
}

/**
 * Fetch all cases as lightweight summaries (newest first).
 * @returns {Promise<Array>} List of CaseSummary objects.
 */
export async function getCases() {
  try {
    const response = await api.get("/api/cases");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail || error.message || "Failed to fetch cases"
    );
  }
}

/**
 * Fetch a single case by ID.
 * @param {string} caseId - Case identifier (e.g. "CYB-A1B2C3D4").
 * @returns {Promise<object>} Full CaseOut record.
 */
export async function getCase(caseId) {
  try {
    const response = await api.get(`/api/cases/${caseId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail || error.message || `Failed to fetch case ${caseId}`
    );
  }
}

/**
 * Verify a case's SHA-256 hash integrity.
 * @param {string} caseId - Case identifier.
 * @param {string} hash - Expected SHA-256 hash to verify against.
 * @returns {Promise<object>} Verification result with verified, stored_hash, provided_hash.
 */
export async function verifyHash(caseId, hash) {
  try {
    const response = await api.get(`/api/cases/${caseId}/verify`, {
      params: { expected_hash: hash },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail || error.message || "Hash verification failed"
    );
  }
}

/**
 * Fetch aggregate entity statistics.
 * @returns {Promise<object>} StatsResponse with total_cases, total_entities, by_type.
 */
export async function getStats() {
  try {
    const response = await api.get("/api/stats");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail || error.message || "Failed to fetch stats"
    );
  }
}

/**
 * Health check — verify the API is reachable.
 * @returns {Promise<object>} HealthResponse with status, version, total_cases.
 */
export async function getHealth() {
  try {
    const response = await api.get("/api/health");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail || error.message || "Health check failed"
    );
  }
}
