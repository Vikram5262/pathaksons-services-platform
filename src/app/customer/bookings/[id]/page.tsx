'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { localStore, Booking, Payment, ChatMessage } from '@/lib/localStore';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import { Shield, CheckCircle, Star, ArrowLeft, MapPin, Phone, AlertTriangle, Share2, MessageCircle, Flag, X, Send, Navigation } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending', 'accepted', 'in_progress', 'completed'];
const STATUS_LABELS: Record<string, string> = {
    pending: 'Finding Provider', accepted: 'Provider Accepted', in_progress: 'Work In Progress', completed: 'Completed',
};

const REPORT_REASONS = [
    'Rude behavior', 'Did not arrive', 'Incomplete work', 'Overcharging', 'Safety concern',
    'Property damage', 'Unprofessional conduct', 'Fraud / Scam attempt', 'Other',
];

export default function BookingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [payment, setPayment] = useState<Payment | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewed, setReviewed] = useState(false);

    // Safety modals
    const [showReport, setShowReport] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDesc, setReportDesc] = useState('');
    const [chatMsg, setChatMsg] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const reload = () => {
        const b = localStore.bookings.getById(id);
        setBooking(b || null);
        if (b) {
            setPayment(localStore.payments.getByBooking(b.id) || null);
            setMessages(localStore.chat.getByBooking(b.id));
        }
    };

    useEffect(() => { reload(); }, [id]);

    // Check existing review
    useEffect(() => {
        if (booking?.id) {
            const existing = localStore.reviews.getByBooking(booking.id);
            if (existing) setReviewed(true);
        }
    }, [booking?.id]);

    const handleConfirmComplete = () => {
        if (!booking) return;
        localStore.bookings.update(booking.id, { status: 'completed', paymentStatus: 'released' });
        if (payment) localStore.payments.update(payment.id, { escrowStatus: 'released', payoutStatus: 'paid' });
        reload();
        toast.success('Job confirmed complete! Payment released to provider.');
    };

    const handleReview = () => {
        if (!booking || !user || reviewed) return;
        if (!comment.trim()) { toast.error('Please write a comment'); return; }
        localStore.reviews.create({
            customerId: user.id, customerName: user.name,
            providerId: booking.providerId!, bookingId: booking.id,
            rating, comment,
        });
        setReviewed(true);
        toast.success('Review submitted!');
    };

    const handleSOS = () => {
        toast.error('🚨 Emergency services alerted! Stay calm — help is on the way.', { duration: 5000 });
        // In production, this would call emergency services API
    };

    const handleReport = () => {
        if (!booking || !user || !reportReason) { toast.error('Please select a reason'); return; }
        localStore.complaints.create({
            bookingId: booking.id,
            customerId: user.id,
            customerName: user.name,
            providerId: booking.providerId || '',
            providerName: booking.providerName || 'Unknown',
            reason: reportReason,
            description: reportDesc,
            status: 'open',
        });
        localStore.bookings.update(booking.id, { reportFiled: true });
        setShowReport(false);
        setReportReason('');
        setReportDesc('');
        toast.success('Report submitted. Admin will review within 24 hours.');
    };

    const handleShare = () => {
        const text = `My booking with ${booking?.providerName || 'provider'} for ${booking?.serviceType} on ${booking?.scheduledDate} at ${booking?.timeSlot}. Address: ${booking?.address}. Booking ID: #${booking?.id.slice(-6).toUpperCase()}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => toast.success('Booking details copied! Share with family.'));
        } else {
            toast.success('📋 Share: ' + text.slice(0, 60) + '...');
        }
    };

    const sendChatMessage = () => {
        if (!chatMsg.trim() || !booking || !user) return;
        localStore.chat.send({
            bookingId: booking.id,
            senderId: user.id,
            senderName: user.name,
            senderRole: 'customer',
            message: chatMsg.trim(),
        });
        setChatMsg('');
        setMessages(localStore.chat.getByBooking(booking.id));
        toast.success('Message sent!');
    };

    if (!booking) return (
        <div className="layout-with-sidebar">
            <Sidebar role="customer" />
            <main className="main-content"><div className="content-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner spinner-lg" /></div></main>
        </div>
    );

    const statusIdx = STATUS_STEPS.indexOf(booking.status);
    const isActive = ['accepted', 'in_progress'].includes(booking.status);

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="customer" />
            <main className="main-content">
                <div className="content-area">
                    <Link href="/customer/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24, textDecoration: 'none' }}>
                        <ArrowLeft size={14} /> Back to Dashboard
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Booking #{booking.id.slice(-6).toUpperCase()}
                        </h1>

                        {/* Safety action bar */}
                        {isActive && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <Link href={`/customer/bookings/${id}/track`}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'rgba(6,182,212,0.1)', border: '1.5px solid rgba(6,182,212,0.3)', color: '#06B6D4', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
                                    <Navigation size={14} /> Track Provider
                                </Link>
                                <button onClick={handleShare}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'rgba(245,158,11,0.1)', border: '1.5px solid rgba(245,158,11,0.2)', color: '#F59E0B', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600 }}>
                                    <Share2 size={14} /> Share
                                </button>
                                <button onClick={() => setShowChat(true)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.2)', color: '#10B981', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600 }}>
                                    <MessageCircle size={14} /> Chat
                                </button>
                                {booking.providerId && !booking.reportFiled && (
                                    <button onClick={() => setShowReport(true)}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)', color: '#EF4444', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600 }}>
                                        <Flag size={14} /> Report
                                    </button>
                                )}
                                {booking.reportFiled && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.15)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                        <Flag size={12} /> Reported
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SOS Button — always visible when active */}
                    {isActive && (
                        <div style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.04))', border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button
                                onClick={handleSOS}
                                style={{ background: '#EF4444', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, animation: 'pulse 2s infinite', boxShadow: '0 0 16px rgba(239,68,68,0.4)' }}
                            >
                                🆘 SOS — Emergency Help
                            </button>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                                Press only in an emergency. This will immediately alert authorities and share your location.
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
                        <div>
                            {/* Status tracker */}
                            <div className="card" style={{ marginBottom: 16 }}>
                                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Job Status</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                    {STATUS_STEPS.filter(s => s !== 'cancelled').map((s, i) => {
                                        const done = i <= statusIdx;
                                        const current = i === statusIdx;
                                        return (
                                            <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingBottom: i < STATUS_STEPS.length - 2 ? 20 : 0, position: 'relative' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--color-success)' : 'var(--bg-border)', color: done ? 'white' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        {done && !current ? '✓' : i + 1}
                                                    </div>
                                                    {i < STATUS_STEPS.length - 2 && <div style={{ width: 2, flex: 1, minHeight: 20, background: done ? 'var(--color-success)' : 'var(--bg-border)', margin: '4px 0' }} />}
                                                </div>
                                                <div style={{ paddingBottom: 4 }}>
                                                    <div style={{ fontWeight: 600, color: done ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        {STATUS_LABELS[s]}
                                                        {current && booking.status !== 'completed' && <div className="badge badge-info">Current</div>}
                                                    </div>
                                                    {s === 'accepted' && booking.otp && (
                                                        <div style={{ marginTop: 6, padding: '6px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Job Start OTP:</span>
                                                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-primary)', letterSpacing: '0.15em' }}>{booking.otp}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {booking.status === 'in_progress' && (
                                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bg-border)' }}>
                                        <button className="btn btn-success btn-full" onClick={handleConfirmComplete}>
                                            <CheckCircle size={16} /> Confirm Job Complete & Release Payment
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Provider location quick link */}
                            {isActive && booking.providerId && (
                                <div className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #EFF6FF, #F0F9FF)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <MapPin size={18} style={{ color: '#06B6D4' }} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>Track Your Provider</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>See live location & estimated arrival</div>
                                            </div>
                                        </div>
                                        <Link href={`/customer/bookings/${id}/track`}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, background: '#06B6D4', color: '#fff', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
                                            <Navigation size={13} /> Open Map
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Photos */}
                            {(booking.beforePhoto || booking.afterPhoto) && (
                                <div className="card" style={{ marginBottom: 16 }}>
                                    <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Job Photos</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        {booking.beforePhoto && <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>BEFORE</div><div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>📷 Before</div></div>}
                                        {booking.afterPhoto && <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>AFTER</div><div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>📷 After</div></div>}
                                    </div>
                                </div>
                            )}

                            {/* Review */}
                            {booking.status === 'completed' && booking.providerId && !reviewed && (
                                <div className="card">
                                    <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Leave a Review</h3>
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <Star key={n} size={28} fill={n <= rating ? '#F59E0B' : 'none'} style={{ color: n <= rating ? '#F59E0B' : 'var(--bg-border)', cursor: 'pointer' }} onClick={() => setRating(n)} />
                                        ))}
                                    </div>
                                    <textarea className="input" style={{ minHeight: 80, resize: 'vertical', marginBottom: 12 }} value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." />
                                    <button className="btn btn-primary" onClick={handleReview} disabled={!comment.trim()}>Submit Review</button>
                                </div>
                            )}
                            {reviewed && <div className="card"><div style={{ textAlign: 'center', color: 'var(--color-success)', padding: '20px 0' }}><CheckCircle size={24} style={{ margin: '0 auto 8px' }} /><div style={{ fontWeight: 600 }}>Review submitted, thanks!</div></div></div>}
                        </div>

                        {/* Booking info card */}
                        <div>
                            <div className="card" style={{ marginBottom: 16 }}>
                                <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Booking Details</h3>
                                {[
                                    ['Service', booking.serviceType], ['Provider', booking.providerName || 'Matching...'],
                                    ['Date', booking.scheduledDate], ['Time', booking.timeSlot],
                                    ['Address', booking.address ?? '—'],
                                ].map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg-border)', fontSize: '0.82rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                                        <span style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="card">
                                <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Payment</h3>
                                {payment && (
                                    <>
                                        {[
                                            ['Total', `₹${payment.amount}`], ['Platform Fee (10%)', `₹${payment.platformFee}`],
                                            ['Provider Payout', `₹${payment.providerPayout}`], ['Method', payment.paymentMethod.toUpperCase()],
                                        ].map(([k, v]) => (
                                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--bg-border)', fontSize: '0.82rem' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                                                <span style={{ fontWeight: k === 'Total' ? 700 : 500, color: 'var(--text-primary)' }}>{v}</span>
                                            </div>
                                        ))}
                                        <div style={{ marginTop: 12 }}>
                                            <div className={`badge ${payment.escrowStatus === 'released' ? 'badge-success' : 'badge-warning'}`} style={{ display: 'inline-flex' }}>
                                                <Shield size={10} /> Escrow: {payment.escrowStatus}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Report Modal */}
            {showReport && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={() => setShowReport(false)} />
                    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 510, width: '90%', maxWidth: 460, background: 'var(--bg-card)', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-xl)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={18} style={{ color: '#EF4444' }} />Report Provider</h3>
                            <button onClick={() => setShowReport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                        </div>
                        <div className="input-group" style={{ marginBottom: 14 }}>
                            <label className="input-label">Reason *</label>
                            <select className="input" value={reportReason} onChange={e => setReportReason(e.target.value)}>
                                <option value="">Select a reason</option>
                                {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: 20 }}>
                            <label className="input-label">Additional Details</label>
                            <textarea className="input" style={{ minHeight: 80, resize: 'vertical' }} value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Describe what happened..." />
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                            ⚠️ If a provider receives 3 or more complaints, their account will be automatically suspended pending review.
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-secondary btn-full" onClick={() => setShowReport(false)}>Cancel</button>
                            <button className="btn btn-danger btn-full" onClick={handleReport} disabled={!reportReason}>
                                <Flag size={14} /> Submit Report
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Chat Modal */}
            {showChat && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={() => setShowChat(false)} />
                    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 510, width: '90%', maxWidth: 460, background: 'var(--bg-card)', borderRadius: 20, padding: 0, boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px', borderBottom: '1px solid var(--bg-border)' }}>
                            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><MessageCircle size={18} style={{ color: '#10B981' }} />Chat with {booking.providerName || 'Provider'}</h3>
                            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200 }}>
                            {messages.length === 0 && (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: 'auto' }}>No messages yet. Start the conversation!</div>
                            )}
                            {messages.map(m => (
                                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.senderRole === 'customer' ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ maxWidth: '75%', padding: '8px 14px', borderRadius: m.senderRole === 'customer' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: m.senderRole === 'customer' ? 'var(--brand-primary)' : 'var(--bg-surface)', color: m.senderRole === 'customer' ? '#fff' : 'var(--text-primary)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                                        {m.message}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 3 }}>
                                        {m.senderName} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--bg-border)', display: 'flex', gap: 8 }}>
                            <input
                                className="input"
                                style={{ flex: 1 }}
                                value={chatMsg}
                                onChange={e => setChatMsg(e.target.value)}
                                placeholder="Type a message..."
                                onKeyDown={e => { if (e.key === 'Enter') { sendChatMessage(); } }}
                            />
                            <button className="btn btn-primary" onClick={sendChatMessage} disabled={!chatMsg.trim()}>
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 16px rgba(239,68,68,0.4); } 50% { opacity: 0.85; box-shadow: 0 0 28px rgba(239,68,68,0.6); } }
                @media (max-width: 768px) {
                    [style*="grid-template-columns: 1fr 320px"] { grid-template-columns: 1fr !important; }
                    [style*="display: flex"][style*="flex-wrap: wrap"] { flex-direction: column; }
                }
            `}</style>
        </div>
    );
}
