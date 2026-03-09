'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { localStore, Booking } from '@/lib/localStore';
import Link from 'next/link';
import { CalendarDays, Clock, CheckCircle, AlertCircle, Briefcase, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
    pending: 'badge-warning', accepted: 'badge-info', in_progress: 'badge-info',
    completed: 'badge-success', cancelled: 'badge-danger',
};

const statusLabels: Record<string, string> = {
    pending: 'Pending', accepted: 'Accepted', in_progress: 'In Progress',
    completed: 'Completed', cancelled: 'Cancelled',
};

export default function CustomerDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'customer')) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            setBookings(localStore.bookings.getByCustomer(user.id));
        }
    }, [user]);

    if (loading || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;

    const activeBookings = bookings.filter(b => ['pending', 'accepted', 'in_progress'].includes(b.status));
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const totalSpent = bookings.filter(b => b.paymentStatus === 'released').reduce((s, b) => s + b.amount, 0);

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="customer" />
            <main className="main-content">
                <div className="content-area">
                    {/* Header */}
                    <div style={{ marginBottom: 32 }}>
                        <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Welcome back, {user.name.split(' ')[0]}! 👋
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Here's what's happening with your services</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-3" style={{ gap: 16, marginBottom: 32 }}>
                        {[
                            { label: 'Active Bookings', value: activeBookings.length, icon: <Clock size={20} />, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
                            { label: 'Completed Jobs', value: completedBookings.length, icon: <CheckCircle size={20} />, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                            { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: <Briefcase size={20} />, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                        ].map((s, i) => (
                            <div key={i} className="stat-card">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                                </div>
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Quick action */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(6,182,212,0.06))', border: '1px solid var(--bg-border-accent)', borderRadius: 20, padding: 28, marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                        <div>
                            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Need a service?</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Book a verified professional in 3 minutes</p>
                        </div>
                        <Link href="/customer/book" className="btn btn-primary btn-lg" style={{ flexShrink: 0 }}>
                            Book Now <ArrowRight size={16} />
                        </Link>
                    </div>

                    {/* Bookings */}
                    <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>My Bookings</h2>
                    {bookings.length === 0 ? (
                        <div className="card empty-state">
                            <div className="empty-icon">📋</div>
                            <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No bookings yet</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Start by booking your first service</p>
                            <Link href="/customer/book" className="btn btn-primary">Book a Service</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {bookings.slice(0, 8).map(b => (
                                <Link key={b.id} href={`/customer/bookings/${b.id}`} style={{ textDecoration: 'none' }}>
                                    <div className="card card-sm" style={{ cursor: 'pointer', transition: 'all 0.15s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                                                {b.serviceType === 'Electrician' ? '⚡' : b.serviceType === 'Plumber' ? '🔧' : b.serviceType === 'Cook' ? '👨‍🍳' : b.serviceType === 'Driver' ? '🚗' : '🛠️'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{b.serviceType}</span>
                                                    <div className={`badge ${statusColors[b.status]}`}>{statusLabels[b.status]}</div>
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                    {b.providerName || 'Finding provider...'} • {b.scheduledDate}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>₹{b.amount}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{b.paymentStatus}</div>
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
