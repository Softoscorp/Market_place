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
  renter: { id: number; name: string };
  agent: { id: number; name: string };
  last_message_at: string;
}


interface AdminMessage {
  id: number;
  content: string;
  sender_id: number;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
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
  const [emailSending, setEmailSending] = useState(false);;

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
      alert('KYC Approved');
    } catch (error) {
      console.error(error);
      alert('Failed to approve KYC');
    }
  };

  const handleRejectKYC = async (id: number) => {
    try {
      await apiRequest(`/admin/kyc/${id}/reject`, { method: 'POST', auth: true });
      setKycDocs(docs => docs.map(d => d.id === id ? { ...d, status: 'rejected' } : d));
      alert('KYC Rejected');
    } catch (error) {
      console.error(error);
      alert('Failed to reject KYC');
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setAdminUsers(users => users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert('Role updated successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to update role');
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
      alert('Failed to update verification status');
    }
  };

  const handleSendEmail = async () => {
    if (!emailModal || !emailSubject || !emailBody) return;
    setEmailSending(true);
    try {
      await apiRequest('/admin/send-email', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ email: emailModal.email, subject: emailSubject, content: emailBody }),
      });
      alert('Email sent successfully!');
      setEmailModal(null);
      setEmailSubject('');
      setEmailBody('');
    } catch (error) {
      console.error(error);
      alert('Failed to send email. Make sure RESEND_API_KEY is configured.');
    } finally {
      setEmailSending(false);
    }
  };

  const handleOpenChat = async (conv: AdminConversation) => {
    setSelectedConversation(conv);
    try {
      const msgs = await getAdminConversationMessages(conv.id);
      setChatMessages(msgs || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load messages");
    }
  };



  if (isCheckingAuth) return <div className={styles.loaderContainer}><div className={styles.loader}></div></div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.overviewTab}>
            <h3 className={styles.sectionTitle}>System Overview</h3>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>Pending KYC</span>
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
              <h3 className={styles.sectionTitle}>KYC Management</h3>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Document Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kycDocs.map(doc => (
                    <tr key={doc.id}>
                      <td className={styles.fw500}>{doc.agent?.name || `Agent #${doc.agent_id}`}</td>
                      <td>{doc.document_type}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${doc.status === 'approved' ? styles.active : doc.status === 'rejected' ? styles.paused : ''}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td>
                        {doc.status === 'pending' && (
                          <div className={styles.actionButtons}>
                            <button className={styles.iconBtn} onClick={() => handleApproveKYC(doc.id)} title="Approve" aria-label="Approve"><CheckCircle size={16} color="var(--success)" /></button>
                            <button className={styles.iconBtn} onClick={() => handleRejectKYC(doc.id)} title="Reject" aria-label="Reject"><XCircle size={16} color="var(--danger)" /></button>
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
              <h3 className={styles.sectionTitle}>Agent Verification Applications</h3>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Agent ID</th>
                    <th>Requested Tier</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map(app => (
                    <tr key={app.id}>
                      <td className={styles.fw500}>#{app.agent_id}</td>
                      <td>
                        <span className={styles.statusBadge} style={{ 
                          background: app.tier === 'international' ? 'var(--warning-muted)' : 'var(--bg-hover)',
                          color: app.tier === 'international' ? 'var(--warning-text)' : 'var(--text-secondary)'
                        }}>
                          {app.tier}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${app.status === 'approved' ? styles.active : app.status === 'rejected' ? styles.paused : ''}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          {app.status === 'pending' && (
                            <>
                              <button 
                                className={styles.actionBtn} 
                                onClick={async () => {
                                  try {
                                    await approveVerification(app.id);
                                    setVerifications(apps => apps.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
                                    alert('Approved verification');
                                  } catch (e) {
                                    console.error(e);
                                    alert('Failed to approve');
                                  }
                                }}
                                title="Approve"
                                aria-label="Approve verification"
                              >
                                <CheckCircle size={16} color="var(--success)" />
                              </button>
                              <button 
                                className={styles.actionBtn} 
                                onClick={async () => {
                                  const reason = prompt('Rejection reason:');
                                  if (reason === null) return;
                                  try {
                                    await rejectVerification(app.id, reason);
                                    setVerifications(apps => apps.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a));
                                    alert('Rejected verification');
                                  } catch (e) {
                                    console.error(e);
                                    alert('Failed to reject');
                                  }
                                }}
title="Reject"
                                    aria-label="Reject verification"
                                  >
                                    <XCircle size={16} color="var(--danger)" />
                                  </button>
                            </>
                          )}
                          {app.proof_urls.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', textDecoration: 'underline' }}>
                              Proof {idx + 1}
                            </a>
                          ))}
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
              <h3 className={styles.sectionTitle}>User Management</h3>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Current Role</th>
                    <th>Actions</th>
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
                          const label = online ? 'Online now' : diffMin === null ? 'Never' : diffMin < 60 ? `${diffMin}m ago` : `${Math.floor(diffMin/60)}h ago`;
                          return (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <span style={{ width: 'var(--space-2)', height: 'var(--space-2)', borderRadius: '50%', background: online ? 'var(--success)' : 'var(--text-muted)', display: 'inline-block', boxShadow: online ? '0 0 4px var(--success)' : 'none' }} />
                              <span style={{ fontSize: 'var(--text-sm)', color: online ? 'var(--success)' : 'var(--text-muted)' }}>{label}</span>
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
                          className={styles.input} 
                          style={{ padding: 'var(--space-1)', width: 'auto' }}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="renter">Renter</option>
                          <option value="agent">Agent</option>
                          <option value="customer_care">Customer Care</option>
                        </select>
                        
                        <select 
                          className={styles.input} 
                          style={{ padding: 'var(--space-1)', width: 'auto', marginLeft: 'var(--space-2)' }}
                          value={u.account_status || 'active'}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            let reason = "";
                            if (newStatus !== 'active') {
                              const input = prompt(`Reason for changing status to ${newStatus}:`);
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
                              alert('Account status updated');
                            } catch (err) {
                              alert('Failed to update account status');
                            }
                          }}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="banned">Banned</option>
                        </select>
                        
                        <button
                          className={styles.iconBtn}
                          style={{ marginLeft: 'var(--space-2)' }}
                          title={u.is_verified ? 'Revoke Verification' : 'Verify User'}
                          aria-label={u.is_verified ? 'Revoke verification' : 'Verify user'}
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
            <h3 className={styles.sectionTitle}>Support Chats</h3>
            <p>Customer Care agents can view and respond to platform conversations.</p>
            
            {selectedConversation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-4)' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Conversation #{selectedConversation.id}</h4>
                    <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      <strong>Renter:</strong> {selectedConversation.renter.name} &nbsp; | &nbsp; 
                      <strong>Agent:</strong> {selectedConversation.agent.name}
                    </p>
                  </div>
                  <button onClick={() => setSelectedConversation(null)} className={styles.btnSecondary} style={{ padding: 'var(--space-2) var(--space-4)' }}>
                    Back to List
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '400px', overflowY: 'auto', padding: 'var(--space-4)', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                  {chatMessages.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No messages yet.</p>}
                  {chatMessages.map(msg => {
                    const isRenter = msg.sender_id === selectedConversation.renter_id;
                    const senderName = isRenter ? selectedConversation.renter.name : selectedConversation.agent.name;
                    return (
                      <div key={msg.id} style={{
                        alignSelf: isRenter ? 'flex-start' : 'flex-end',
                        background: isRenter ? 'var(--bg-surface)' : 'var(--text-primary)',
                        color: isRenter ? 'var(--text-primary)' : 'var(--text-inverse)',
                        padding: 'var(--space-3) var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        maxWidth: '70%',
                        border: isRenter ? '1px solid var(--border-subtle)' : 'none',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <div style={{ fontSize: 'var(--text-xs)', opacity: 0.8, marginBottom: 'var(--space-1)' }}>{senderName}</div>
                        <div>{msg.content}</div>
                        <div style={{ fontSize: 'var(--text-xs)', opacity: 0.6, marginTop: 'var(--space-1)', textAlign: 'right' }}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={styles.crmGrid}>
                {conversations.length === 0 && <p>No active conversations found.</p>}
                {conversations.map(conv => (
                  <div key={conv.id} className={styles.crmCard}>
                    <div className={styles.crmHeader}>
                      <h4>{conv.renter.name} & {conv.agent.name}</h4>
                    </div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Last message: {new Date(conv.last_message_at).toLocaleString()}</p>
                    <button 
                      className={styles.btnSecondary} 
                      style={{ width: '100%', marginTop: 'var(--space-4)' }}
                      onClick={() => handleOpenChat(conv)}
                    >
                      <MessageSquare size={14} /> Open Support Chat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      default: return null;
    }
  };

  // Shared Reports/Complaints tab for both admin and customer_care
  const renderReportsTab = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.listingsTab}>
      <div className={styles.tabHeader}>
        <h3 className={styles.sectionTitle}>Reports &amp; Complaints</h3>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Reporter</th>
              <th>Target</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No reports found.</td></tr>}
            {reports.map(r => (
              <tr key={r.id}>
                <td className={styles.fw500}>{r.reporter.name}</td>
                <td>{r.target_type} #{r.target_id}</td>
                <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</td>
                <td><span className={`${styles.statusBadge} ${r.status === 'reviewed' ? styles.active : ''}`}>{r.status}</span></td>
                <td>
                  <button
                    className={styles.iconBtn}
                    title={`Email ${r.reporter.name}`}
                    aria-label={`Email ${r.reporter.name}`}
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
          <h2>Admin Panel</h2>
          <p>{user?.name} ({user?.role})</p>
        </div>
        <nav className={styles.nav}>
          {user?.role === 'admin' && (
            <>
              <button 
                className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <PremiumIcon icon={LayoutDashboard} size={14} colorVariant="primary" containerSize={24} /> Overview
              </button>
              <button 
                className={`${styles.navItem} ${activeTab === 'kyc' ? styles.active : ''}`}
                onClick={() => setActiveTab('kyc')}
              >
                <PremiumIcon icon={FileText} size={14} colorVariant="primary" containerSize={24} /> KYC Verification
              </button>
              <button 
                className={`${styles.navItem} ${activeTab === 'verifications' ? styles.active : ''}`}
                onClick={() => { setActiveTab('verifications'); getAdminVerifications().then(data => setVerifications(data || [])).catch(console.error); }}
              >
                <PremiumIcon icon={Award} size={14} colorVariant="primary" containerSize={24} /> Agent Tiers
              </button>
              <button 
                className={`${styles.navItem} ${activeTab === 'users' ? styles.active : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <PremiumIcon icon={Users} size={14} colorVariant="primary" containerSize={24} /> User Management
              </button>
              <button 
                className={`${styles.navItem} ${activeTab === 'reports' ? styles.active : ''}`}
                onClick={() => { setActiveTab('reports'); apiRequest('/admin/reports', { auth: true }).then(d => setReports(d || [])).catch(console.error); }}
              >
                <PremiumIcon icon={AlertTriangle} size={14} colorVariant="primary" containerSize={24} /> Reports
              </button>
            </>
          )}
          <button 
            className={`${styles.navItem} ${activeTab === 'chats' ? styles.active : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <PremiumIcon icon={MessageSquare} size={14} colorVariant="primary" containerSize={24} /> Support Chats
          </button>
          
          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-8)' }}>
            <button 
              className={styles.navItem}
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
              style={{ color: 'var(--danger)' }}
            >
              <PremiumIcon icon={LogOut} size={14} colorVariant="danger" containerSize={24} /> Sign Out
            </button>
          </div>
        </nav>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.topbar}>
          <h1 className={styles.pageTitle}>
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'kyc' && 'KYC Verification'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'chats' && 'Customer Support'}
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
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--scrim)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)',
            width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ margin: 0 }}>Contact {emailModal.name}</h3>
              <button onClick={() => setEmailModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, display: 'block', marginBottom: 'var(--space-2)' }}>To</label>
                <input className={styles.input} value={emailModal.email} disabled style={{ opacity: 0.7 }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, display: 'block', marginBottom: 'var(--space-2)' }}>Subject</label>
                <input
                  className={styles.input}
                  placeholder="Re: Your complaint"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, display: 'block', marginBottom: 'var(--space-2)' }}>Message</label>
                <textarea
                  className={styles.input}
                  rows={5}
                  placeholder="Write your response here..."
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <button
                className={styles.btnPrimary}
                onClick={handleSendEmail}
                disabled={emailSending}
              >
                <Mail size={16} style={{ marginRight: 'var(--space-2)' }} />
                {emailSending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
