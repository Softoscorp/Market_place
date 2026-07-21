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
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import styles from '../agent-dashboard/Dashboard.module.css';
import { apiRequest, getAdminUsers, updateUserRole, getAdminConversations, getAdminConversationMessages } from '@/lib/api';

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

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  is_verified: boolean;
  account_status: string;
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
  const { user, isAuthenticated } = useAuthStore();
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
  const [emailModal, setEmailModal] = useState<{ email: string; name: string } | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'customer_care')) {
      router.push('/login');
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
                            <button className={styles.iconBtn} onClick={() => handleApproveKYC(doc.id)} title="Approve"><CheckCircle size={16} color="var(--success)" /></button>
                            <button className={styles.iconBtn} onClick={() => handleRejectKYC(doc.id)} title="Reject"><XCircle size={16} color="var(--danger)" /></button>
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
                        <span className={`${styles.statusBadge} ${styles.active}`}>{u.role}</span>
                      </td>
                      <td>
                        <select 
                          className={styles.input} 
                          style={{ padding: '0.25rem', width: 'auto' }}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="renter">Renter</option>
                          <option value="agent">Agent</option>
                          <option value="customer_care">Customer Care</option>
                        </select>
                        <button
                          className={styles.iconBtn}
                          style={{ marginLeft: '8px' }}
                          title={u.is_verified ? 'Revoke Verification' : 'Verify User'}
                          onClick={() => handleVerifyToggle(u.id, u.is_verified)}
                        >
                          <ShieldCheck size={16} color={u.is_verified ? 'var(--success)' : '#aaa'} />
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #ddd', borderRadius: '12px', padding: '1.5rem', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Conversation #{selectedConversation.id}</h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Renter:</strong> {selectedConversation.renter.name} &nbsp; | &nbsp; 
                      <strong>Agent:</strong> {selectedConversation.agent.name}
                    </p>
                  </div>
                  <button onClick={() => setSelectedConversation(null)} className={styles.btnSecondary} style={{ padding: '0.5rem 1rem' }}>
                    Back to List
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', padding: '1rem', background: '#fafafa', borderRadius: '8px' }}>
                  {chatMessages.length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>No messages yet.</p>}
                  {chatMessages.map(msg => {
                    const isRenter = msg.sender_id === selectedConversation.renter_id;
                    const senderName = isRenter ? selectedConversation.renter.name : selectedConversation.agent.name;
                    return (
                      <div key={msg.id} style={{
                        alignSelf: isRenter ? 'flex-start' : 'flex-end',
                        background: isRenter ? '#fff' : '#1e1e1e',
                        color: isRenter ? '#000' : '#fff',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        maxWidth: '70%',
                        border: isRenter ? '1px solid #eee' : 'none',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>{senderName}</div>
                        <div>{msg.content}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.25rem', textAlign: 'right' }}>
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
                    <p style={{ fontSize: '0.875rem', color: '#666' }}>Last message: {new Date(conv.last_message_at).toLocaleString()}</p>
                    <button 
                      className={styles.btnSecondary} 
                      style={{ width: '100%', marginTop: '1rem' }}
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
            {reports.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No reports found.</td></tr>}
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
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-surface)', borderRadius: '16px', padding: '2rem',
            width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Contact {emailModal.name}</h3>
              <button onClick={() => setEmailModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>To</label>
                <input className={styles.input} value={emailModal.email} disabled style={{ opacity: 0.7 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Subject</label>
                <input
                  className={styles.input}
                  placeholder="Re: Your complaint"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Message</label>
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
                <Mail size={16} style={{ marginRight: 8 }} />
                {emailSending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
