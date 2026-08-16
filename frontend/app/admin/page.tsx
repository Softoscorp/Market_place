'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  CheckCircle,
  XCircle,
  Users,
  AlertTriangle,
  ShieldCheck,
  Mail,
  X,
  LogOut,
  Award
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import styles from '../agent-dashboard/Dashboard.module.css';
import { apiRequest, getAdminUsers, updateUserRole, getAdminConversations, getAdminConversationMessages, getAdminVerifications, approveVerification, rejectVerification } from '@/lib/api';

interface Report {
  id: number;
  reason: string;
  target_type: string;
  target_id: number;
  status: string;
  created_at: string;
  reporter: { id: number; name: string; email: string };
}

interface KYCDoc {
  id: number;
  agent?: { name: string };
  agent_id: number;
  document_type: string;
  status: string;
}

interface VerificationApplication {
  id: number;
  agent_id: number;
  tier: string;
  status: string;
  proof_urls: string[];
  selfie_url?: string | null;
  passport_url?: string | null;
  reviewer_notes?: string;
  created_at: string;
}

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  is_verified: boolean;
  account_status: string;
  last_seen_at?: string | null;
}

interface AdminConversation {
  id: number;
  renter_id: number;
  agent_id: number;
  renter: { id: number; name: string; email: string };
  agent: { id: number; name: string; email: string };
  last_message_at: string;
}


interface AdminMessage {
  id: number;
  text: string;
  sender_id: number;
  created_at: string;
}

interface AdminEmailLog {
  id: number;
  sender: { id: number; name: string };
  recipient_email: string;
  subject: string;
  template_key?: string | null;
  created_at: string;
}

const EMAIL_TEMPLATES: Record<string, { subject: string; content: string }> = {
  phone_update: {
    subject: 'Action needed: update your phone number',
    content: "Hi there,\n\nWe don't have a valid phone number on your House Agent account. To keep your account secure and receive platform notifications, please log in and update your phone number in your profile settings.\n\nIf you need help, just reply to this email.\n\nBest regards,\nHouse Agent Support",
  },
  account_verify: {
    subject: 'Please verify your account',
    content: "Hi there,\n\nTo continue using your House Agent account, please complete account verification. You can find the verification option in your profile.\n\nIf you have any questions, reply to this email.\n\nBest regards,\nHouse Agent Support",
  },
  complaint_response: {
    subject: 'Update on your complaint',
    content: "Hi there,\n\nThank you for getting in touch. We've reviewed your report and are looking into it. We'll get back to you with an update as soon as we can.\n\nBest regards,\nHouse Agent Support",
  },
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { t } = useLanguageStore();
  const [activeTabState, setActiveTabState] = useState('overview');
  const activeTab = user?.role === 'customer_care' ? 'chats' : activeTabState;
  const setActiveTab = setActiveTabState;

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [kycDocs, setKycDocs] = useState<KYCDoc[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<AdminConversation | null>(null);
  const [chatMessages, setChatMessages] = useState<AdminMessage[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [verifications, setVerifications] = useState<VerificationApplication[]>([]);
  const [emailModal, setEmailModal] = useState<{ email: string; name: string } | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTemplateKey, setEmailTemplateKey] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailLogs, setEmailLogs] = useState<AdminEmailLog[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'customer_care')) {
      router.replace('/login');
    } else {
      timeout = setTimeout(() => {
        setIsCheckingAuth(false);
        if (user?.role === 'customer_care') {
          setActiveTab('chats');
          getAdminConversations().then(data => setConversations(data || [])).catch(console.error);
        } else {
          // Fetch admin data
          apiRequest('/admin/kyc', { auth: true })
            .then(data => setKycDocs(data || []))
            .catch(console.error);
          getAdminUsers().then(data => setAdminUsers(data || [])).catch(console.error);
          getAdminConversations().then(data => setConversations(data || [])).catch(console.error);
          apiRequest('/admin/reports', { auth: true })
            .then(data => setReports(data || []))
            .catch(console.error);
          getAdminVerifications().then(data => setVerifications(data || [])).catch(console.error);
        }
      }, 0);
    }
    return () => clearTimeout(timeout);
  }, [isAuthenticated, user, router, setActiveTab]);

  const handleApproveKYC = async (id: number) => {
    try {
      await apiRequest(`/admin/kyc/${id}/approve`, { method: 'POST', auth: true });
      setKycDocs(docs => docs.map(d => d.id === id ? { ...d, status: 'approved' } : d));
      alert(t('ad_kyc_approved'));
    } catch (error) {
      console.error(error);
      alert(t('ad_kyc_approve_failed'));
    }
  };

  const handleRejectKYC = async (id: number) => {
    try {
      await apiRequest(`/admin/kyc/${id}/reject`, { method: 'POST', auth: true });
      setKycDocs(docs => docs.map(d => d.id === id ? { ...d, status: 'rejected' } : d));
      alert(t('ad_kyc_rejected'));
    } catch (error) {
      console.error(error);
      alert(t('ad_kyc_reject_failed'));
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setAdminUsers(users => users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert(t('ad_role_updated'));
    } catch (error) {
      console.error(error);
      alert(t('ad_role_update_failed'));
    }
  };

  const handleVerifyToggle = async (userId: number, currentValue: boolean) => {
    try {
      await apiRequest(`/admin/agents/${userId}/verify`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ is_verified: !currentValue }),
      });
      setAdminUsers(users => users.map(u => u.id === userId ? { ...u, is_verified: !currentValue } : u));
    } catch (error) {
      console.error(error);
      alert(t('ad_verify_status_failed'));
    }
  };

  const handleSendEmail = async () => {
    if (!emailModal || !emailSubject || !emailBody) return;
    setEmailSending(true);
    try {
      await apiRequest('/admin/send-email', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          email: emailModal.email,
          subject: emailSubject,
          content: emailBody,
          template_key: emailTemplateKey || null,
        }),
      });
      alert(t('ad_email_sent'));
      setEmailModal(null);
      setEmailSubject('');
      setEmailBody('');
      setEmailTemplateKey('');
    } catch (error) {
      console.error(error);
      alert(t('ad_email_send_failed'));
    } finally {
      setEmailSending(false);
    }
  };

  const applyEmailTemplate = (key: string) => {
    setEmailTemplateKey(key);
    const tpl = EMAIL_TEMPLATES[key];
    if (tpl) {
      setEmailSubject(tpl.subject);
      setEmailBody(tpl.content);
    }
  };

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!selectedConversation || !text || replySending) return;
    setReplySending(true);
    try {
      const formData = new FormData();
      formData.append('body', text);
      const msg = await apiRequest(`/messages/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        formData,
        auth: true,
      });
      setChatMessages(msgs => [...msgs, msg]);
      setReplyText('');
    } catch (error) {
      console.error(error);
      alert(t('ad_reply_failed'));
    } finally {
      setReplySending(false);
    }
  };

  const handleOpenChat = async (conv: AdminConversation) => {
    setSelectedConversation(conv);
    try {
      const msgs = await getAdminConversationMessages(conv.id);
      setChatMessages(msgs || []);
    } catch (error) {
      console.error(error);
      alert(t('ad_load_messages_failed'));
    }
  };



  if (isCheckingAuth) return <div className={styles.loaderContainer}><div className={styles.loader}></div></div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.overviewTab}>
            <h3 className={styles.sectionTitle}>{t('ad_system_overview')}</h3>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>{t('ad_pending_kyc')}</span>
                  <FileText size={18} className={styles.metricIcon} />
                </div>
                <div className={styles.metricValue}>{kycDocs.filter(d => d.status === 'pending').length}</div>
              </div>
            </div>
          </motion.div>
        );
      case 'kyc':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.listingsTab}>
            <div className={styles.tabHeader}>
              <h3 className={styles.sectionTitle}>{t('ad_kyc_management')}</h3>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('ad_col_agent')}</th>
                    <th>{t('ad_doc_type')}</th>
                    <th>{t('ad_col_status')}</th>
                    <th>{t('ad_col_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {kycDocs.map(doc => (
                    <tr key={doc.id}>
                      <td className={styles.fw500}>{doc.agent?.name || `${t('ad_agent_hash')}${doc.agent_id}`}</td>
                      <td>{doc.document_type}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${doc.status === 'approved' ? styles.active : doc.status === 'rejected' ? styles.paused : ''}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td>
                        {doc.status === 'pending' && (
                          <div className={styles.actionButtons}>
                            <button className={styles.iconBtn} onClick={() => handleApproveKYC(doc.id)} title={t('ad_approve')} aria-label={t('ad_approve')}><CheckCircle size={16} color="var(--success)" /></button>
                            <button className={styles.iconBtn} onClick={() => handleRejectKYC(doc.id)} title={t('ad_reject')} aria-label={t('ad_reject')}><XCircle size={16} color="var(--danger)" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );
      case 'verifications':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.listingsTab}>
            <div className={styles.tabHeader}>
              <h3 className={styles.sectionTitle}>{t('ad_verification_applications')}</h3>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('ad_agent_id')}</th>
                    <th>{t('ad_requested_tier')}</th>
                    <th>{t('ad_col_status')}</th>
                    <th>{t('ad_col_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map(app => (
                    <tr key={app.id}>
                      <td className={styles.fw500}>#{app.agent_id}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${app.tier === 'international' ? styles.tierInternational : styles.tierStandard}`}>
                          {app.tier}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${app.status === 'approved' ? styles.active : app.status === 'rejected' ? styles.paused : ''}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionRow}>
                          {app.status === 'pending' && (
                            <>
                              <button 
                                className={styles.actionBtn} 
                                onClick={async () => {
                                  try {
                                    await approveVerification(app.id);
                                    setVerifications(apps => apps.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
                                    alert(t('ad_verification_approved'));
                                  } catch (e) {
                                    console.error(e);
                                    alert(t('ad_approve_failed'));
                                  }
                                }}
                                title={t('ad_approve')}
                                aria-label={t('ad_approve_verification')}
                              >
                                <CheckCircle size={16} color="var(--success)" />
                              </button>
                              <button 
                                className={styles.actionBtn} 
                                onClick={async () => {
                                  const reason = prompt(t('ad_rejection_reason'));
                                  if (reason === null) return;
                                  try {
                                    await rejectVerification(app.id, reason);
                                    setVerifications(apps => apps.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a));
                                    alert(t('ad_verification_rejected'));
                                  } catch (e) {
                                    console.error(e);
                                    alert(t('ad_reject_failed'));
                                  }
                                }}
title={t('ad_reject')}
                                    aria-label={t('ad_reject_verification')}
                                  >
                                    <XCircle size={16} color="var(--danger)" />
                                  </button>
                            </>
                          )}
                          {app.proof_urls.map((url, idx) => {
                            const safe = typeof url === 'string' && /^https?:\/\//i.test(url);
                            return safe ? (
                              <a key={idx} href={url} target="_blank" rel="noreferrer" className={styles.proofLink}>
                                {t('ad_proof', { n: String(idx + 1) })}
                              </a>
                            ) : (
                              <span key={idx} className={styles.proofInvalid}>
                                {t('ad_proof_invalid', { n: String(idx + 1) })}
                              </span>
                            );
                          })}
                          {app.selfie_url && /^https?:\/\//i.test(app.selfie_url) && (
                            <a href={app.selfie_url} target="_blank" rel="noreferrer" className={styles.proofLink}>
                              {t('ad_selfie')}
                            </a>
                          )}
                          {app.passport_url && /^https?:\/\//i.test(app.passport_url) && (
                            <a href={app.passport_url} target="_blank" rel="noreferrer" className={styles.proofLink}>
                              {t('ad_passport')}
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );
      case 'users':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.listingsTab}>
            <div className={styles.tabHeader}>
              <h3 className={styles.sectionTitle}>{t('ad_user_management')}</h3>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('ad_col_name')}</th>
                    <th>{t('ad_col_email')}</th>
                    <th>{t('ad_col_status')}</th>
                    <th>{t('ad_col_current_role')}</th>
                    <th>{t('ad_col_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map(u => (
                    <tr key={u.id}>
                      <td className={styles.fw500}>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        {(() => {
                          const online = u.last_seen_at ? (Date.now() - new Date(u.last_seen_at.endsWith('Z') ? u.last_seen_at : u.last_seen_at + 'Z').getTime()) < 5 * 60 * 1000 : false;
                          const diffMin = u.last_seen_at ? Math.floor((Date.now() - new Date(u.last_seen_at.endsWith('Z') ? u.last_seen_at : u.last_seen_at + 'Z').getTime()) / 60000) : null;
                          const label = online ? t('ad_online_now') : diffMin === null ? t('ad_never') : diffMin < 60 ? t('ad_min_ago', { count: String(diffMin) }) : t('ad_hour_ago', { count: String(Math.floor(diffMin / 60)) });
                          return (
                            <span className={styles.onlineStatusRow}>
                              <span className={online ? styles.onlineDot : styles.offlineDot} />
                              <span className={online ? styles.onlineLabel : styles.offlineLabel}>{label}</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${u.account_status === 'active' ? styles.active : styles.paused}`}>
                          {u.account_status || 'active'}
                        </span>
                      </td>
                      <td>
                        <select 
                          className={`${styles.input} ${styles.roleSelect}`}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="renter">{t('ad_role_renter')}</option>
                          <option value="agent">{t('ad_role_agent')}</option>
                          <option value="customer_care">{t('ad_role_customer_care')}</option>
                        </select>
                        
                        <select 
                          className={`${styles.input} ${styles.statusSelect}`}
                          value={u.account_status || 'active'}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            let reason = "";
                            if (newStatus !== 'active') {
                              const input = prompt(t('ad_status_change_reason', { status: newStatus }));
                              if (input === null) return;
                              reason = input;
                            }
                            
                            try {
                              await apiRequest(`/admin/users/${u.id}/account-status`, {
                                method: 'PATCH',
                                auth: true,
                                body: JSON.stringify({ status: newStatus, status_reason: reason })
                              });
                              setAdminUsers(users => users.map(user => user.id === u.id ? { ...user, account_status: newStatus } : user));
                              alert(t('ad_account_status_updated'));
                            } catch {
                              alert(t('ad_account_status_failed'));
                            }
                          }}
                        >
                          <option value="active">{t('ad_active')}</option>
                          <option value="suspended">{t('ad_suspended')}</option>
                          <option value="banned">{t('ad_banned')}</option>
                        </select>
                        
                        <button
                          className={`${styles.iconBtn} ${styles.verifyBtn}`}
                          title={u.is_verified ? t('ad_revoke_verification') : t('ad_verify_user')}
                          aria-label={u.is_verified ? t('ad_revoke_verification_aria') : t('ad_verify_user_aria')}
                          onClick={() => handleVerifyToggle(u.id, u.is_verified)}
                        >
                          <ShieldCheck size={16} color={u.is_verified ? 'var(--success)' : 'var(--text-muted)'} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );
      case 'chats':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.crmTab}>
            <h3 className={styles.sectionTitle}>{t('ad_support_chats')}</h3>
            <p>{t('ad_chats_sub')}</p>
            
            {selectedConversation ? (
              <div className={styles.chatDetail}>
                <div className={styles.chatDetailHeader}>
                  <div>
                    <h4 className={styles.chatDetailTitle}>{t('ad_conversation_id', { id: String(selectedConversation.id) })}</h4>
                    <p className={styles.chatDetailMeta}>
                      <strong>{t('ad_renter_colon')}</strong> {selectedConversation.renter.name} &nbsp; | &nbsp; 
                      <strong>{t('ad_agent_colon')}</strong> {selectedConversation.agent.name}
                    </p>
                  </div>
                  <div className={styles.chatDetailActions}>
                    <button
                      className={`${styles.btnSecondary} ${styles.btnSecondaryCompact}`}
                      onClick={() => setEmailModal({ email: selectedConversation.renter.email, name: selectedConversation.renter.name })}
                    >
                      <Mail size={14} className={styles.btnIconMargin} /> {t('ad_email_renter')}
                    </button>
                    <button onClick={() => setSelectedConversation(null)} className={`${styles.btnSecondary} ${styles.btnSecondaryCompact}`}>
                      {t('ad_back_to_list')}
                    </button>
                  </div>
                </div>
                
                <div className={styles.chatMessages}>
                  {chatMessages.length === 0 && <p className={styles.chatEmpty}>{t('ad_no_messages')}</p>}
                  {chatMessages.map(msg => {
                    const isRenter = msg.sender_id === selectedConversation.renter_id;
                    const isAgent = msg.sender_id === selectedConversation.agent_id;
                    const senderName = isRenter ? selectedConversation.renter.name : isAgent ? selectedConversation.agent.name : t('ad_support');
                    const isSupport = !isRenter && !isAgent;
                    return (
                      <div key={msg.id} className={`${styles.chatBubble} ${isRenter ? styles.chatBubbleRenter : styles.chatBubbleOther}`}>
                        <div className={styles.chatSenderName}>{senderName}{isSupport ? t('ad_you_suffix') : ''}</div>
                        <div>{msg.text}</div>
                        <div className={styles.chatTime}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.chatReplyRow}>
                  <textarea
                    className={`${styles.input} ${styles.replyInput}`}
                    rows={3}
                    placeholder={t('ad_reply_placeholder')}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                  />
                  <button
                    className={`${styles.btnPrimary} ${styles.replyButton}`}
                    onClick={handleSendReply}
                    disabled={replySending || !replyText.trim()}
                  >
                    {replySending ? t('ad_sending') : t('ad_send_reply')}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.crmGrid}>
                {conversations.length === 0 && <p>{t('ad_no_active_conversations')}</p>}
                {conversations.map(conv => (
                  <div key={conv.id} className={styles.crmCard}>
                    <div className={styles.crmHeader}>
                      <h4>{conv.renter.name} & {conv.agent.name}</h4>
                    </div>
                    <p className={styles.crmMeta}>{t('ad_last_message', { date: new Date(conv.last_message_at).toLocaleString() })}</p>
                    <button 
                      className={`${styles.btnSecondary} ${styles.openChatBtn}`}
                      onClick={() => handleOpenChat(conv)}
                    >
                      <MessageSquare size={14} /> {t('ad_open_support_chat')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      case 'emailLogs':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.listingsTab}>
            <div className={styles.tabHeader}>
              <h3 className={styles.sectionTitle}>{t('ad_email_logs')}</h3>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('ad_col_sent_by')}</th>
                    <th>{t('ad_col_to')}</th>
                    <th>{t('ad_col_subject')}</th>
                    <th>{t('ad_col_template')}</th>
                    <th>{t('ad_col_sent_at')}</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.length === 0 && <tr><td colSpan={5} className={styles.emptyCell}>{t('ad_no_emails')}</td></tr>}
                  {emailLogs.map(log => (
                    <tr key={log.id}>
                      <td className={styles.fw500}>{log.sender.name}</td>
                      <td>{log.recipient_email}</td>
                      <td className={styles.truncateCell}>{log.subject}</td>
                      <td><span className={styles.statusBadge}>{log.template_key || t('ad_custom')}</span></td>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );
      default: return null;
    }
  };

  // Shared Reports/Complaints tab for both admin and customer_care
  const renderReportsTab = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.listingsTab}>
      <div className={styles.tabHeader}>
        <h3 className={styles.sectionTitle}>{t('ad_reports_complaints')}</h3>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('ad_col_reporter')}</th>
              <th>{t('ad_col_target')}</th>
              <th>{t('ad_col_reason')}</th>
              <th>{t('ad_col_status')}</th>
              <th>{t('ad_col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && <tr><td colSpan={5} className={styles.emptyCell}>{t('ad_no_reports')}</td></tr>}
            {reports.map(r => (
              <tr key={r.id}>
                <td className={styles.fw500}>{r.reporter.name}</td>
                <td>{r.target_type} #{r.target_id}</td>
                <td className={styles.truncateCellReason}>{r.reason}</td>
                <td><span className={`${styles.statusBadge} ${r.status === 'reviewed' ? styles.active : ''}`}>{r.status}</span></td>
                <td>
                  <button
                    className={styles.iconBtn}
                    title={t('ad_email_name', { name: r.reporter.name })}
                    aria-label={t('ad_email_name', { name: r.reporter.name })}
                    onClick={() => setEmailModal({ email: r.reporter.email, name: r.reporter.name })}
                  >
                    <Mail size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>{t('ad_panel_title')}</h2>
          <p>{user?.name} ({user?.role})</p>
        </div>
        <nav className={styles.nav}>
          {user?.role === 'admin' && (
            <>
              <button 
                className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <PremiumIcon icon={LayoutDashboard} size={14} colorVariant="primary" containerSize={24} /> {t('ad_nav_overview')}
              </button>
              <button 
                className={`${styles.navItem} ${activeTab === 'kyc' ? styles.active : ''}`}
                onClick={() => setActiveTab('kyc')}
              >
                <PremiumIcon icon={FileText} size={14} colorVariant="primary" containerSize={24} /> {t('ad_kyc_verification')}
              </button>
              <button 
                className={`${styles.navItem} ${activeTab === 'verifications' ? styles.active : ''}`}
                onClick={() => { setActiveTab('verifications'); getAdminVerifications().then(data => setVerifications(data || [])).catch(console.error); }}
              >
                <PremiumIcon icon={Award} size={14} colorVariant="primary" containerSize={24} /> {t('ad_agent_tiers')}
              </button>
              <button 
                className={`${styles.navItem} ${activeTab === 'users' ? styles.active : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <PremiumIcon icon={Users} size={14} colorVariant="primary" containerSize={24} /> {t('ad_user_management')}
              </button>
              <button 
                className={`${styles.navItem} ${activeTab === 'reports' ? styles.active : ''}`}
                onClick={() => { setActiveTab('reports'); apiRequest('/admin/reports', { auth: true }).then(d => setReports(d || [])).catch(console.error); }}
              >
                <PremiumIcon icon={AlertTriangle} size={14} colorVariant="primary" containerSize={24} /> {t('ad_reports')}
              </button>
              <button 
                className={`${styles.navItem} ${activeTab === 'emailLogs' ? styles.active : ''}`}
                onClick={() => { setActiveTab('emailLogs'); apiRequest('/admin/email-logs', { auth: true }).then(d => setEmailLogs(d || [])).catch(console.error); }}
              >
                <PremiumIcon icon={Mail} size={14} colorVariant="primary" containerSize={24} /> {t('ad_email_logs')}
              </button>
            </>
          )}
          <button 
            className={`${styles.navItem} ${activeTab === 'chats' ? styles.active : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <PremiumIcon icon={MessageSquare} size={14} colorVariant="primary" containerSize={24} /> {t('ad_support_chats')}
          </button>
          
          <div className={styles.navFooter}>
            <button 
              className={`${styles.navItem} ${styles.signOutBtn}`}
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
            >
              <PremiumIcon icon={LogOut} size={14} colorVariant="danger" containerSize={24} /> {t('ad_sign_out')}
            </button>
          </div>
        </nav>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.topbar}>
          <h1 className={styles.pageTitle}>
            {activeTab === 'overview' && t('ad_nav_top_overview')}
            {activeTab === 'kyc' && t('ad_kyc_verification')}
            {activeTab === 'users' && t('ad_user_management')}
            {activeTab === 'chats' && t('ad_customer_support')}
          </h1>
        </div>
        
        <div className={styles.contentArea}>
          <AnimatePresence mode="wait">
            {activeTab === 'reports' ? renderReportsTab() : renderTabContent()}
          </AnimatePresence>
        </div>
      </div>

      {/* Email Modal */}
      {emailModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.emailModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{t('ad_contact_name', { name: emailModal.name })}</h3>
              <button onClick={() => setEmailModal(null)} className={styles.modalClose}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div>
                <label className={styles.modalLabel}>{t('ad_col_template')}</label>
                <select
                  className={styles.input}
                  value={emailTemplateKey}
                  onChange={e => applyEmailTemplate(e.target.value)}
                >
                  <option value="">{t('ad_custom_message')}</option>
                  <option value="phone_update">{t('ad_tpl_phone_update')}</option>
                  <option value="account_verify">{t('ad_tpl_account_verify')}</option>
                  <option value="complaint_response">{t('ad_tpl_complaint_response')}</option>
                </select>
              </div>
              <div>
                <label className={styles.modalLabel}>{t('ad_col_to')}</label>
                <input className={`${styles.input} ${styles.inputDisabledOpacity}`} value={emailModal.email} disabled />
              </div>
              <div>
                <label className={styles.modalLabel}>{t('ad_col_subject')}</label>
                <input
                  className={styles.input}
                  placeholder={t('ad_reply_subject_placeholder')}
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                />
              </div>
              <div>
                <label className={styles.modalLabel}>{t('ad_message')}</label>
                <textarea
                  className={`${styles.input} ${styles.verticalResize}`}
                  rows={5}
                  placeholder={t('ad_response_placeholder')}
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                />
              </div>
              <button
                className={styles.btnPrimary}
                onClick={handleSendEmail}
                disabled={emailSending}
              >
                <Mail size={16} className={styles.btnIconMargin} />
                {emailSending ? t('ad_sending') : t('ad_send_email')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
