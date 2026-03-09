'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { localStore, Provider } from '@/lib/localStore';
import { Search, Check, X, UserX, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProvidersPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [providers, setProviders] = useState<Provider[]>([]);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');

    const reload = () => setProviders(localStore.providers.getAll());
    useEffect(() => { if (!loading && (!user || user.role !== 'admin')) router.push('/login'); }, [user, loading, router]);
    useEffect(() => { if (user) reload(); }, [user]);

    const filtered = providers.filter(p => {
        const qOk = !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.phone.includes(query);
        const fOk = filter === 'all' || p.overallStatus === filter;
        return qOk && fOk;
    });

    const action = (id: string, status: Provider['overallStatus'], label: string) => {
        localStore.providers.update(id, { overallStatus: status });
        // Also update user status
        const provider = localStore.providers.getById(id);
        if (provider) localStore.users.update(provider.userId, { verificationStatus: status === 'approved' ? 'verified' : status === 'rejected' ? 'suspended' : status });
        reload();
        toast.success(`Provider ${label}`);
    };

    const statusBadge = (s: string) => ({ approved: 'badge-success', pending: 'badge-warning', rejected: 'badge-danger', suspended: 'badge-danger' }[s] || 'badge-muted');
    const docStatus = (s: string) => s === 'verified' ? '✅' : s === 'pending' ? '⏳' : '❌';

    if (loading || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="admin" />
            <main className="main-content">
                <div className="content-area">
                    <div style={{ marginBottom: 24 }}>
                        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Provider Management</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{providers.filter(p => p.overallStatus === 'pending').length} pending verification</p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                        <div className="search-bar" style={{ flex: 1 }}>
                            <Search size={16} style={{ color: 'var(--text-muted)' }} />
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search providers..." />
                        </div>
                        <select className="input" style={{ width: 170 }} value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>

                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr><th>Provider</th><th>Skills</th><th>City</th><th>Docs</th><th>Status</th><th>Rating</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="avatar avatar-sm">{p.name.charAt(0)}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{p.name}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.78rem' }}>{p.skillCategories.join(', ')}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{p.city}</td>
                                        <td>
                                            <div title={`Aadhaar:${p.aadhaarStatus} | Selfie:${p.selfieStatus} | Bank:${p.bankStatus} | Police:${p.policeVerificationStatus}`} style={{ display: 'flex', gap: 2, fontSize: '0.85rem', cursor: 'help' }}>
                                                <span title="Aadhaar">{docStatus(p.aadhaarStatus)}</span>
                                                <span title="Selfie">{docStatus(p.selfieStatus)}</span>
                                                <span title="Bank">{docStatus(p.bankStatus)}</span>
                                                <span title="Police">{docStatus(p.policeVerificationStatus)}</span>
                                            </div>
                                        </td>
                                        <td><div className={`badge ${statusBadge(p.overallStatus)}`}>{p.overallStatus}</div></td>
                                        <td style={{ fontSize: '0.85rem' }}>{p.rating ? `${p.rating}★` : '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {p.overallStatus === 'pending' && (
                                                    <>
                                                        <button className="btn btn-sm btn-success" onClick={() => action(p.id, 'approved', 'approved')}><Check size={12} /> Approve</button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => action(p.id, 'rejected', 'rejected')}><X size={12} /></button>
                                                    </>
                                                )}
                                                {p.overallStatus === 'approved' && (
                                                    <button className="btn btn-sm btn-danger" onClick={() => action(p.id, 'suspended', 'suspended')}><UserX size={12} /> Suspend</button>
                                                )}
                                                {(p.overallStatus === 'suspended' || p.overallStatus === 'rejected') && (
                                                    <button className="btn btn-sm btn-success" onClick={() => action(p.id, 'approved', 'restored')}><RefreshCw size={12} /> Restore</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No providers found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
