'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { localStore, Provider, Booking } from '@/lib/localStore';
import Link from 'next/link';

export default function ProviderJobsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [provider, setProvider] = useState<Provider | null>(null);
    const [jobs, setJobs] = useState<Booking[]>([]);
    const [tab, setTab] = useState<'active' | 'history'>('active');

    useEffect(() => { if (!loading && (!user || user.role !== 'provider')) router.push('/login'); }, [user, loading, router]);
    useEffect(() => {
        if (user) {
            const p = localStore.providers.getByUserId(user.id);
            setProvider(p || null);
            if (p) setJobs(localStore.bookings.getByProvider(p.id));
        }
    }, [user]);

    if (loading || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;

    const active = jobs.filter(j => ['pending', 'accepted', 'in_progress'].includes(j.status));
    const history = jobs.filter(j => ['completed', 'cancelled'].includes(j.status));
    const shown = tab === 'active' ? active : history;

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="provider" />
            <main className="main-content">
                <div className="content-area">
                    <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>My Jobs</h1>
                    <div className="tab-bar" style={{ marginBottom: 20 }}>
                        <button className={`tab-btn${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>Active ({active.length})</button>
                        <button className={`tab-btn${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>History ({history.length})</button>
                    </div>
                    {shown.length === 0 ? (
                        <div className="card empty-state">
                            <div className="empty-icon">🛠️</div>
                            <p style={{ color: 'var(--text-muted)' }}>No {tab} jobs. Make sure you are online!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {shown.map(j => (
                                <Link key={j.id} href={`/provider/jobs/${j.id}`} style={{ textDecoration: 'none' }}>
                                    <div className="card card-sm" style={{ cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🛠️</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{j.serviceType} – {j.customerName}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{j.scheduledDate} • {j.timeSlot} • {j.city}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{j.amount}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{j.status.replace('_', ' ')}</div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
