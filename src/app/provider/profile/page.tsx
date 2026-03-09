'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { localStore, Provider } from '@/lib/localStore';
import { User, MapPin, Phone, Star, Briefcase } from 'lucide-react';

export default function ProviderProfilePage() {
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

    const docStatus = (s: string) => s === 'verified' ? <div className="badge badge-success">Verified</div> : s === 'pending' ? <div className="badge badge-warning">Pending</div> : <div className="badge badge-danger">Rejected</div>;

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="provider" />
            <main className="main-content">
                <div className="content-area">
                    <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>My Profile</h1>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
                        <div>
                            <div className="card" style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                    <div className="avatar avatar-lg">{user.name.charAt(0)}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{user.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>{user.phone}</div>
                                    </div>
                                </div>
                                {[
                                    ['Phone', user.phone, <Phone size={14} />],
                                    ['City', user.city, <MapPin size={14} />],
                                    ['Address', user.address || '—', <User size={14} />],
                                    ['Skills', provider?.skillCategories.join(', ') || '—', <Briefcase size={14} />],
                                    ['Rating', provider ? `${provider.rating}★ (${provider.totalJobs} jobs)` : '—', <Star size={14} />],
                                ].map(([k, v, icon]) => (
                                    <div key={String(k)} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--bg-border)', fontSize: '0.875rem', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, minWidth: 90 }}>{icon} {k}</span>
                                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{String(v)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {provider && (
                            <div className="card">
                                <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>KYC Status</h3>
                                {[
                                    ['Aadhaar', provider.aadhaarStatus],
                                    ['Selfie', provider.selfieStatus],
                                    ['Bank Account', provider.bankStatus],
                                    ['Police Cert.', provider.policeVerificationStatus],
                                ].map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg-border)', fontSize: '0.875rem', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{k}</span>
                                        {docStatus(v)}
                                    </div>
                                ))}
                                <div style={{ marginTop: 14 }}>
                                    <div className={`badge ${provider.overallStatus === 'approved' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem', padding: '4px 12px' }}>
                                        Overall: {provider.overallStatus}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
