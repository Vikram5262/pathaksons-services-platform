'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, UserCheck, CalendarDays, AlertTriangle,
    TrendingUp, LogOut, Shield, ChevronRight, Wrench, Wallet,
    Briefcase, Settings, X, Menu
} from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';

interface NavItem { href: string; label: string; icon: React.ReactNode; }

const adminNav: NavItem[] = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
    { href: '/admin/users', label: 'Users', icon: <Users size={17} /> },
    { href: '/admin/providers', label: 'Providers', icon: <UserCheck size={17} /> },
    { href: '/admin/bookings', label: 'Bookings', icon: <CalendarDays size={17} /> },
    { href: '/admin/fraud', label: 'Fraud Logs', icon: <AlertTriangle size={17} /> },
    { href: '/admin/revenue', label: 'Revenue', icon: <TrendingUp size={17} /> },
];

const customerNav: NavItem[] = [
    { href: '/customer/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
    { href: '/customer/book', label: 'Book Service', icon: <Briefcase size={17} /> },
    { href: '/customer/bookings', label: 'My Bookings', icon: <CalendarDays size={17} /> },
];

const providerNav: NavItem[] = [
    { href: '/provider/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
    { href: '/provider/jobs', label: 'Jobs', icon: <Briefcase size={17} /> },
    { href: '/provider/earnings', label: 'Earnings', icon: <Wallet size={17} /> },
    { href: '/provider/profile', label: 'Profile', icon: <Settings size={17} /> },
];


export default function Sidebar({ role }: { role: 'admin' | 'customer' | 'provider' }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const nav = role === 'admin' ? adminNav : role === 'provider' ? providerNav : customerNav;
    const roleLabel = { admin: 'Admin Panel', customer: 'Customer', provider: 'Provider' }[role];

    const handleLogout = () => { logout(); router.push('/'); };

    // Close sidebar on route change (mobile)
    useEffect(() => { setSidebarOpen(false); }, [pathname]);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (sidebarOpen) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
        return () => document.body.classList.remove('no-scroll');
    }, [sidebarOpen]);

    return (
        <>
            {/* Mobile topbar */}
            <div className="mobile-topbar">
                <button
                    className="mobile-menu-btn"
                    onClick={() => setSidebarOpen(o => !o)}
                    aria-label="Toggle menu"
                >
                    {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <BrandLogo variant="compact" size={26} />
                </Link>
                <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {roleLabel}
                </div>
            </div>

            {/* Backdrop overlay */}
            <div
                className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
                <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link href="/" style={{ textDecoration: 'none' }}><BrandLogo variant="full" size={32} /></Link>
                    {/* Close button visible on mobile */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        style={{
                            display: 'none',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: 4, borderRadius: 6,
                        }}
                        className="sidebar-close-btn"
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Role indicator */}
                <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{roleLabel}</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">Navigation</div>
                    {nav.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item${pathname === item.href || pathname.startsWith(item.href + '/') ? ' active' : ''}`}
                        >
                            {item.icon}
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {(pathname === item.href || pathname.startsWith(item.href + '/')) && <ChevronRight size={13} />}
                        </Link>
                    ))}
                </nav>

                <div style={{ padding: '12px 14px', borderTop: '1px solid var(--bg-border)' }}>
                    {user && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.phone}</div>
                            </div>
                        </div>
                    )}
                    <button
                        className="btn btn-secondary btn-full"
                        style={{ gap: 8, fontSize: '0.8rem', minHeight: 40 }}
                        onClick={handleLogout}
                    >
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </aside>

            {/* Inline style for sidebar close btn visibility on mobile */}
            <style>{`
                @media (max-width: 1024px) {
                    .sidebar-close-btn { display: flex !important; }
                }
            `}</style>
        </>
    );
}
