'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { localStore, Provider, Booking } from '@/lib/localStore';
import { Suspense } from 'react';
import { Check, ChevronRight, ChevronLeft, MapPin, Star, Upload, Shield, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electrician', 'Plumber', 'Cook', 'Driver', 'Daily Helper', 'Security Guard', 'Senior Care', 'Grocery Runner', 'Local Freelancer'];
const TIME_SLOTS = ['8:00 AM – 10:00 AM', '10:00 AM – 12:00 PM', '12:00 PM – 2:00 PM', '2:00 PM – 4:00 PM', '4:00 PM – 6:00 PM', '6:00 PM – 8:00 PM'];
const METHODS = [
    { id: 'upi', label: 'UPI', icon: '📱', desc: 'Google Pay, PhonePe, Paytm' },
    { id: 'card', label: 'Card', icon: '💳', desc: 'Debit / Credit Card' },
    { id: 'wallet', label: 'Wallet', icon: '👛', desc: 'QAVRA Wallet' },
];

function BookingForm() {
    const params = useSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(0);

    const [serviceCategory, setServiceCategory] = useState('');
    const [description, setDescription] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [timeSlot, setTimeSlot] = useState('');
    const [date, setDate] = useState('');
    const [payMethod, setPayMethod] = useState<'upi' | 'card' | 'wallet'>('upi');
    const [address, setAddress] = useState(user?.address || '');
    const [loading, setLoading] = useState(false);
    const [bookingDone, setBookingDone] = useState(false);
    const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

    useEffect(() => {
        const pid = params.get('provider');
        if (pid) {
            const p = localStore.providers.getById(pid);
            if (p) { setSelectedProvider(p); if (p.skillCategories[0]) setServiceCategory(p.skillCategories[0]); }
        }
    }, [params]);

    useEffect(() => {
        if (serviceCategory) {
            const all = localStore.providers.getAll().filter(p => p.overallStatus === 'approved' && p.skillCategories.includes(serviceCategory));
            setProviders(all);
        }
    }, [serviceCategory]);

    const STEPS = ['Service', 'Provider', 'Details', 'Payment', 'Confirm'];

    const handleBook = async () => {
        if (!user || !serviceCategory || !timeSlot || !date || !address) { toast.error('Fill all required fields'); return; }
        setLoading(true);
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const amount = serviceCategory === 'Electrician' ? 800 : serviceCategory === 'Plumber' ? 500 : serviceCategory === 'Cook' ? 2500 : serviceCategory === 'Driver' ? 600 : 400;
        const booking = localStore.bookings.create({
            customerId: user.id, customerName: user.name,
            providerId: selectedProvider?.id, providerName: selectedProvider?.name,
            serviceType: serviceCategory, description, timeSlot, scheduledDate: date,
            status: selectedProvider ? 'accepted' : 'pending', paymentStatus: 'held',
            amount, otp, city: user.city || 'Indore', address,
        });
        localStore.payments.create({
            bookingId: booking.id, customerId: user.id, providerId: selectedProvider?.id,
            amount, platformFee: Math.round(amount * 0.1), providerPayout: Math.round(amount * 0.9),
            escrowStatus: 'held', payoutStatus: 'pending', paymentMethod: payMethod,
            transactionId: 'TXN' + Date.now(),
        });
        setTimeout(() => {
            setLoading(false);
            setCreatedBooking(booking);
            setBookingDone(true);
            toast.success('Booking confirmed! Payment held in escrow.');
        }, 1500);
    };

    const stars = (r: number) => Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < Math.round(r) ? '#F59E0B' : 'var(--bg-border)', fontSize: '0.75rem' }}>★</span>
    ));

    if (bookingDone && createdBooking) {
        return (
            <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '2rem' }}>✅</div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Booking Confirmed!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Your booking ID is <strong style={{ color: 'var(--brand-primary)' }}>#{createdBooking.id.slice(-6).toUpperCase()}</strong></p>
                <div className="card" style={{ textAlign: 'left', marginBottom: 20 }}>
                    {[
                        ['Service', createdBooking.serviceType], ['Date', createdBooking.scheduledDate],
                        ['Time', createdBooking.timeSlot], ['Provider', createdBooking.providerName || 'Finding...'],
                        ['OTP for Job Start', createdBooking.otp || '-'], ['Amount (Escrow)', `₹${createdBooking.amount}`],
                    ].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg-border)', fontSize: '0.875rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                            <span style={{ fontWeight: 600, color: k === 'OTP for Job Start' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>{v}</span>
                        </div>
                    ))}
                </div>
                <div className="escrow-banner" style={{ marginBottom: 24 }}>
                    <Shield size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Payment of ₹{createdBooking.amount} is safely held in escrow. Will be released after job completion.</div>
                </div>
                <button className="btn btn-primary btn-full btn-lg" onClick={() => router.push(`/customer/bookings/${createdBooking.id}`)}>
                    Track Booking <ChevronRight size={16} />
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
            {/* Step wizard */}
            <div className="step-wizard" style={{ marginBottom: 32 }}>
                {STEPS.map((s, i) => (
                    <div key={i} className="step-item">
                        <div className={`step-circle${i === step ? ' active' : i < step ? ' done' : ''}`}>
                            {i < step ? <Check size={12} /> : i + 1}
                        </div>
                        {i < STEPS.length - 1 && <div className={`step-line${i < step ? ' done' : ''}`} />}
                    </div>
                ))}
            </div>

            <div className="card" style={{ padding: 32 }}>
                {/* Step 0 – Service */}
                {step === 0 && (
                    <div>
                        <h3 style={{ fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Select Service Category</h3>
                        <div className="grid grid-3" style={{ gap: 12, marginBottom: 24 }}>
                            {CATEGORIES.map(cat => (
                                <button key={cat} type="button" onClick={() => setServiceCategory(cat)} style={{
                                    padding: '12px', borderRadius: 12, border: `2px solid ${serviceCategory === cat ? '#F59E0B' : 'var(--bg-border)'}`,
                                    background: serviceCategory === cat ? 'rgba(245,158,11,0.1)' : 'var(--bg-surface)',
                                    color: serviceCategory === cat ? '#F59E0B' : 'var(--text-secondary)',
                                    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                                }}>{cat}</button>
                            ))}
                        </div>
                        <button className="btn btn-primary btn-full" disabled={!serviceCategory} onClick={() => setStep(1)}>
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                {/* Step 1 – Provider */}
                {step === 1 && (
                    <div>
                        <h3 style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>Choose a Provider</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>Or skip to auto-match</p>
                        {providers.length === 0 ? (
                            <div className="empty-state" style={{ padding: '30px 0' }}>
                                <div className="empty-icon">🔍</div>
                                <p style={{ color: 'var(--text-muted)' }}>No approved providers for {serviceCategory} yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                                {providers.map(p => (
                                    <div key={p.id} onClick={() => setSelectedProvider(selectedProvider?.id === p.id ? null : p)} style={{
                                        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12,
                                        border: `2px solid ${selectedProvider?.id === p.id ? '#F59E0B' : 'var(--bg-border)'}`,
                                        background: selectedProvider?.id === p.id ? 'rgba(245,158,11,0.06)' : 'var(--bg-surface)',
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}>
                                        <div className="avatar avatar-md">{p.name.charAt(0)}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{p.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                {stars(p.rating)}
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.rating} ({p.totalJobs} jobs)</span>
                                            </div>
                                        </div>
                                        {selectedProvider?.id === p.id && <Check size={16} style={{ color: '#F59E0B' }} />}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" onClick={() => setStep(0)}><ChevronLeft size={14} /> Back</button>
                            <button className="btn btn-primary btn-full" onClick={() => setStep(2)}>
                                {selectedProvider ? 'Confirm Provider' : 'Auto-Match'} <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2 – Details */}
                {step === 2 && (
                    <div>
                        <h3 style={{ fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Job Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                            <div className="input-group">
                                <label className="input-label">Problem Description *</label>
                                <textarea className="input" style={{ minHeight: 100, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what needs to be done..." />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Your Address *</label>
                                <input className="input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address with landmark" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Preferred Date *</label>
                                <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Time Slot *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                                    {TIME_SLOTS.map(ts => (
                                        <button key={ts} type="button" onClick={() => setTimeSlot(ts)} style={{
                                            padding: '8px', borderRadius: 8, border: `2px solid ${timeSlot === ts ? '#F59E0B' : 'var(--bg-border)'}`,
                                            background: timeSlot === ts ? 'rgba(245,158,11,0.1)' : 'var(--bg-surface)',
                                            color: timeSlot === ts ? '#F59E0B' : 'var(--text-secondary)',
                                            fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                                        }}><Clock size={10} style={{ display: 'inline', marginRight: 4 }} />{ts}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" onClick={() => setStep(1)}><ChevronLeft size={14} /> Back</button>
                            <button className="btn btn-primary btn-full" disabled={!description || !address || !date || !timeSlot} onClick={() => setStep(3)}>
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3 – Payment */}
                {step === 3 && (
                    <div>
                        <h3 style={{ fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Payment Method</h3>
                        <div className="escrow-banner" style={{ marginBottom: 20 }}>
                            <Shield size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <strong style={{ color: 'var(--color-success)' }}>Escrow Protected</strong> — Your payment is held securely until the job is completed and you approve it.
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                            {METHODS.map(m => (
                                <div key={m.id} onClick={() => setPayMethod(m.id as any)} style={{
                                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12,
                                    border: `2px solid ${payMethod === m.id ? '#F59E0B' : 'var(--bg-border)'}`,
                                    background: payMethod === m.id ? 'rgba(245,158,11,0.06)' : 'var(--bg-surface)',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}>
                                    <div style={{ fontSize: '1.5rem' }}>{m.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{m.label}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                                    </div>
                                    {payMethod === m.id && <Check size={16} style={{ color: '#F59E0B' }} />}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" onClick={() => setStep(2)}><ChevronLeft size={14} /> Back</button>
                            <button className="btn btn-primary btn-full" onClick={() => setStep(4)}>Review Booking <ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}

                {/* Step 4 – Confirm */}
                {step === 4 && (
                    <div>
                        <h3 style={{ fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Confirm Booking</h3>
                        {[
                            ['Service', serviceCategory], ['Provider', selectedProvider?.name || 'Auto-match'],
                            ['Date', date], ['Time', timeSlot], ['Address', address],
                            ['Payment', payMethod.toUpperCase()], ['Estimated Cost', serviceCategory === 'Electrician' ? '₹800' : serviceCategory === 'Plumber' ? '₹500' : serviceCategory === 'Cook' ? '₹2,500' : serviceCategory === 'Driver' ? '₹600' : '₹400'],
                        ].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg-border)', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '60%', textAlign: 'right' }}>{v}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                            <button className="btn btn-secondary" onClick={() => setStep(3)}><ChevronLeft size={14} /> Back</button>
                            <button className="btn btn-primary btn-full btn-lg" disabled={loading} onClick={handleBook}>
                                {loading ? <><div className="spinner" /> Processing...</> : <>Confirm & Pay <Check size={16} /></>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BookPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'customer')) router.push('/login');
    }, [user, loading, router]);

    if (loading || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="customer" />
            <main className="main-content">
                <div className="content-area">
                    <div style={{ marginBottom: 32 }}>
                        <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>Book a Service</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Complete the steps below to book a verified professional</p>
                    </div>
                    <Suspense fallback={<div className="spinner" />}>
                        <BookingForm />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
