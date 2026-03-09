'use client';
import PublicHeader from '@/components/layout/PublicHeader';
import Link from 'next/link';

const SERVICES = [
    { icon: '⚡', name: 'Electrician', desc: 'Wiring, repairs, installations, panel upgrades', priceFrom: '₹300', popular: true },
    { icon: '🔧', name: 'Plumber', desc: 'Pipe fitting, leaks, taps, bathroom fixtures', priceFrom: '₹250' },
    { icon: '👨‍🍳', name: 'Cook', desc: 'Home cooking, party catering, meal prep', priceFrom: '₹500', popular: true },
    { icon: '🚗', name: 'Driver', desc: 'City rides, airport transfers, outstation trips', priceFrom: '₹400' },
    { icon: '🛒', name: 'Grocery Runner', desc: 'Grocery shopping and delivery to your door', priceFrom: '₹100' },
    { icon: '🛡️', name: 'Security Guard', desc: 'Event security, property guard, night shifts', priceFrom: '₹800' },
    { icon: '👴', name: 'Senior Care', desc: 'Elderly companion, medical escort, home care', priceFrom: '₹600', popular: true },
    { icon: '🧹', name: 'Daily Helper', desc: 'Cleaning, laundry, household tasks', priceFrom: '₹200' },
    { icon: '💼', name: 'Local Freelancer', desc: 'Office assistant, data entry, local errands', priceFrom: '₹150' },
];

export default function ServicesPage() {
    return (
        <>
            <PublicHeader />
            <div style={{ paddingTop: 80 }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.07), rgba(6,182,212,0.05))', padding: '60px 0 40px', borderBottom: '1px solid var(--bg-border)' }}>
                    <div className="container" style={{ textAlign: 'center' }}>
                        <h1 className="font-display" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Our Services</h1>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>All service providers are Aadhaar-verified, background-checked, and rated by the community.</p>
                    </div>
                </div>
                <div className="container" style={{ padding: '48px 24px' }}>
                    <div className="grid grid-3" style={{ gap: 20 }}>
                        {SERVICES.map(s => (
                            <Link key={s.name} href={`/providers?category=${encodeURIComponent(s.name)}`} style={{ textDecoration: 'none' }}>
                                <div className="card" style={{ position: 'relative', cursor: 'pointer' }}>
                                    {s.popular && <div className="badge badge-warning" style={{ position: 'absolute', top: 16, right: 16, fontSize: '0.6rem' }}>Popular</div>}
                                    <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>{s.icon}</div>
                                    <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontSize: '1.05rem' }}>{s.name}</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 16 }}>{s.desc}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Starting from</span>
                                            <div style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '1rem' }}>{s.priceFrom}</div>
                                        </div>
                                        <div className="btn btn-secondary btn-sm">Browse →</div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
