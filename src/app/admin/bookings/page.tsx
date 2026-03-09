'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { localStore, Booking } from '@/lib/localStore';
import { Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
    pending: 'badge-warning', accepted: 'badge-info', in_progress: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger',
};

export default function AdminBookingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');

    const reload = () => setBookings(localStore.bookings.getAll());
    useEffect(() => { if (!loading && (!user || user.role !== 'admin')) router.push('/login'); }, [user, loading, router]);
    useEffect(() => { if (user) reload(); }, [user]);

    const filtered = bookings.filter(b => {
        const qOk = !query || b.customerName.toLowerCase().includes(query.toLowerCase()) || b.serviceType.toLowerCase().includes(query.toLowerCase());
        const fOk = filter === 'all' || b.status === filter;
        return qOk && fOk;
    });

    const cancelBooking = (id: string) => {
        localStore.bookings.update(id, { status: 'cancelled', paymentStatus: 'refunded' });
        const payment = localStore.payments.getByBooking(id);
        if (payment) localStore.payments.update(payment.id, { escrowStatus: 'refunded' });
        reload();
        toast.success('Booking cancelled and refund initiated');
    };

    if (loading || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="admin" />
            <main className="main-content">
                <div className="content-area">
                    <div style={{ marginBottom: 24 }}>
                        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Booking Management</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{bookings.length} total bookings</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                        <div className="search-bar" style={{ flex: 1 }}>
                            <Search size={16} style={{ color: 'var(--text-muted)' }} />
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search bookings..." />
                        </div>
                        <select className="input" style={{ width: 170 }} value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>Provider</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {filtered.map(b => (
                                    <tr key={b.id}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>#{b.id.slice(-6).toUpperCase()}</td>
                                        <td style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{b.customerName}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{b.serviceType}</td>
                                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{b.providerName || '—'}</td>
                                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.scheduledDate}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{b.amount}</td>
                                        <td><div className={`badge ${statusColors[b.status]}`}>{b.status.replace('_', ' ')}</div></td>
                                        <td>
                                            {!['cancelled', 'completed'].includes(b.status) && (
                                                <button className="btn btn-sm btn-danger" onClick={() => cancelBooking(b.id)}><X size={12} /> Cancel</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No bookings found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
