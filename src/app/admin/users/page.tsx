'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { localStore, User } from '@/lib/localStore';
import { Search, UserX, Ban, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');

    const reload = () => {
        const all = localStore.users.getAll().filter(u => u.role === 'customer');
        setUsers(all);
    };

    useEffect(() => { if (!loading && (!user || user.role !== 'admin')) router.push('/login'); }, [user, loading, router]);
    useEffect(() => { if (user) reload(); }, [user]);

    const filtered = users.filter(u => {
        const qOk = !query || u.name.toLowerCase().includes(query.toLowerCase()) || u.phone.includes(query);
        const fOk = filter === 'all' || u.verificationStatus === filter;
        return qOk && fOk;
    });

    const action = (id: string, status: User['verificationStatus'], label: string) => {
        localStore.users.update(id, { verificationStatus: status });
        reload();
        toast.success(`User ${label}`);
    };

    const statusBadge = (s: string) => {
        const map: Record<string, string> = { verified: 'badge-success', pending: 'badge-warning', suspended: 'badge-danger', blacklisted: 'badge-danger' };
        return map[s] || 'badge-muted';
    };

    if (loading || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="admin" />
            <main className="main-content">
                <div className="content-area">
                    <div style={{ marginBottom: 24 }}>
                        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Manage Customers</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{users.length} registered customers</p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                        <div className="search-bar" style={{ flex: 1 }}>
                            <Search size={16} style={{ color: 'var(--text-muted)' }} />
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or phone..." />
                        </div>
                        <select className="input" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="verified">Verified</option>
                            <option value="suspended">Suspended</option>
                            <option value="blacklisted">Blacklisted</option>
                        </select>
                    </div>

                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th><th>Phone</th><th>City</th><th>Status</th><th>Joined</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="avatar avatar-sm">{u.name.charAt(0)}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{u.name}</div>
                                                    {u.email && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td>{u.phone}</td>
                                        <td>{u.city || '—'}</td>
                                        <td><div className={`badge ${statusBadge(u.verificationStatus)}`}>{u.verificationStatus}</div></td>
                                        <td style={{ fontSize: '0.78rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {u.verificationStatus !== 'suspended' && u.verificationStatus !== 'blacklisted' && (
                                                    <button className="btn btn-sm btn-danger" title="Suspend" onClick={() => action(u.id, 'suspended', 'suspended')}><UserX size={12} /></button>
                                                )}
                                                {u.verificationStatus !== 'blacklisted' && (
                                                    <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.7rem', padding: '4px 8px', borderRadius: 6 }} onClick={() => action(u.id, 'blacklisted', 'blacklisted')}>
                                                        <Ban size={12} /> Ban
                                                    </button>
                                                )}
                                                {(u.verificationStatus === 'suspended' || u.verificationStatus === 'blacklisted') && (
                                                    <button className="btn btn-sm btn-success" title="Restore" onClick={() => action(u.id, 'verified', 'restored')}><RefreshCw size={12} /> Restore</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No customers found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
