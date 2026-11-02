/**
 * BioSentinel India — Backend Environment Resolver
 * Resolves the backend API base URL for both local development and production cloud deployment (e.g. Vercel).
 */
export function getBackendUrl(): string {
  const url = process.env.BACKEND_URL || "http://127.0.0.1:8000";
  return url.replace(/\/+$/, "");
}

