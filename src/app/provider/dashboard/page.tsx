'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { localStore, Provider, Booking } from '@/lib/localStore';
import Link from 'next/link';
import { ToggleLeft, ToggleRight, Wallet, Star, CalendarDays, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProviderDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [provider, setProvider] = useState<Provider | null>(null);
    const [jobs, setJobs] = useState<Booking[]>([]);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const reload = () => {
        if (!user) return;
        const p = localStore.providers.getByUserId(user.id);
        setProvider(p || null);
        if (p) {
            const all = localStore.bookings.getByProvider(p.id);
            setJobs(all);
        }
    };

    useEffect(() => {
        if (!loading && (!user || user.role !== 'provider')) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => { if (user) reload(); }, [user]);

    if (loading || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;

    const activeJobs = jobs.filter(j => ['pending', 'accepted', 'in_progress'].includes(j.status));
    const completedJobs = jobs.filter(j => j.status === 'completed');

    const stars = (r: number) => Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < Math.round(r) ? '#F59E0B' : 'var(--bg-border)', fontSize: '0.9rem' }}>★</span>
    ));

    if (!provider) {
        return (
            <div className="layout-with-sidebar">
                <Sidebar role="provider" />
                <main className="main-content">
                    <div className="content-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                        <div style={{ textAlign: 'center', maxWidth: 420 }}>
                            <div style={{ fontSize: '3rem', marginBottom: 16 }}>⏳</div>
                            <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Verification Pending</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
                                Your application is under review. An admin will approve your profile within 24 hours. You'll be notified once verified.
                            </p>
                            <div className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                                <Clock size={12} /> Awaiting Admin Approval
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="provider" />
            <main className="main-content">
                <div className="content-area">
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                        <div className="avatar avatar-lg">{user.name.charAt(0)}</div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {user.name}
                                </h1>
                                <div className={`badge ${provider.overallStatus === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                                    <CheckCircle size={10} /> {provider.overallStatus}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                <div style={{ display: 'flex' }}>{stars(provider.rating)}</div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{provider.rating} • {provider.skillCategories.join(', ')}</span>
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{provider.isAvailable ? 'Online' : 'Offline'}</span>
                            <button onClick={() => { localStore.providers.update(provider.id, { isAvailable: !provider.isAvailable }); reload(); toast.success(provider.isAvailable ? 'You are now offline' : 'You are now available'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: provider.isAvailable ? 'var(--color-success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                {provider.isAvailable ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-4" style={{ gap: 16, marginBottom: 32 }}>
                        {[
                            { label: 'Total Earnings', value: `₹${provider.earnings.toLocaleString()}`, icon: '💰', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                            { label: 'Jobs Completed', value: provider.totalJobs, icon: '✅', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                            { label: 'Rating', value: provider.rating || 'New', icon: '⭐', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                            { label: 'Active Jobs', value: activeJobs.length, icon: '🛠️', color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
                        ].map((s, i) => (
                            <div key={i} className="stat-card">
                                <div className="stat-icon" style={{ background: s.bg, fontSize: '1.2rem', marginBottom: 12 }}>{s.icon}</div>
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Jobs */}
                    <div className="tab-bar" style={{ marginBottom: 20 }}>
                        <button className={`tab-btn${activeTab === 'active' ? ' active' : ''}`} onClick={() => setActiveTab('active')}>
                            Active Jobs ({activeJobs.length})
                        </button>
                        <button className={`tab-btn${activeTab === 'history' ? ' active' : ''}`} onClick={() => setActiveTab('history')}>
                            History ({completedJobs.length})
                        </button>
                    </div>

                    {(activeTab === 'active' ? activeJobs : completedJobs).length === 0 ? (
                        <div className="card empty-state">
                            <div className="empty-icon">📋</div>
                            <p style={{ color: 'var(--text-muted)' }}>{activeTab === 'active' ? 'No active jobs right now.' : 'No completed jobs yet.'}</p>
                            {activeTab === 'active' && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 6 }}>Make sure you are online to receive jobs.</p>}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {(activeTab === 'active' ? activeJobs : completedJobs).map(j => (
                                <Link key={j.id} href={`/provider/jobs/${j.id}`} style={{ textDecoration: 'none' }}>
                                    <div className="card card-sm" style={{ cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🛠️</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{j.serviceType} – {j.customerName}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{j.scheduledDate} • {j.timeSlot}</div>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{j.amount}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 2 }}>{j.status.replace('_', ' ')}</div>
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
