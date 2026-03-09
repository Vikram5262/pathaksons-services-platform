'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { localStore, Booking } from '@/lib/localStore';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';

const statusColors: Record<string, string> = {
    pending: 'badge-warning', accepted: 'badge-info', in_progress: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger',
};

export default function CustomerBookingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [tab, setTab] = useState<'active' | 'past'>('active');

    useEffect(() => { if (!loading && (!user || user.role !== 'customer')) router.push('/login'); }, [user, loading, router]);
    useEffect(() => {
        if (user) setBookings(localStore.bookings.getByCustomer(user.id));
    }, [user]);

    if (loading || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;

    const active = bookings.filter(b => ['pending', 'accepted', 'in_progress'].includes(b.status));
    const past = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));
    const shown = tab === 'active' ? active : past;

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="customer" />
            <main className="main-content">
                <div className="content-area">
                    <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>My Bookings</h1>
                    <div className="tab-bar" style={{ marginBottom: 20 }}>
                        <button className={`tab-btn${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>Active ({active.length})</button>
                        <button className={`tab-btn${tab === 'past' ? ' active' : ''}`} onClick={() => setTab('past')}>History ({past.length})</button>
                    </div>
                    {shown.length === 0 ? (
                        <div className="card empty-state">
                            <div className="empty-icon"><CalendarDays size={40} style={{ opacity: 0.3, margin: '0 auto' }} /></div>
                            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>No {tab} bookings.</p>
                            <Link href="/customer/book" className="btn btn-primary" style={{ marginTop: 16 }}>Book a Service</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {shown.map(b => (
                                <Link key={b.id} href={`/customer/bookings/${b.id}`} style={{ textDecoration: 'none' }}>
                                    <div className="card card-sm" style={{ cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                                                {b.serviceType === 'Electrician' ? '⚡' : b.serviceType === 'Plumber' ? '🔧' : b.serviceType === 'Cook' ? '👨‍🍳' : '🛠️'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.serviceType}</span>
                                                    <div className={`badge ${statusColors[b.status]}`}>{b.status.replace('_', ' ')}</div>
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.providerName || 'Finding provider...'} • {b.scheduledDate}</div>
                                            </div>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>₹{b.amount}</div>
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
