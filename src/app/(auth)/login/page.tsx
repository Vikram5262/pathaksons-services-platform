'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Phone, Lock, Shield, ChevronRight } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { login, loginAdmin } = useAuth();
    const router = useRouter();
    const [mode, setMode] = useState<'user' | 'admin'>('user');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('admin@qavra.com');
    const [password, setPassword] = useState('admin@123');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleUserLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone) return toast.error('Enter your phone number');
        setLoading(true);
        const res = await login(phone, '');
        setLoading(false);
        if (!res.success) { toast.error(res.error || 'Login failed'); return; }
        // Redirect based on role
        const session = JSON.parse(localStorage.getItem('qavra_session') || '{}');
        if (session.role === 'admin') router.push('/admin/dashboard');
        else if (session.role === 'provider') router.push('/provider/dashboard');
        else router.push('/customer/dashboard');
        toast.success('Welcome back!');
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await loginAdmin(email, password);
        setLoading(false);
        if (!res.success) { toast.error(res.error || 'Invalid credentials'); return; }
        router.push('/admin/dashboard');
        toast.success('Welcome, Admin!');
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
            {/* Background */}
            <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(245,158,11,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: 440, animation: 'slideUp 0.3s forwards', padding: '0 4px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <BrandLogo variant="full" size={52} />
                    </Link>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: '0.9rem' }}>Sign in to your account</p>
                </div>

                <div className="card" style={{ padding: 32 }}>
                    {/* Mode toggle */}
                    <div className="tab-bar" style={{ marginBottom: 24 }}>
                        <button className={`tab-btn${mode === 'user' ? ' active' : ''}`} onClick={() => setMode('user')}>
                            <Phone size={14} style={{ display: 'inline', marginRight: 4 }} /> User Login
                        </button>
                        <button className={`tab-btn${mode === 'admin' ? ' active' : ''}`} onClick={() => setMode('admin')}>
                            <Shield size={14} style={{ display: 'inline', marginRight: 4 }} /> Admin Login
                        </button>
                    </div>

                    {mode === 'user' ? (
                        <form onSubmit={handleUserLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="input-group">
                                <label className="input-label">Phone Number</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input className="input" style={{ paddingLeft: 40 }} placeholder="Enter your phone number" value={phone} onChange={e => setPhone(e.target.value)} type="tel" maxLength={10} />
                                </div>
                                <span className="input-error" style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    Demo: 9876543210 (customer) | 9765432100 (provider)
                                </span>
                            </div>
                            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
                                {loading ? <div className="spinner" /> : <>Sign In <ChevronRight size={16} /></>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="input-group">
                                <label className="input-label">Admin Email</label>
                                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@qavra.com" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input className="input" style={{ paddingLeft: 40, paddingRight: 40 }} type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
                                    <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Demo: admin@qavra.com / admin@123</span>
                            </div>
                            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
                                {loading ? <div className="spinner" /> : <>Admin Sign In <Shield size={16} /></>}
                            </button>
                        </form>
                    )}

                    <div style={{ marginTop: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Join QAVRA</Link>
                    </div>
                </div>

                <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>← Back to home</Link>
                </div>
            </div>
        </div>
    );
}
