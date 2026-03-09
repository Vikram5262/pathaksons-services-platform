'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { localStore, Provider } from '@/lib/localStore';
import { Wallet, TrendingUp, Clock } from 'lucide-react';

export default function ProviderEarningsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [provider, setProvider] = useState<Provider | null>(null);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'provider')) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (user) setProvider(localStore.providers.getByUserId(user.id) || null);
    }, [user]);

    if (loading || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;

    const payoutHistory = [
        { date: 'Mar 5, 2026', amount: 720, job: 'Electrician – Rajesh K', status: 'Paid' },
        { date: 'Mar 2, 2026', amount: 450, job: 'Plumber – Sita M', status: 'Paid' },
        { date: 'Feb 28, 2026', amount: 2250, job: 'Cook – Priya R', status: 'Paid' },
    ];

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="provider" />
            <main className="main-content">
                <div className="content-area">
                    <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Earnings</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Your payout summary and history</p>

                    <div className="grid grid-3" style={{ gap: 16, marginBottom: 28 }}>
                        {[
                            { label: 'Total Earned', value: `₹${provider?.earnings.toLocaleString() || 0}`, icon: <Wallet size={20} />, color: '#059669', bg: '#F0FDF4' },
                            { label: 'Jobs Completed', value: provider?.totalJobs || 0, icon: <TrendingUp size={20} />, color: '#2563EB', bg: '#EFF6FF' },
                            { label: 'Pending Payout', value: '₹0', icon: <Clock size={20} />, color: '#D97706', bg: '#FFFBEB' },
                        ].map((s, i) => (
                            <div key={i} className="stat-card">
                                <div className="stat-icon" style={{ background: s.bg, color: s.color, marginBottom: 14 }}>{s.icon}</div>
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Payout History</h3>
                        <div className="table-wrap">
                            <table>
                                <thead><tr><th>Date</th><th>Job</th><th>Amount</th><th>Status</th></tr></thead>
                                <tbody>
                                    {payoutHistory.map((p, i) => (
                                        <tr key={i}>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.date}</td>
                                            <td style={{ fontWeight: 500 }}>{p.job}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{p.amount}</td>
                                            <td><div className="badge badge-success">{p.status}</div></td>
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
