'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { localStore } from '@/lib/localStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, UserCheck, CalendarDays, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const MOCK_REVENUE = [
    { day: 'Mon', amount: 4200 }, { day: 'Tue', amount: 6800 }, { day: 'Wed', amount: 5400 },
    { day: 'Thu', amount: 8200 }, { day: 'Fri', amount: 9600 }, { day: 'Sat', amount: 11200 }, { day: 'Sun', amount: 7400 },
];

export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({ users: 0, providers: 0, bookings: 0, revenue: 0, fraud: 0, pending: 0 });

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            localStore.seed();
            const allUsers = localStore.users.getAll();
            const allProviders = localStore.providers.getAll();
            const allBookings = localStore.bookings.getAll();
            const allPayments = localStore.payments.getAll();
            const allFraud = localStore.fraudLogs.getAll();
            setStats({
                users: allUsers.filter(u => u.role === 'customer').length,
                providers: allProviders.filter(p => p.overallStatus === 'approved').length,
                bookings: allBookings.length,
                revenue: allPayments.reduce((s, p) => s + p.platformFee, 0),
                fraud: allFraud.filter(f => f.actionTaken === 'flagged').length,
                pending: allProviders.filter(p => p.overallStatus === 'pending').length,
            });
        }
    }, [user]);

    if (loading || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;

    const statCards = [
        { label: 'Total Customers', value: stats.users, icon: <Users size={20} />, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)', delta: '+12%' },
        { label: 'Active Providers', value: stats.providers, icon: <UserCheck size={20} />, color: '#10B981', bg: 'rgba(16,185,129,0.12)', delta: '+8%' },
        { label: 'Total Bookings', value: stats.bookings, icon: <CalendarDays size={20} />, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', delta: '+24%' },
        { label: 'Revenue (Platform Fee)', value: `₹${stats.revenue.toLocaleString()}`, icon: <TrendingUp size={20} />, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', delta: '+18%' },
    ];

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="admin" />
            <main className="main-content">
                <div className="content-area">
                    <div style={{ marginBottom: 32 }}>
                        <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>Admin Dashboard</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Platform Overview</p>
                    </div>

                    {/* Alerts */}
                    {(stats.fraud > 0 || stats.pending > 0) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                            {stats.pending > 0 && (
                                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <CheckCircle size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                        <strong>{stats.pending} providers</strong> awaiting verification approval.
                                        <a href="/admin/providers" style={{ color: 'var(--brand-primary)', marginLeft: 8 }}>Review now →</a>
                                    </div>
                                </div>
                            )}
                            {stats.fraud > 0 && (
                                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                        <strong>{stats.fraud} fraud alerts</strong> pending review.
                                        <a href="/admin/fraud" style={{ color: 'var(--color-danger)', marginLeft: 8 }}>View logs →</a>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stat cards */}
                    <div className="grid grid-4" style={{ gap: 16, marginBottom: 32 }}>
                        {statCards.map((s, i) => (
                            <div key={i} className="stat-card">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                                    <div className="badge badge-success" style={{ fontSize: '0.62rem' }}>{s.delta}</div>
                                </div>
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="grid grid-2" style={{ gap: 20 }}>
                        <div className="card">
                            <h3 style={{ fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Weekly Revenue</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={MOCK_REVENUE}>
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                                    <Bar dataKey="amount" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="card">
                            <h3 style={{ fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Platform Activity</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={MOCK_REVENUE.map((d, i) => ({ ...d, bookings: 3 + i * 2, users: 5 + i }))}>
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                                    <Line dataKey="bookings" stroke="#06B6D4" strokeWidth={2} dot={false} />
                                    <Line dataKey="users" stroke="#10B981" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
