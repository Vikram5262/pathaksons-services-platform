'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { localStore, FraudLog, Complaint } from '@/lib/localStore';
import { AlertTriangle, CheckCircle, Shield, Search, Flag, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFraudPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<FraudLog[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [tab, setTab] = useState<'fraud' | 'complaints'>('fraud');

    const reload = () => {
        setLogs(localStore.fraudLogs.getAll().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setComplaints(localStore.complaints.getAll().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };
    useEffect(() => { if (!loading && (!user || user.role !== 'admin')) router.push('/login'); }, [user, loading, router]);
    useEffect(() => { if (user) reload(); }, [user]);

    const updateFraud = (id: string, action: FraudLog['actionTaken'], label: string) => {
        localStore.fraudLogs.update(id, { actionTaken: action });
        reload(); toast.success(`Action: ${label}`);
    };

    const updateComplaint = (id: string, status: Complaint['status'], label: string) => {
        localStore.complaints.update(id, { status });
        reload(); toast.success(label);
    };

    const suspendProviderFromComplaint = (providerId: string, providerName: string) => {
        if (!providerId) { toast.error('No provider linked to this complaint'); return; }
        localStore.providers.update(providerId, { overallStatus: 'suspended' });
        toast.success(`Provider "${providerName}" suspended`);
        reload();
    };

    const filteredLogs = logs.filter(l => {
        const qOk = !query || l.userName.toLowerCase().includes(query.toLowerCase()) || l.fraudType.toLowerCase().includes(query.toLowerCase());
        const fOk = filter === 'all' || l.severity === filter || l.actionTaken === filter;
        return qOk && fOk;
    });

    const filteredComplaints = complaints.filter(c => {
        const qOk = !query || c.providerName.toLowerCase().includes(query.toLowerCase()) || c.customerName.toLowerCase().includes(query.toLowerCase()) || c.reason.toLowerCase().includes(query.toLowerCase());
        const fOk = filter === 'all' || c.status === filter;
        return qOk && fOk;
    });

    const severityBadge: Record<string, string> = { low: 'badge-info', medium: 'badge-warning', high: 'badge-danger' };
    const actionBadge: Record<string, string> = { flagged: 'badge-warning', suspended: 'badge-danger', blacklisted: 'badge-danger', cleared: 'badge-success' };
    const complaintStatusBadge: Record<string, string> = { open: 'badge-warning', reviewed: 'badge-info', resolved: 'badge-success' };

    // Count auto-flagged providers
    const autoFlaggedCount = localStore.providers.getAll().filter(p => (p.complaintCount || 0) >= 3).length;

    if (loading || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="admin" />
            <main className="main-content">
                <div className="content-area">
                    <div style={{ marginBottom: 24 }}>
                        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Safety & Fraud Controls</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                            {logs.length} fraud logs · {complaints.length} complaints · {autoFlaggedCount > 0 && <span style={{ color: '#EF4444', fontWeight: 600 }}>{autoFlaggedCount} provider(s) auto-flagged</span>}
                        </p>
                    </div>

                    {/* Auto-flag alert */}
                    {autoFlaggedCount > 0 && (
                        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)', borderRadius: 12, marginBottom: 20 }}>
                            <AlertTriangle size={18} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                <strong style={{ color: '#EF4444' }}>⚠️ Auto-Suspension Alert:</strong> {autoFlaggedCount} provider(s) have been automatically suspended due to receiving 3 or more complaints. Review and take action below.
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="tab-bar" style={{ marginBottom: 24 }}>
                        <button className={`tab-btn${tab === 'fraud' ? ' active' : ''}`} onClick={() => setTab('fraud')}>
                            <Shield size={14} style={{ display: 'inline', marginRight: 5 }} /> Fraud Logs ({logs.length})
                        </button>
                        <button className={`tab-btn${tab === 'complaints' ? ' active' : ''}`} onClick={() => setTab('complaints')}>
                            <Flag size={14} style={{ display: 'inline', marginRight: 5 }} /> Provider Complaints ({complaints.length})
                        </button>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                        <div className="search-bar" style={{ flex: 1 }}>
                            <Search size={16} style={{ color: 'var(--text-muted)' }} />
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={tab === 'fraud' ? 'Search fraud logs...' : 'Search complaints...'} />
                        </div>
                        <select className="input" style={{ width: 170 }} value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="all">All</option>
                            {tab === 'fraud' ? (
                                <>
                                    <option value="high">High Severity</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                    <option value="flagged">Flagged</option>
                                    <option value="cleared">Cleared</option>
                                </>
                            ) : (
                                <>
                                    <option value="open">Open</option>
                                    <option value="reviewed">Under Review</option>
                                    <option value="resolved">Resolved</option>
                                </>
                            )}
                        </select>
                        <button className="btn btn-secondary btn-sm" onClick={reload} title="Refresh"><RefreshCw size={14} /></button>
                    </div>

                    {/* Fraud Logs Tab */}
                    {tab === 'fraud' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {filteredLogs.map(log => (
                                <div key={log.id} className="card card-sm" style={{ borderLeft: `3px solid ${log.severity === 'high' ? '#EF4444' : log.severity === 'medium' ? '#F59E0B' : '#06B6D4'}` }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: log.severity === 'high' ? 'rgba(239,68,68,0.1)' : log.severity === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <AlertTriangle size={18} style={{ color: log.severity === 'high' ? '#EF4444' : log.severity === 'medium' ? '#F59E0B' : '#06B6D4' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{log.fraudType}</span>
                                                <div className={`badge ${severityBadge[log.severity]}`}>{log.severity}</div>
                                                <div className={`badge ${actionBadge[log.actionTaken]}`}>{log.actionTaken}</div>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                                                User: <strong style={{ color: 'var(--text-secondary)' }}>{log.userName}</strong> · {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{log.description}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                            {log.actionTaken === 'flagged' && (
                                                <>
                                                    <button className="btn btn-sm btn-danger" onClick={() => updateFraud(log.id, 'suspended', 'User Suspended')}>Suspend</button>
                                                    <button className="btn btn-sm btn-success" onClick={() => updateFraud(log.id, 'cleared', 'Cleared')}><CheckCircle size={12} /></button>
                                                </>
                                            )}
                                            {log.actionTaken === 'suspended' && (
                                                <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: 'none', borderRadius: 6, fontSize: '0.72rem', padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => updateFraud(log.id, 'blacklisted', 'Blacklisted')}>
                                                    <Shield size={10} /> Blacklist
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredLogs.length === 0 && (
                                <div className="card empty-state">
                                    <div className="empty-icon">🛡️</div>
                                    <p style={{ color: 'var(--text-muted)' }}>No fraud logs found.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Complaints Tab */}
                    {tab === 'complaints' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {filteredComplaints.map(c => {
                                const provider = c.providerId ? localStore.providers.getById(c.providerId) : null;
                                return (
                                    <div key={c.id} className="card card-sm" style={{ borderLeft: '3px solid #EF4444' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Flag size={18} style={{ color: '#EF4444' }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{c.reason}</span>
                                                    <div className={`badge ${complaintStatusBadge[c.status]}`}>{c.status}</div>
                                                    {provider && provider.complaintCount && provider.complaintCount >= 3 && (
                                                        <div className="badge badge-danger">⚠️ Auto-Suspended</div>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 5 }}>
                                                    Provider: <strong style={{ color: '#EF4444' }}>{c.providerName}</strong> · Reported by: <strong>{c.customerName}</strong>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: c.description ? 6 : 0 }}>
                                                    Booking ID: #{c.bookingId.slice(-6).toUpperCase()} · {new Date(c.createdAt).toLocaleDateString()}
                                                </div>
                                                {c.description && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.description}</div>}
                                                {provider && (
                                                    <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        Provider total complaints: <strong style={{ color: (provider.complaintCount || 0) >= 3 ? '#EF4444' : 'var(--text-primary)' }}>{provider.complaintCount || 0}</strong>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                                                {c.status === 'open' && (
                                                    <button className="btn btn-sm btn-secondary" onClick={() => updateComplaint(c.id, 'reviewed', 'Marked as under review')}>
                                                        Review
                                                    </button>
                                                )}
                                                {(c.status === 'open' || c.status === 'reviewed') && (
                                                    <>
                                                        <button className="btn btn-sm btn-success" onClick={() => updateComplaint(c.id, 'resolved', 'Complaint resolved')}>
                                                            <CheckCircle size={12} /> Resolve
                                                        </button>
                                                        {c.providerId && provider?.overallStatus !== 'suspended' && (
                                                            <button className="btn btn-sm btn-danger" onClick={() => suspendProviderFromComplaint(c.providerId, c.providerName)} style={{ fontSize: '0.72rem' }}>
                                                                Suspend Provider
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredComplaints.length === 0 && (
                                <div className="card empty-state">
                                    <div className="empty-icon">✅</div>
                                    <p style={{ color: 'var(--text-muted)' }}>No complaints filed. Platform is healthy!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
