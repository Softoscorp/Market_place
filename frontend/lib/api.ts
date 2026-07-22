export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://marketplace-production-2905.up.railway.app";

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
  { method = "GET", body, formData, auth = true }: { method?: string; body?: unknown; formData?: FormData; auth?: boolean } = {}
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
  });

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // no JSON body
  }

  if (!response.ok) {
    throw new ApiError(response.status, (data as Record<string, string>)?.detail || `Request failed (${response.status})`);
  }
  return data;
}

export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
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

export function register(payload: Record<string, unknown>) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: payload,
    auth: false
  });
}

export function resetPassword(payload: { email: string; new_password: string }) {
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


