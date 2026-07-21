import { apiRequest } from "./api";

export function listUsers(role?: string) {
  const qs = role ? `?role=${role}` : "";
  return apiRequest(`/admin/users${qs}`);
}

export function updateUserStatus(userId: number, accountStatus: string, reason?: string) {
  return apiRequest(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: { account_status: accountStatus, reason },
  });
}

export function setAgentVerified(agentId: number, isVerified: boolean) {
  return apiRequest(`/admin/agents/${agentId}/verify`, {
    method: "PATCH",
    body: { is_verified: isVerified },
  });
}

export function listReports(status?: string) {
  const qs = status ? `?status_filter=${status}` : "";
  return apiRequest(`/admin/reports${qs}`);
}

export function reviewReport(reportId: number, status: string) {
  return apiRequest(`/admin/reports/${reportId}`, {
    method: "PATCH",
    body: { status },
  });
}

export function createReport({ targetType, targetId, reason }: { targetType: string; targetId: number; reason: string }) {
  return apiRequest("/reports", {
    method: "POST",
    body: { target_type: targetType, target_id: targetId, reason },
  });
}

export function listAllConversations() {
  return apiRequest("/admin/conversations");
}

export function getConversationMessages(conversationId: number) {
  return apiRequest(`/admin/conversations/${conversationId}/messages`);
}

export function listKycDocuments(statusFilter?: string) {
  const qs = statusFilter ? `?status_filter=${statusFilter}` : "";
  return apiRequest(`/admin/kyc${qs}`);
}

export function reviewKycDocument(documentId: number, status: string) {
  return apiRequest(`/admin/kyc/${documentId}/review?status=${status}`, {
    method: "PATCH",
  });
}
