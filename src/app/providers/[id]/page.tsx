'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { localStore, Provider, Review } from '@/lib/localStore';
import PublicHeader from '@/components/layout/PublicHeader';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { MapPin, CheckCircle, Star, Briefcase, Clock, Shield, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProviderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const [provider, setProvider] = useState<Provider | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);

    useEffect(() => {
        localStore.seed();
        const p = localStore.providers.getById(id);
        setProvider(p || null);
        if (p) setReviews(localStore.reviews.getByProvider(p.id));
    }, [id]);

    const stars = (r: number) => Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < Math.round(r) ? '#F59E0B' : 'var(--bg-border)', fontSize: '1rem' }}>★</span>
    ));

    const handleBook = () => {
        if (!user) { toast.error('Please login to book'); router.push('/login'); return; }
        if (user.role !== 'customer') { toast.error('Only customers can book services'); return; }
        router.push(`/customer/book?provider=${id}`);
    };

    if (!provider) return (
        <>
            <PublicHeader />
            <div style={{ paddingTop: 100, textAlign: 'center', padding: 60 }}>
                <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--text-muted)' }}>Loading provider...</p>
            </div>
        </>
    );

    return (
        <>
            <PublicHeader />
            <div style={{ paddingTop: 80 }}>
                <div className="container" style={{ padding: '40px 24px', maxWidth: 900 }}>
                    <Link href="/providers" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24, textDecoration: 'none' }}>
                        <ArrowLeft size={14} /> Back to Providers
                    </Link>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
                        {/* Main */}
                        <div>
                            <div className="card" style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                                    <div className="avatar avatar-xl" style={{ flexShrink: 0 }}>{provider.name.charAt(0)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{provider.name}</h1>
                                            <div className="badge badge-success"><CheckCircle size={10} /> Verified</div>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                            {provider.skillCategories.map(s => <span key={s} className="badge badge-info">{s}</span>)}
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {stars(provider.rating)}
                                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginLeft: 4 }}>{provider.rating}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>({provider.totalJobs} jobs)</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                <MapPin size={12} /> {provider.city}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: provider.isAvailable ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '0.82rem', fontWeight: 600 }}>
                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: provider.isAvailable ? 'var(--color-success)' : 'var(--color-danger)' }} />
                                                {provider.isAvailable ? 'Available Now' : 'Unavailable'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {provider.bio && <p style={{ color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.7, fontSize: '0.9rem' }}>{provider.bio}</p>}
                            </div>

                            {/* Verification badges */}
                            <div className="card" style={{ marginBottom: 20 }}>
                                <h2 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Verification Status</h2>
                                <div className="grid grid-2" style={{ gap: 12 }}>
                                    {[
                                        ['Aadhaar', provider.aadhaarStatus], ['Selfie', provider.selfieStatus],
                                        ['Bank Account', provider.bankStatus], ['Police Verification', provider.policeVerificationStatus],
                                    ].map(([label, status]) => (
                                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 10 }}>
                                            <CheckCircle size={16} style={{ color: status === 'verified' ? 'var(--color-success)' : 'var(--text-muted)' }} />
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                                                <div style={{ fontSize: '0.68rem', color: status === 'verified' ? 'var(--color-success)' : 'var(--text-muted)', textTransform: 'capitalize' }}>{status}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reviews */}
                            <div className="card">
                                <h2 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Reviews ({reviews.length})</h2>
                                {reviews.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>No reviews yet. Be the first!</div>
                                ) : reviews.map(r => (
                                    <div key={r.id} style={{ borderBottom: '1px solid var(--bg-border)', paddingBottom: 16, marginBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <div className="avatar avatar-sm">{r.customerName.charAt(0)}</div>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{r.customerName}</span>
                                            <div style={{ display: 'flex' }}>{stars(r.rating)}</div>
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{r.comment}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Booking card */}
                        <div className="card" style={{ position: 'sticky', top: 80 }}>
                            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Book {provider.name}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                                {[
                                    { icon: <Star size={14} />, label: 'Rating', val: `${provider.rating} / 5.0` },
                                    { icon: <Briefcase size={14} />, label: 'Jobs Done', val: provider.totalJobs.toString() },
                                    { icon: <MapPin size={14} />, label: 'City', val: provider.city },
                                ].map(({ icon, label, val }) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>{icon} {label}</div>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="escrow-banner" style={{ marginBottom: 16 }}>
                                <Shield size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                    Payment held in escrow until job is completed ✓
                                </div>
                            </div>
                            <button onClick={handleBook} className="btn btn-primary btn-full btn-lg" disabled={!provider.isAvailable}>
                                {provider.isAvailable ? 'Book Now' : 'Currently Unavailable'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
