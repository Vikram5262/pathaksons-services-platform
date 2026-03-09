'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, ChevronRight, Shield, KeyRound, RefreshCw } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import toast from 'react-hot-toast';

type LoginTab = 'otp' | 'password';

export default function LoginPage() {
    const { loginWithPassword, sendEmailOTP, verifyEmailOTP, loginAdmin } = useAuth();
    const router = useRouter();

    const [tab, setTab] = useState<LoginTab>('otp');
    const [loading, setLoading] = useState(false);

    // Email OTP state
    const [otpEmail, setOtpEmail] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpCooldown, setOtpCooldown] = useState(0);
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Password login state
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    // Admin panel (hidden by default, toggled via URL param or secret click)
    const [showAdmin, setShowAdmin] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPwd, setAdminPwd] = useState('');
    const [showAdminPwd, setShowAdminPwd] = useState(false);
    const logoClickCount = useRef(0);

    // Triple-click on logo reveals admin login
    const handleLogoClick = () => {
        logoClickCount.current += 1;
        if (logoClickCount.current >= 5) { setShowAdmin(s => !s); logoClickCount.current = 0; }
    };

    const startCooldown = () => {
        setOtpCooldown(60);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setOtpCooldown(s => { if (s <= 1) { clearInterval(cooldownRef.current!); return 0; } return s - 1; });
        }, 1000);
    };

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpEmail) return toast.error('Enter your email address');
        if (otpCooldown > 0) return toast.error(`Wait ${otpCooldown}s before resending`);
        setLoading(true);
        const res = await sendEmailOTP(otpEmail);
        setLoading(false);
        if (!res.success) { toast.error(res.error || 'Failed to send OTP'); return; }
        setOtpSent(true);
        startCooldown();
        toast.success('OTP sent! (Demo: use 1234)', { duration: 4000 });
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpCode || otpCode.length < 4) return toast.error('Enter the 4-digit OTP');
        setLoading(true);
        const res = await verifyEmailOTP(otpEmail, otpCode);
        setLoading(false);
        if (!res.success) { toast.error(res.error || 'Invalid OTP'); return; }
        const session = JSON.parse(localStorage.getItem('qavra_session') || '{}');
        toast.success('Logged in!');
        redirect(session.role);
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier || !password) return toast.error('Enter your email/username and password');
        setLoading(true);
        const res = await loginWithPassword(identifier, password);
        setLoading(false);
        if (!res.success) { toast.error(res.error || 'Login failed'); return; }
        const session = JSON.parse(localStorage.getItem('qavra_session') || '{}');
        toast.success('Welcome back!');
        redirect(session.role);
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminEmail || !adminPwd) return toast.error('Enter admin credentials');
        setLoading(true);
        const res = await loginAdmin(adminEmail, adminPwd);
        setLoading(false);
        if (!res.success) { toast.error(res.error || 'Invalid credentials'); return; }
        toast.success('Welcome, Admin!');
        router.push('/admin/dashboard');
    };

    const redirect = (role: string) => {
        if (role === 'admin') router.push('/admin/dashboard');
        else if (role === 'provider') router.push('/provider/dashboard');
        else router.push('/customer/dashboard');
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
            {/* Background glow */}
            <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(245,158,11,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: 440, animation: 'slideUp 0.3s forwards', padding: '0 4px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div onClick={handleLogoClick} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'default', textDecoration: 'none' }}>
                        <Link href="/" style={{ textDecoration: 'none' }}>
                            <BrandLogo variant="full" size={52} />
                        </Link>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: '0.9rem' }}>Sign in to your account</p>
                </div>

                <div className="card" style={{ padding: 32 }}>
                    {/* Admin Panel (hidden by default) */}
                    {showAdmin ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.15)', borderRadius: 10 }}>
                                <Shield size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#EF4444' }}>Admin Access — Restricted</span>
                                <button onClick={() => setShowAdmin(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>Hide</button>
                            </div>
                            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="input-group">
                                    <label className="input-label">Admin Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input className="input" style={{ paddingLeft: 40 }} type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@qavra.com" />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Admin Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input className="input" style={{ paddingLeft: 40, paddingRight: 40 }} type={showAdminPwd ? 'text' : 'password'} value={adminPwd} onChange={e => setAdminPwd(e.target.value)} placeholder="Password" />
                                        <button type="button" onClick={() => setShowAdminPwd(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                            {showAdminPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Demo: admin@qavra.com / admin@123</span>
                                </div>
                                <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
                                    {loading ? <div className="spinner" /> : <><Shield size={15} /> Admin Sign In</>}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            {/* User Login Tabs */}
                            <div className="tab-bar" style={{ marginBottom: 24 }}>
                                <button className={`tab-btn${tab === 'otp' ? ' active' : ''}`} onClick={() => setTab('otp')}>
                                    <Mail size={13} style={{ display: 'inline', marginRight: 5 }} /> Email OTP
                                </button>
                                <button className={`tab-btn${tab === 'password' ? ' active' : ''}`} onClick={() => setTab('password')}>
                                    <KeyRound size={13} style={{ display: 'inline', marginRight: 5 }} /> Username / Password
                                </button>
                            </div>

                            {/* Email OTP Tab */}
                            {tab === 'otp' && (
                                <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div className="input-group">
                                        <label className="input-label">Email Address</label>
                                        <div style={{ position: 'relative' }}>
                                            <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input className="input" style={{ paddingLeft: 40 }} type="email" value={otpEmail} onChange={e => setOtpEmail(e.target.value)} placeholder="yourname@email.com" disabled={otpSent} />
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Demo: rahul@example.com</span>
                                    </div>

                                    {!otpSent ? (
                                        <button className="btn btn-primary btn-full btn-lg" onClick={handleSendOTP} disabled={loading || otpCooldown > 0} type="button">
                                            {loading ? <div className="spinner" /> : <><Mail size={15} /> Send OTP</>}
                                        </button>
                                    ) : (
                                        <>
                                            <div className="input-group">
                                                <label className="input-label">Enter OTP</label>
                                                <input className="input" type="text" inputMode="numeric" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} placeholder="Enter 4-digit OTP" style={{ letterSpacing: 6, fontSize: '1.2rem', textAlign: 'center' }} />
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Demo OTP: <strong>1234</strong> · Valid for 5 minutes</span>
                                            </div>
                                            <button className="btn btn-primary btn-full btn-lg" onClick={handleVerifyOTP} disabled={loading} type="button">
                                                {loading ? <div className="spinner" /> : <><ChevronRight size={16} /> Verify & Sign In</>}
                                            </button>
                                            <button type="button" onClick={handleSendOTP} disabled={otpCooldown > 0 || loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'none', border: 'none', color: otpCooldown > 0 ? 'var(--text-muted)' : 'var(--brand-primary)', fontSize: '0.8rem', cursor: otpCooldown > 0 ? 'default' : 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                                                <RefreshCw size={12} /> {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                                            </button>
                                        </>
                                    )}
                                </form>
                            )}

                            {/* Username + Password Tab */}
                            {tab === 'password' && (
                                <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div className="input-group">
                                        <label className="input-label">Email or Username</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input className="input" style={{ paddingLeft: 40 }} value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="email@example.com or username" autoComplete="username" />
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Demo: <strong>rahul123</strong> or <strong>rahul@example.com</strong></span>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input className="input" style={{ paddingLeft: 40, paddingRight: 40 }} type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" />
                                            <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Demo password: <strong>test123</strong></span>
                                    </div>
                                    <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
                                        {loading ? <div className="spinner" /> : <>Sign In <ChevronRight size={16} /></>}
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    <div style={{ marginTop: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Join QAVRA</Link>
                    </div>
                </div>

                <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>← Back to home</Link>
                </div>

                {/* Admin hint — only in dev */}
                <div style={{ marginTop: 8, textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.5 }}>
                    Admin: click logo 5× to access admin panel
                </div>
            </div>
        </div>
    );
}
