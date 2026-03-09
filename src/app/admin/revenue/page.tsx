'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { localStore } from '@/lib/localStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Users, Percent } from 'lucide-react';

const MONTHLY = [
    { month: 'Oct', revenue: 42000, bookings: 85 }, { month: 'Nov', revenue: 58000, bookings: 120 },
    { month: 'Dec', revenue: 76000, bookings: 155 }, { month: 'Jan', revenue: 65000, bookings: 138 },
    { month: 'Feb', revenue: 89000, bookings: 178 }, { month: 'Mar', revenue: 102000, bookings: 210 },
];
const CITY_DATA = [
    { name: 'Indore', value: 45 }, { name: 'Bhopal', value: 28 }, { name: 'Jabalpur', value: 14 },
    { name: 'Ujjain', value: 8 }, { name: 'Others', value: 5 },
];
const COLORS = ['#F59E0B', '#06B6D4', '#10B981', '#8B5CF6', '#EC4899'];

export default function AdminRevenuePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [stats, setStats] = useState({ bookings: 0, avgTicket: 0 });

    useEffect(() => { if (!loading && (!user || user.role !== 'admin')) router.push('/login'); }, [user, loading, router]);
    useEffect(() => {
        if (user) {
            const payments = localStore.payments.getAll();
            const bookings = localStore.bookings.getAll();
            const rev = payments.reduce((s, p) => s + p.platformFee, 0);
            setTotalRevenue(rev);
            setStats({ bookings: bookings.length, avgTicket: bookings.length ? Math.round(bookings.reduce((s, b) => s + b.amount, 0) / bookings.length) : 0 });
        }
    }, [user]);

    if (loading || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="admin" />
            <main className="main-content">
                <div className="content-area">
                    <div style={{ marginBottom: 28 }}>
                        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Revenue Analytics</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Platform commission and transaction insights</p>
                    </div>

                    <div className="grid grid-3" style={{ gap: 16, marginBottom: 28 }}>
                        {[
                            { label: 'Platform Revenue (10%)', value: `₹${totalRevenue.toLocaleString()}`, icon: <DollarSign size={20} />, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                            { label: 'Total Bookings', value: stats.bookings, icon: <Users size={20} />, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
                            { label: 'Avg. Ticket Size', value: `₹${stats.avgTicket}`, icon: <Percent size={20} />, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                        ].map((s, i) => (
                            <div key={i} className="stat-card">
                                <div className="stat-icon" style={{ background: s.bg, color: s.color, marginBottom: 16 }}>{s.icon}</div>
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-2" style={{ gap: 20, marginBottom: 20 }}>
                        <div className="card">
                            <h3 style={{ fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Monthly Revenue (₹)</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={MONTHLY}>
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                    <Tooltip formatter={((v: unknown) => [`₹${Number(v).toLocaleString()}`, 'Revenue']) as any} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 8 }} />
                                    <Bar dataKey="revenue" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="card">
                            <h3 style={{ fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Revenue by City</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                <ResponsiveContainer width="55%" height={180}>
                                    <PieChart>
                                        <Pie data={CITY_DATA} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                                            {CITY_DATA.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={((v: unknown) => [`${Number(v)}%`, 'Share']) as any} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 8 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ flex: 1 }}>
                                    {CITY_DATA.map((c, i) => (
                                        <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '0.82rem' }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
                                            <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{c.name}</span>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly table */}
                    <div className="card">
                        <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Monthly Breakdown</h3>
                        <div className="table-wrap">
                            <table>
                                <thead><tr><th>Month</th><th>Bookings</th><th>Gross Revenue</th><th>Platform Fee (10%)</th><th>Provider Payout (90%)</th></tr></thead>
                                <tbody>
                                    {MONTHLY.map(m => (
                                        <tr key={m.month}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.month} 2026</td>
                                            <td>{m.bookings}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{m.revenue.toLocaleString()}</td>
                                            <td style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>₹{Math.round(m.revenue * 0.1).toLocaleString()}</td>
                                            <td style={{ color: 'var(--color-success)' }}>₹{Math.round(m.revenue * 0.9).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
