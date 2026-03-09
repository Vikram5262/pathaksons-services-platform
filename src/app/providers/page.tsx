'use client';
import { useEffect, useState } from 'react';
import { localStore, Provider } from '@/lib/localStore';
import PublicHeader from '@/components/layout/PublicHeader';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MapPin, Star, CheckCircle, Filter, Search, X } from 'lucide-react';
import { Suspense } from 'react';

const CATEGORIES = ['All', 'Electrician', 'Plumber', 'Cook', 'Driver', 'Daily Helper', 'Security Guard', 'Senior Care', 'Grocery Runner'];
const CITIES = ['All Cities', 'Indore', 'Bhopal', 'Jabalpur', 'Ujjain', 'Gwalior'];

function ProvidersList() {
    const params = useSearchParams();
    const [providers, setProviders] = useState<Provider[]>([]);
    const [category, setCategory] = useState(params.get('category') || 'All');
    const [city, setCity] = useState('All Cities');
    const [query, setQuery] = useState(params.get('q') || '');
    const [filterOpen, setFilterOpen] = useState(false);

    useEffect(() => {
        localStore.seed();
        const all = localStore.providers.getAll().filter(p => p.overallStatus === 'approved');
        setProviders(all);
    }, []);

    const filtered = providers.filter(p => {
        const catOk = category === 'All' || p.skillCategories.includes(category);
        const cityOk = city === 'All Cities' || p.city === city;
        const qOk = !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.skillCategories.some(s => s.toLowerCase().includes(query.toLowerCase()));
        return catOk && cityOk && qOk;
    });

    const stars = (r: number) => Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < Math.round(r) ? '#F59E0B' : 'var(--bg-border)', fontSize: '0.75rem' }}>★</span>
    ));

    const FilterContent = () => (
        <>
            <div className="card card-sm" style={{ marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)', fontSize: '0.875rem' }}>Category</h3>
                {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => { setCategory(cat); setFilterOpen(false); }} style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8,
                        background: category === cat ? '#EFF6FF' : 'none',
                        color: category === cat ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        fontSize: '0.82rem', fontWeight: category === cat ? 600 : 400, marginBottom: 2,
                        minHeight: 36,
                    }}>{cat}</button>
                ))}
            </div>
            <div className="card card-sm">
                <h3 style={{ fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)', fontSize: '0.875rem' }}>City</h3>
                {CITIES.map(c => (
                    <button key={c} onClick={() => { setCity(c); setFilterOpen(false); }} style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8,
                        background: city === c ? '#F0F9FF' : 'none',
                        color: city === c ? '#0891B2' : 'var(--text-secondary)',
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        fontSize: '0.82rem', fontWeight: city === c ? 600 : 400, marginBottom: 2,
                        minHeight: 36,
                    }}>{c}</button>
                ))}
            </div>
        </>
    );

    return (
        <>
            {/* Mobile filter overlay */}
            {filterOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 400,
                    background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)',
                }} onClick={() => setFilterOpen(false)} />
            )}
            {filterOpen && (
                <div style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 450,
                    width: 280, background: 'var(--bg-surface)', overflowY: 'auto',
                    padding: 20, boxShadow: 'var(--shadow-xl)',
                    animation: 'slideDown 0.2s ease',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>Filters</span>
                        <button onClick={() => setFilterOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <FilterContent />
                </div>
            )}

            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                {/* Desktop filter sidebar */}
                <div className="provider-filter-sidebar" style={{ width: 220, flexShrink: 0 }}>
                    <FilterContent />
                </div>

                {/* Main listing */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
                        <div className="search-bar" style={{ flex: 1 }}>
                            <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search providers..." />
                        </div>
                        {/* Mobile filter button */}
                        <button
                            onClick={() => setFilterOpen(true)}
                            className="filter-mobile-btn"
                            style={{
                                display: 'none', alignItems: 'center', gap: 6,
                                padding: '9px 14px', borderRadius: 9,
                                border: '1.5px solid var(--bg-border)', background: 'var(--bg-card)',
                                color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
                                fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap',
                            }}
                        >
                            <Filter size={15} /> Filters
                            {(category !== 'All' || city !== 'All Cities') && (
                                <span style={{ background: 'var(--brand-primary)', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                    {(category !== 'All' ? 1 : 0) + (city !== 'All Cities' ? 1 : 0)}
                                </span>
                            )}
                        </button>
                    </div>
                    <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {filtered.length} provider{filtered.length !== 1 ? 's' : ''} found
                        {category !== 'All' && <span style={{ marginLeft: 8, background: '#EFF6FF', color: 'var(--brand-primary)', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600 }}>{category}</span>}
                        {city !== 'All Cities' && <span style={{ marginLeft: 6, background: '#F0F9FF', color: '#0891B2', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600 }}>{city}</span>}
                    </div>
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🔍</div>
                            <p style={{ color: 'var(--text-muted)' }}>No providers found. Try different filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-3" style={{ gap: 16 }}>
                            {filtered.map(p => (
                                <Link key={p.id} href={`/providers/${p.id}`} style={{ textDecoration: 'none' }}>
                                    <div className="provider-card">
                                        <div style={{ padding: '20px 20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)' }}>
                                            {p.profilePhoto ? (
                                                <img src={p.profilePhoto} alt={p.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', marginBottom: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }} />
                                            ) : (
                                                <div className="avatar avatar-lg" style={{ marginBottom: 10 }}>{p.name.charAt(0)}</div>
                                            )}
                                            <div className="badge badge-success" style={{ fontSize: '0.6rem' }}><CheckCircle size={8} /> Verified</div>
                                        </div>
                                        <div className="provider-card-body">
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 3 }}>{p.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{p.skillCategories.join(', ')}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                                {stars(p.rating)}
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.rating || 'New'}</span>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({p.totalJobs} jobs)</span>
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <MapPin size={10} /> {p.city}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @media (max-width: 640px) {
                    .provider-filter-sidebar { display: none !important; }
                    .filter-mobile-btn { display: flex !important; }
                    .grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 420px) {
                    .grid-3 { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </>
    );
}

export default function ProvidersPage() {
    return (
        <>
            <PublicHeader />
            <div style={{ paddingTop: 80 }}>
                <div className="container" style={{ padding: '32px 20px' }}>
                    <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Find a Provider</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.95rem' }}>Browse verified service professionals in your city</p>
                    <Suspense fallback={<div className="spinner spinner-lg" style={{ margin: '40px auto' }} />}>
                        <ProvidersList />
                    </Suspense>
                </div>
            </div>
        </>
    );
}
