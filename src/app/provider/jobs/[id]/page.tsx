'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { localStore, Booking } from '@/lib/localStore';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Upload, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProviderJobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const [job, setJob] = useState<Booking | null>(null);
    const [otpInput, setOtpInput] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);

    const reload = () => setJob(localStore.bookings.getById(id) || null);
    useEffect(() => { reload(); }, [id]);

    const handleAccept = () => {
        if (!job || !user) return;
        const provider = localStore.providers.getByUserId(user.id);
        localStore.bookings.update(job.id, { status: 'accepted', providerId: provider?.id, providerName: user.name });
        reload(); toast.success('Job accepted!');
    };

    const handleReject = () => {
        localStore.bookings.update(id, { status: 'cancelled' });
        reload(); toast.success('Job declined.');
    };

    const handleVerifyOtp = () => {
        if (!job) return;
        if (otpInput === job.otp) { setOtpVerified(true); localStore.bookings.update(job.id, { status: 'in_progress' }); reload(); toast.success('OTP verified! Job started.'); }
        else toast.error('Wrong OTP. Ask customer to check their dashboard.');
    };

    const handleComplete = () => {
        localStore.bookings.update(id, { status: 'in_progress', afterPhoto: 'uploaded' });
        reload(); toast.success('Completion proof uploaded. Awaiting customer confirmation.');
    };

    if (!job) return (
        <div className="layout-with-sidebar"><Sidebar role="provider" />
            <main className="main-content"><div className="content-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner spinner-lg" /></div></main>
        </div>
    );

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="provider" />
            <main className="main-content">
                <div className="content-area">
                    <Link href="/provider/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24, textDecoration: 'none' }}>
                        <ArrowLeft size={14} /> Back
                    </Link>
                    <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>
                        Job #{job.id.slice(-6).toUpperCase()}
                    </h1>

                    <div style={{ maxWidth: 640 }}>
                        <div className="card" style={{ marginBottom: 16 }}>
                            <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Job Details</h3>
                            {[['Customer', job.customerName], ['Service', job.serviceType], ['Date', job.scheduledDate], ['Time', job.timeSlot], ['Address', job.address], ['Description', job.description]].map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--bg-border)', fontSize: '0.875rem' }}>
                                    <span style={{ color: 'var(--text-muted)', minWidth: 100 }}>{k}</span>
                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{v}</span>
                                </div>
                            ))}
                        </div>

                        {/* Action based on status */}
                        {job.status === 'pending' && (
                            <div className="card" style={{ marginBottom: 16 }}>
                                <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>New Job Request</h3>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button className="btn btn-danger btn-full" onClick={handleReject}>Decline</button>
                                    <button className="btn btn-success btn-full" onClick={handleAccept}>Accept Job</button>
                                </div>
                            </div>
                        )}

                        {job.status === 'accepted' && !otpVerified && (
                            <div className="card" style={{ marginBottom: 16 }}>
                                <h3 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Enter Job Start OTP</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>Ask the customer for the 4-digit OTP shown on their booking page.</p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input className="input" value={otpInput} onChange={e => setOtpInput(e.target.value)} placeholder="Enter 4-digit OTP" maxLength={4} style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.2rem', fontWeight: 700 }} />
                                    <button className="btn btn-primary" onClick={handleVerifyOtp}><KeyRound size={16} /> Verify</button>
                                </div>
                            </div>
                        )}

                        {(job.status === 'in_progress' || otpVerified) && !job.afterPhoto && (
                            <div className="card" style={{ marginBottom: 16 }}>
                                <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Upload Completion Proof</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>Upload before and after photos of the job.</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                    {['Before Photo', 'After Photo'].map(label => (
                                        <div key={label} style={{ background: 'var(--bg-surface)', border: '2px dashed var(--bg-border)', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer' }}>
                                            <Upload size={20} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</div>
                                        </div>
                                    ))}
                                </div>
                                <button className="btn btn-primary btn-full" onClick={handleComplete}>
                                    <CheckCircle size={16} /> Submit Completion Proof
                                </button>
                            </div>
                        )}

                        {job.status === 'completed' && (
                            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
                                <h3 style={{ fontWeight: 700, color: 'var(--color-success)', marginBottom: 8 }}>Job Completed!</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Payment will be released to your account within 24 hours.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
