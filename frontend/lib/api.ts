const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
export const API_BASE_URL = isLocalhost 
  ? (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000")
  : "https://marketplace-production-2905.up.railway.app";

export const SERVER_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://marketplace-production-2905.up.railway.app";

/** Server-safe fetch of a single property (no window, no auth). Used by Server Components. */
export async function getPropertyPublic(id: string | number): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${SERVER_API_BASE_URL}/properties/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

const TOKEN_KEY = "rental_platform_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : "Request failed");
    this.status = status;
    this.detail = detail;
  }
}

export async function apiRequest(
  path: string,
  { method = "GET", body, formData, auth = true, signal }: { method?: string; body?: unknown; formData?: FormData; auth?: boolean; signal?: AbortSignal } = {}
) {
  const headers: Record<string, string> = {};
  let requestBody: unknown;

  if (formData) {
    requestBody = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: requestBody as BodyInit | null | undefined,
    signal,
  });

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // no JSON body
  }

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    const detail = (data as { detail?: string | { loc?: string[]; msg: string }[] })?.detail;
    if (typeof detail === 'string') {
      errorMessage = detail;
    } else if (Array.isArray(detail)) {
      // Handle FastAPI validation error arrays
      errorMessage = detail.map((err) => `${err.loc?.join('.')} ${err.msg}`).join(', ');
    }
    throw new ApiError(response.status, errorMessage);
  }
  return data;
}

export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;

  // If the path is already an absolute URL, ensure it matches the current page's protocol.
  // This prevents mixed‑content blocks when the front‑end is loaded over HTTPS but the
  // stored avatar URL uses HTTP (e.g. from a dev back‑end). We only rewrite HTTP → HTTPS
  // when the browser environment is available; during SSR the function will just
  // return the original URL.
  if (path.startsWith("http")) {
    if (typeof window !== "undefined" && window.location.protocol === "https:" && path.startsWith("http://")) {
      return path.replace(/^http:/, "https:");
    }
    return path;
  }

  // Relative path – prepend the configured API base URL (which already includes the
  // correct scheme and host for the back‑end).
  return `${API_BASE_URL}${path}`;
}

export async function login(email: string, password: string): Promise<void> {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false
  });
  setToken(data.access_token);
}

export async function supabaseLogin(access_token: string, role?: string): Promise<void> {
  const data = await apiRequest("/auth/supabase-login", {
    method: "POST",
    body: { access_token, role },
    auth: false
  });
  setToken(data.access_token);
}

export function register(payload: Record<string, unknown>) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: payload,
    auth: false
  });
}

export function forgotPassword(payload: { email: string }) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: payload,
    auth: false
  });
}

export function resetPassword(payload: { email: string; token: string; new_password: string }) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: payload,
    auth: false
  });
}


export function getUser() {
  return apiRequest("/users/me");
}

// ============================================================================
// New Features Endpoints (Roommates, Saved Properties, KYC)
// ============================================================================

export function listRoommates() {
  return apiRequest("/roommates");
}

export function getRoommateProfile(id: number) {
  return apiRequest(`/roommates/${id}`);
}

export function createRoommateProfile(profile: Record<string, unknown>) {
  return apiRequest("/roommates", {
    method: "POST",
    body: profile,
  });
}

export function getSavedProperties() {
  return apiRequest("/users/me/saved");
}

export function saveProperty(listingId: number) {
  return apiRequest(`/users/me/saved/${listingId}`, {
    method: "POST",
  });
}

export function removeSavedProperty(listingId: number) {
  return apiRequest(`/users/me/saved/${listingId}`, {
    method: "DELETE",
  });
}

export function submitKycDocument(documentUrl: string) {
  return apiRequest("/users/me/kyc", {
    method: "POST",
    body: { document_url: documentUrl },
  });
}

export function getAgentProfile(agentId: number | string) {
  return apiRequest(`/agents/${agentId}`, { auth: false });
}

// ============================================================================
// Ratings Endpoints
// ============================================================================

export function rateAgent(agentId: number, stars: number, comment?: string) {
  return apiRequest(`/agents/${agentId}/ratings`, {
    method: "POST",
    body: { stars, comment },
    auth: true,
  });
}

export function getAgentRatings(agentId: number) {
  return apiRequest(`/agents/${agentId}/ratings`, {
    method: "GET",
    auth: false,
  });
}

export function rateApartment(listingId: number, stars: number, comment?: string) {
  return apiRequest(`/listings/${listingId}/ratings`, {
    method: "POST",
    body: { stars, comment },
    auth: true,
  });
}

export function getApartmentRatings(listingId: number) {
  return apiRequest(`/listings/${listingId}/ratings`, {
    method: "GET",
    auth: false,
  });
}

// ============================================================================
// Admin Endpoints
// ============================================================================

export function getAdminUsers() {
  return apiRequest("/admin/users", { auth: true });
}

export function updateUserRole(userId: number, role: string) {
  return apiRequest(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: { role },
    auth: true,
  });
}

export function getAdminConversations() {
  return apiRequest("/admin/conversations", { auth: true });
}

export function getAdminConversationMessages(conversationId: number) {
  return apiRequest(`/admin/conversations/${conversationId}/messages`, { auth: true });
}

/** Lightweight heartbeat — stamps last_seen_at on the backend. Returns nothing (204). */
export function pingPresence(): Promise<void> {
  return apiRequest("/users/me/ping", { method: "POST", auth: true }).catch(() => {});
}

// ============================================================================
// Verifications
// ============================================================================

export function applyForVerification(tier: string, selfie_url: string, passport_url: string) {
  return apiRequest("/verifications/apply", {
    method: "POST",
    body: { tier, selfie_url, passport_url },
    auth: true,
  });
}

export function getMyVerificationStatus() {
  return apiRequest("/verifications/my-status", { auth: true });
}

export function getAdminVerifications() {
  return apiRequest("/verifications/admin", { auth: true });
}

export function approveVerification(appId: number, reviewerNotes?: string) {
  return apiRequest(`/verifications/admin/${appId}/approve`, {
    method: "POST",
    body: { reviewer_notes: reviewerNotes },
    auth: true,
  });
}

export function rejectVerification(appId: number, reviewerNotes: string) {
  return apiRequest(`/verifications/admin/${appId}/reject`, {
    method: "POST",
    body: { reviewer_notes: reviewerNotes },
    auth: true,
  });
}

export async function uploadVerificationProof(file: File): Promise<{ url: string }> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/verifications/upload-proof`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload proof");
  }

  return res.json();
}

export function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest("/users/me/avatar", { method: "POST", formData, auth: true });
}

export function deactivateAccount(reason = "User self-deactivated") {
  return apiRequest("/users/me/deactivate", { method: "POST", body: { reason }, auth: true });
}
export function getMyConversations() {
  return apiRequest("/messages/conversations", { auth: true });
}
