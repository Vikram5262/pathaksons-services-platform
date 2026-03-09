'use client';
import Link from 'next/link';
import PublicHeader from '@/components/layout/PublicHeader';
import { useEffect, useState } from 'react';
import { localStore, Provider } from '@/lib/localStore';
import BrandLogo from '@/components/brand/BrandLogo';
import {
  Zap, Wrench, ChefHat, Car, ShoppingBag, Shield, Heart, Sparkles,
  CheckCircle, ArrowRight, Lock, MapPin, Phone, Clock, Award, Star,
  Search, Users, Briefcase, UserCheck
} from 'lucide-react';

const CATEGORIES = [
  { icon: <Zap size={22} />, label: 'Electrician', color: '#2563EB', bg: '#EFF6FF' },
  { icon: <Wrench size={22} />, label: 'Plumber', color: '#0891B2', bg: '#F0F9FF' },
  { icon: <ChefHat size={22} />, label: 'Cook', color: '#059669', bg: '#F0FDF4' },
  { icon: <Car size={22} />, label: 'Driver', color: '#7C3AED', bg: '#F5F3FF' },
  { icon: <ShoppingBag size={22} />, label: 'Grocery Runner', color: '#DB2777', bg: '#FDF2F8' },
  { icon: <Shield size={22} />, label: 'Security Guard', color: '#D97706', bg: '#FFFBEB' },
  { icon: <Heart size={22} />, label: 'Senior Care', color: '#0D9488', bg: '#F0FDFA' },
  { icon: <Users size={22} />, label: 'Daily Helper', color: '#7C3AED', bg: '#F5F3FF' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: <Search size={26} style={{ color: '#2563EB' }} />, title: 'Search Service', desc: 'Browse categories or search for the service you need. Filter by city and rating.' },
  { step: '02', icon: <UserCheck size={26} style={{ color: '#059669' }} />, title: 'Pick a Provider', desc: 'View verified profiles, ratings, and reviews. Choose or let us auto-match.' },
  { step: '03', icon: <Lock size={26} style={{ color: '#7C3AED' }} />, title: 'Book & Pay', desc: 'Select your time slot and pay securely. Funds held in escrow until job done.' },
  { step: '04', icon: <CheckCircle size={26} style={{ color: '#D97706' }} />, title: 'Job Done', desc: 'Provider arrives, you share OTP to start. Approve completion and release payment.' },
];

const TRUST_POINTS = [
  { icon: <Shield size={18} />, title: 'Background Verified', desc: 'Police verification certificate mandatory for all providers', color: '#2563EB', bg: '#EFF6FF' },
  { icon: <Lock size={18} />, title: 'Escrow Payments', desc: 'Funds held safely until job is confirmed complete', color: '#059669', bg: '#F0FDF4' },
  { icon: <Phone size={18} />, title: 'Masked Contact', desc: 'Your phone number is never shared with providers', color: '#7C3AED', bg: '#F5F3FF' },
  { icon: <CheckCircle size={18} />, title: 'Photo Proof', desc: 'Before & after photos uploaded for every job', color: '#0891B2', bg: '#F0F9FF' },
  { icon: <Award size={18} />, title: 'Aadhaar Verified', desc: 'Government ID verification for all service providers', color: '#D97706', bg: '#FFFBEB' },
  { icon: <Star size={18} />, title: 'Rating System', desc: 'Community-driven ratings keep quality high', color: '#DB2777', bg: '#FDF2F8' },
];

export default function HomePage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    localStore.seed();
    const all = localStore.providers.getAll().filter(p => p.overallStatus === 'approved');
    setProviders(all.slice(0, 4));
  }, []);

  const stars = (r: number) => Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < Math.round(r) ? '#F59E0B' : '#CBD5E1', fontSize: '0.8rem' }}>★</span>
  ));

  return (
    <>
      <PublicHeader />
      <main>
        {/* ── HERO ── */}
        <section className="hero-section">
          <div className="hero-bg" />
          <div className="hero-grid" />
          <div className="container" style={{ position: 'relative', zIndex: 2, paddingTop: 80 }}>
            <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
              {/* Chip */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px',
                background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 9999,
                fontSize: '0.72rem', fontWeight: 700, color: '#2563EB', marginBottom: 24,
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                <MapPin size={11} /> India's Most Trusted Service Platform
              </div>

              <h1 className="font-display" style={{ fontSize: 'clamp(2.1rem, 5vw, 3.6rem)', fontWeight: 800, lineHeight: 1.12, marginBottom: 20, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                Reliable Local Services,{' '}
                <span className="gradient-text">On Demand</span>
              </h1>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.75, maxWidth: 520, margin: '0 auto 40px' }}>
                Book verified electricians, plumbers, cooks, drivers and more. Every provider is background-checked and Aadhaar verified.
              </p>

              {/* Search */}
              <div style={{
                maxWidth: 540, margin: '0 auto 44px',
                background: 'var(--bg-card)',
                border: '1.5px solid var(--bg-border)',
                borderRadius: 18, padding: '6px 6px 6px 18px',
                display: 'flex', gap: 8, alignItems: 'center',
                boxShadow: '0 8px 32px rgba(37,99,235,0.1)',
              }}>
                <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search for electrician, plumber, cook..."
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', padding: '8px 0' }}
                />
                <Link href={`/providers${search ? `?q=${encodeURIComponent(search)}` : ''}`} style={{
                  padding: '11px 22px', background: '#2563EB', color: '#fff',
                  borderRadius: 13, fontSize: '0.875rem', fontWeight: 600,
                  textDecoration: 'none', flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                }}>
                  Search
                </Link>
              </div>

              {/* Quick stats */}
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginTop: 40 }}>
                {[['500+', 'Verified Providers'], ['10K+', 'Jobs Completed'], ['4.8★', 'Avg. Rating'], ['15+', 'Cities']].map(([v, l]) => (
                  <div key={l} style={{ textAlign: 'center', minWidth: 70 }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563EB', fontFamily: 'Poppins, sans-serif' }}>{v}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CATEGORIES ── */}
        <section className="section" style={{ background: 'var(--bg-surface)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div className="section-chip" style={{ marginBottom: 14 }}>Our Services</div>
              <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Browse by Category</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 10, fontSize: '0.95rem' }}>Find the right professional for any household task</p>
            </div>
            <div className="grid grid-4 category-grid-mobile" style={{ gap: 14 }}>
              {CATEGORIES.map(cat => (
                <Link key={cat.label} href={`/providers?category=${encodeURIComponent(cat.label)}`} className="category-card" style={{ textDecoration: 'none' }}>
                  <div className="category-icon" style={{ background: cat.bg, color: cat.color }}>
                    {cat.icon}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="section">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div className="section-chip" style={{ marginBottom: 14 }}>Process</div>
              <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>How It Works</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 10, fontSize: '0.95rem' }}>Book a verified professional in under 3 minutes</p>
            </div>
            <div className="grid grid-4" style={{ gap: 24 }}>
              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                  <div style={{
                    width: 68, height: 68,
                    background: 'var(--bg-card)',
                    border: '1.5px solid var(--bg-border)',
                    borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 18px',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}>
                    {step.icon}
                  </div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#2563EB', letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' }}>Step {step.step}</div>
                  <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontSize: '0.95rem' }}>{step.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TOP PROVIDERS ── */}
        {providers.length > 0 && (
          <section className="section" style={{ background: 'var(--bg-surface)' }}>
            <div className="container">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
                <div>
                  <div className="section-chip" style={{ marginBottom: 10 }}>Top Rated</div>
                  <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Trusted Providers</h2>
                  <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>Verified professionals your neighbors trust</p>
                </div>
                <Link href="/providers" className="btn btn-secondary" style={{ gap: 6 }}>View All <ArrowRight size={14} /></Link>
              </div>
              <div className="grid grid-4" style={{ gap: 20 }}>
                {providers.map(p => (
                  <Link key={p.id} href={`/providers/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div className="provider-card">
                      <div style={{ background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)', padding: '24px 24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                        <div className="avatar avatar-xl" style={{ marginBottom: 12 }}>{p.name.charAt(0)}</div>
                        <div className="badge badge-success" style={{ position: 'absolute', top: 12, right: 12, fontSize: '0.58rem' }}>
                          <CheckCircle size={7} /> Verified
                        </div>
                      </div>
                      <div className="provider-card-body">
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, fontSize: '0.9rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>{p.skillCategories.join(', ')}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                          <div style={{ display: 'flex' }}>{stars(p.rating)}</div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.rating}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({p.totalJobs})</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={10} /> {p.city}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── TRUST & SAFETY ── */}
        <section className="section">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div className="section-chip" style={{ marginBottom: 14 }}>Trust & Safety</div>
              <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Built for Peace of Mind</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 10, maxWidth: 480, margin: '10px auto 0', fontSize: '0.95rem' }}>
                Multiple layers of protection for both customers and providers
              </p>
            </div>
            <div className="grid grid-3" style={{ gap: 20 }}>
              {TRUST_POINTS.map((tp, i) => (
                <div key={i} className="card" style={{ padding: '22px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: tp.bg, color: tp.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {tp.icon}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontSize: '0.9rem' }}>{tp.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.6 }}>{tp.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── JOIN CTA ── */}
        <section style={{ padding: '80px 0', background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="section-chip" style={{ marginBottom: 20 }}>Get Started Today</div>
            <h2 className="font-display" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14, letterSpacing: '-0.03em' }}>
              Ready to Book a Service?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 40, fontSize: '1rem', maxWidth: 440, margin: '0 auto 40px' }}>
              Join thousands of customers and providers on India's most trusted service platform.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/signup" style={{
                padding: '13px 28px', background: '#2563EB', color: '#fff',
                borderRadius: 12, fontSize: '0.9rem', fontWeight: 700,
                textDecoration: 'none', boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>Book a Service <ArrowRight size={15} /></Link>
              <Link href="/signup" style={{
                padding: '13px 28px', background: 'white', color: '#2563EB',
                borderRadius: 12, fontSize: '0.9rem', fontWeight: 700,
                textDecoration: 'none', border: '1.5px solid #BFDBFE',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>Become a Provider</Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', padding: '40px 0' }}>
          <div className="container">
            <div className="grid grid-4" style={{ gap: 32, marginBottom: 36 }}>
              <div>
                <div style={{ marginBottom: 12 }}>
                  <Link href="/" style={{ textDecoration: 'none' }}>
                    <BrandLogo variant="full" size={34} />
                  </Link>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  India's trusted local service marketplace. Connecting customers with verified professionals.
                </p>
              </div>
              {[
                { title: 'Services', links: ['Electrician', 'Plumber', 'Cook', 'Driver', 'All Services'] },
                { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Press'] },
                { title: 'Legal', links: ['Terms of Service', 'Privacy Policy', 'Refund Policy', 'Safety'] },
              ].map(col => (
                <div key={col.title}>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col.title}</h4>
                  {col.links.map(link => (
                    <Link key={link} href={col.title === 'Legal' ? '/legal' : col.title === 'Services' ? '/services' : '#'} style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 8, textDecoration: 'none', transition: 'color 0.15s' }}>
                      {link}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>© 2026 Services by Pathak &amp; Sons. All rights reserved.</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>We act as a technology intermediary. Not responsible for provider actions.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
