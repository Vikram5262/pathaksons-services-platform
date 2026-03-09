'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import {
    Sun, Moon, LogOut, LayoutDashboard, Menu, X,
    Home, Briefcase, Users, FileText
} from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
    { href: '/services', label: 'Services', icon: <Briefcase size={16} /> },
    { href: '/providers', label: 'Find Providers', icon: <Users size={16} /> },
    { href: '/legal', label: 'Legal', icon: <FileText size={16} /> },
];

export default function PublicHeader() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const [theme, setTheme] = useState('light');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('qavra_theme') || 'light';
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close menu on route change
    useEffect(() => { setMenuOpen(false); }, [pathname]);

    // Lock scroll when menu is open
    useEffect(() => {
        if (menuOpen) document.body.classList.add('no-scroll');
        else document.body.classList.remove('no-scroll');
        return () => document.body.classList.remove('no-scroll');
    }, [menuOpen]);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('qavra_theme', next);
    };

    const handleLogout = () => { logout(); router.push('/'); };

    const getDashboardLink = () => {
        if (!user) return '/login';
        if (user.role === 'admin') return '/admin/dashboard';
        if (user.role === 'provider') return '/provider/dashboard';
        return '/customer/dashboard';
    };

    return (
        <>
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
                height: 64, display: 'flex', alignItems: 'center',
                background: scrolled || menuOpen ? 'var(--bg-surface)' : 'transparent',
                backdropFilter: scrolled || menuOpen ? 'blur(20px)' : 'none',
                borderBottom: scrolled || menuOpen ? '1px solid var(--bg-border)' : '1px solid transparent',
                boxShadow: scrolled || menuOpen ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease',
            }}>
                <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                    {/* Logo */}
                    <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
                        <BrandLogo variant="compact" size={30} />
                    </Link>

                    {/* Desktop nav */}
                    <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {NAV_LINKS.map(link => (
                            <Link key={link.href} href={link.href} style={{
                                padding: '7px 13px', borderRadius: 8,
                                color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500,
                                transition: 'color 0.15s, background 0.15s',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-base)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right side */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            title="Toggle theme"
                            style={{
                                width: 36, height: 36, borderRadius: 8, border: '1.5px solid var(--bg-border)',
                                background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                            }}
                        >
                            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                        </button>

                        {/* Desktop auth buttons */}
                        <div className="desktop-auth" style={{ display: 'flex', gap: 8 }}>
                            {user ? (
                                <>
                                    <Link href={getDashboardLink()} style={{
                                        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                                        background: 'var(--bg-card)', border: '1.5px solid var(--bg-border)',
                                        borderRadius: 9, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)',
                                        textDecoration: 'none', transition: 'all 0.15s',
                                    }}>
                                        <LayoutDashboard size={13} /> Dashboard
                                    </Link>
                                    <button onClick={handleLogout} style={{
                                        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                                        background: 'var(--color-danger-bg)', border: '1px solid rgba(220,38,38,0.15)',
                                        borderRadius: 9, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-danger)',
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}>
                                        <LogOut size={13} /> Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" style={{
                                        padding: '7px 16px', borderRadius: 9, border: '1.5px solid var(--bg-border)',
                                        background: 'transparent', color: 'var(--text-primary)', fontSize: '0.875rem',
                                        fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s',
                                    }}>Log In</Link>
                                    <Link href="/signup" style={{
                                        padding: '7px 16px', borderRadius: 9,
                                        background: 'var(--brand-primary)', color: '#fff',
                                        fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
                                        boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                                    }}>Get Started</Link>
                                </>
                            )}
                        </div>

                        {/* Hamburger – mobile only */}
                        <button
                            className="hamburger-btn"
                            onClick={() => setMenuOpen(o => !o)}
                            aria-label="Toggle navigation"
                            style={{
                                display: 'none',
                                width: 36, height: 36, borderRadius: 8,
                                border: '1.5px solid var(--bg-border)', background: 'var(--bg-card)',
                                alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
                            }}
                        >
                            {menuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile nav drawer */}
            {menuOpen && (
                <div className="mobile-nav-drawer">
                    {/* Nav links */}
                    {NAV_LINKS.map(link => (
                        <Link key={link.href} href={link.href} className="mobile-nav-link">
                            {link.icon} {link.label}
                        </Link>
                    ))}

                    <div className="mobile-nav-divider" />

                    {/* Auth section */}
                    {user ? (
                        <>
                            <Link href={getDashboardLink()} className="mobile-nav-link" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                                <LayoutDashboard size={16} /> Dashboard
                            </Link>
                            <button onClick={handleLogout} className="mobile-nav-link" style={{
                                border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                color: 'var(--color-danger)', width: '100%', textAlign: 'left',
                            }}>
                                <LogOut size={16} /> Sign Out
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
                            <Link href="/login" style={{
                                display: 'block', padding: '12px 16px', textAlign: 'center',
                                border: '1.5px solid var(--bg-border)', borderRadius: 10,
                                fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none',
                            }}>Log In</Link>
                            <Link href="/signup" style={{
                                display: 'block', padding: '12px 16px', textAlign: 'center',
                                background: 'var(--brand-primary)', borderRadius: 10,
                                fontWeight: 600, color: '#fff', textDecoration: 'none',
                                boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                            }}>Get Started – Free</Link>
                        </div>
                    )}
                </div>
            )}

            {/* Responsive style for hamburger visibility */}
            <style>{`
        @media (max-width: 768px) {
          .hamburger-btn { display: flex !important; }
          .desktop-nav { display: none !important; }
          .desktop-auth { display: none !important; }
        }
      `}</style>
        </>
    );
}
