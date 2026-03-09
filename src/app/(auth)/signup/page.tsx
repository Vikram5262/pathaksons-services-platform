'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Wrench, ChevronRight, ChevronLeft, Check, Upload, Image, Video, Shield, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { localStore } from '@/lib/localStore';
import BrandLogo from '@/components/brand/BrandLogo';

const SKILLS = ['Electrician', 'Plumber', 'Cook', 'Driver', 'Daily Helper', 'Security Guard', 'Senior Care', 'Grocery Runner', 'Local Freelancer'];
const CITIES = ['Indore', 'Bhopal', 'Jabalpur', 'Ujjain', 'Gwalior', 'Rewa', 'Sagar', 'Satna', 'Ratlam', 'Dewas'];

// Compress image via canvas (max 800px, quality 0.7)
async function compressImage(file: File, maxPx = 800, quality = 0.72): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.onload = () => {
                const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
                const canvas = document.createElement('canvas');
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = e.target!.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Validate file type and size
function validateFile(file: File, allowedTypes: string[], maxMB: number): string | null {
    if (!allowedTypes.some(t => file.type.startsWith(t))) return `Invalid file type. Allowed: ${allowedTypes.join(', ')}`;
    if (file.size > maxMB * 1024 * 1024) return `File too large. Max ${maxMB}MB allowed.`;
    return null;
}

// Video duration check
function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
        const vid = document.createElement('video');
        vid.preload = 'metadata';
        vid.onloadedmetadata = () => { URL.revokeObjectURL(vid.src); resolve(vid.duration); };
        vid.src = URL.createObjectURL(file);
    });
}

export default function SignupPage() {
    const { signup } = useAuth();
    const router = useRouter();
    const [role, setRole] = useState<'customer' | 'provider' | null>(null);
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Common fields
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [city, setCity] = useState('Indore');
    const [address, setAddress] = useState('');

    // Provider basic
    const [skills, setSkills] = useState<string[]>([]);
    const [aadhaar, setAadhaar] = useState('');
    const [police, setPolice] = useState('');
    const [bank, setBank] = useState('');
    const [ifsc, setIfsc] = useState('');

    // OTP
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);

    // Uploads
    const [profilePhoto, setProfilePhoto] = useState<string>('');
    const [govIdDoc, setGovIdDoc] = useState<string>('');
    const [addressProofDoc, setAddressProofDoc] = useState<string>('');
    const [workPhotos, setWorkPhotos] = useState<string[]>([]);
    const [workVideos, setWorkVideos] = useState<string[]>([]);

    // Liability
    const [liabilityAccepted, setLiabilityAccepted] = useState(false);

    // Refs
    const profileRef = useRef<HTMLInputElement>(null);
    const govIdRef = useRef<HTMLInputElement>(null);
    const addressProofRef = useRef<HTMLInputElement>(null);
    const workPhotoRef = useRef<HTMLInputElement>(null);
    const workVideoRef = useRef<HTMLInputElement>(null);

    // OTP send with 60s cooldown
    const sendOtp = () => {
        if (!phone || phone.length < 10) { toast.error('Enter a valid 10-digit phone number'); return; }
        if (!/^\d{10}$/.test(phone)) { toast.error('Phone must be exactly 10 digits'); return; }
        setOtpSent(true);
        setOtpCooldown(60);
        toast.success('OTP sent! Use: 1234 (demo)');
        const timer = setInterval(() => {
            setOtpCooldown(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
        }, 1000);
    };

    const verifyOtp = () => {
        if (otp === '1234') { setOtpVerified(true); toast.success('Phone verified!'); }
        else toast.error('Invalid OTP. Use 1234 for demo.');
    };

    // Upload handlers
    const handleProfilePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const err = validateFile(file, ['image/'], 5);
        if (err) { toast.error(err); return; }
        try { setProfilePhoto(await compressImage(file)); toast.success('Profile photo uploaded!'); }
        catch { toast.error('Failed to process image.'); }
    };

    const handleGovId = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const err = validateFile(file, ['image/', 'application/pdf'], 10);
        if (err) { toast.error(err); return; }
        if (file.type.startsWith('image/')) {
            try { setGovIdDoc(await compressImage(file)); toast.success('ID document uploaded!'); } catch { toast.error('Failed to process image.'); }
        } else {
            const reader = new FileReader();
            reader.onload = e => { setGovIdDoc(e.target!.result as string); toast.success('ID document uploaded!'); };
            reader.readAsDataURL(file);
        }
    };

    const handleAddressProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const err = validateFile(file, ['image/', 'application/pdf'], 10);
        if (err) { toast.error(err); return; }
        if (file.type.startsWith('image/')) {
            try { setAddressProofDoc(await compressImage(file)); toast.success('Address proof uploaded!'); } catch { toast.error('Failed to process image.'); }
        } else {
            const reader = new FileReader();
            reader.onload = e => { setAddressProofDoc(e.target!.result as string); toast.success('Address proof uploaded!'); };
            reader.readAsDataURL(file);
        }
    };

    const handleWorkPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (workPhotos.length + files.length > 8) { toast.error('Maximum 8 work photos allowed'); return; }
        const processed: string[] = [];
        for (const file of files) {
            const err = validateFile(file, ['image/'], 5);
            if (err) { toast.error(err); continue; }
            try { processed.push(await compressImage(file, 1200, 0.8)); } catch { toast.error(`Failed: ${file.name}`); }
        }
        setWorkPhotos(prev => [...prev, ...processed]);
        if (processed.length) toast.success(`${processed.length} photo(s) added!`);
    };

    const handleWorkVideos = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (workVideos.length + files.length > 2) { toast.error('Maximum 2 work videos allowed'); return; }
        for (const file of files) {
            const err = validateFile(file, ['video/'], 50);
            if (err) { toast.error(err); continue; }
            const duration = await getVideoDuration(file);
            if (duration > 31) { toast.error(`Video "${file.name}" exceeds 30 seconds (${Math.round(duration)}s)`); continue; }
            const reader = new FileReader();
            reader.onload = ev => {
                setWorkVideos(prev => [...prev, ev.target!.result as string]);
                toast.success(`Video "${file.name}" added!`);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCustomerSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpVerified) { toast.error('Please verify your phone first'); return; }
        if (!name.trim()) { toast.error('Enter your name'); return; }
        if (!username.trim()) { toast.error('Enter a username'); return; }
        if (!password) { toast.error('Create a password'); return; }
        if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
        if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setLoading(true);
        const res = await signup({ name, phone, email: email || undefined, username: username.trim(), role: 'customer', city, address, password });
        setLoading(false);
        if (!res.success) { toast.error(res.error!); return; }
        toast.success('Account created! Welcome to QAVRA 🎉');
        router.push('/customer/dashboard');
    };

    const handleProviderSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!liabilityAccepted) { toast.error('You must accept the liability agreement to register as a provider.'); return; }
        setLoading(true);
        const res = await signup({ name, phone, email: email || undefined, role: 'provider', city, address, password: '' });
        setLoading(false);
        if (!res.success) { toast.error(res.error!); return; }
        const user = localStore.users.getByPhone(phone);
        if (user) {
            localStore.providers.create({
                userId: user.id, name, phone, email: email || undefined, skillCategories: skills,
                aadhaarStatus: 'pending', selfieStatus: 'pending', bankStatus: 'pending', policeVerificationStatus: 'pending',
                overallStatus: 'pending', rating: 0, totalJobs: 0, earnings: 0, city, address, isAvailable: false,
                profilePhoto: profilePhoto || undefined,
                govIdDoc: govIdDoc || undefined,
                addressProofDoc: addressProofDoc || undefined,
                workPhotos: workPhotos.length ? workPhotos : undefined,
                workVideos: workVideos.length ? workVideos : undefined,
                liabilityAccepted: true,
                liabilityAcceptedAt: new Date().toISOString(),
                complaintCount: 0,
            });
        }
        toast.success('Application submitted! Admin will review within 24 hours.');
        router.push('/provider/dashboard');
    };

    // ─── Role selector ───────────────────────────────────────────────────────
    if (!role) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.1), transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ width: '100%', maxWidth: 560, animation: 'slideUp 0.3s forwards' }}>
                    <div style={{ textAlign: 'center', marginBottom: 40 }}>
                        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <BrandLogo variant="full" size={48} />
                        </Link>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 16, color: 'var(--text-primary)' }}>Join Us</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>How would you like to use the platform?</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {[
                            { role: 'customer', icon: <User size={32} />, title: 'As a Customer', desc: 'Book trusted local service professionals near you', color: '#F59E0B' },
                            { role: 'provider', icon: <Wrench size={32} />, title: 'As a Provider', desc: 'Offer your skills and earn money on your schedule', color: '#06B6D4' },
                        ].map(opt => (
                            <button key={opt.role} onClick={() => setRole(opt.role as 'customer' | 'provider')} style={{
                                background: 'var(--bg-card)', border: '2px solid var(--bg-border)',
                                borderRadius: 20, padding: 32, cursor: 'pointer', textAlign: 'center',
                                transition: 'all 0.25s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                                fontFamily: 'inherit',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = opt.color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                            >
                                <div style={{ color: opt.color }}>{opt.icon}</div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{opt.title}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{opt.desc}</div>
                            </button>
                        ))}
                    </div>
                    <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Already have an account? <Link href="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Sign in</Link>
                    </p>
                </div>
            </div>
        );
    }

    // ─── Customer Registration ───────────────────────────────────────────────
    if (role === 'customer') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.08), transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ width: '100%', maxWidth: 480, animation: 'slideUp 0.3s forwards' }}>
                    <button onClick={() => setRole(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 24, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                        <ChevronLeft size={16} /> Back
                    </button>
                    <div className="card" style={{ padding: 32 }}>
                        <div style={{ textAlign: 'center', marginBottom: 28 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#F59E0B' }}><User size={24} /></div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>Customer Registration</h2>
                        </div>
                        <form onSubmit={handleCustomerSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="input-group">
                                <label className="input-label">Full Name *</label>
                                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Phone Number *</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input className="input" style={{ flex: 1 }} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" type="tel" maxLength={10} />
                                    {!otpSent ? (
                                        <button type="button" className="btn btn-secondary" onClick={sendOtp}>Send OTP</button>
                                    ) : !otpVerified ? (
                                        <button type="button" className="btn btn-accent btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={verifyOtp}>Verify</button>
                                    ) : (
                                        <div className="badge badge-success" style={{ padding: '0 12px' }}><Check size={12} /> Verified</div>
                                    )}
                                </div>
                                {otpSent && !otpVerified && <input className="input" style={{ marginTop: 8 }} value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP (demo: 1234)" maxLength={4} />}
                                {otpCooldown > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Resend in {otpCooldown}s</span>}
                            </div>
                            <div className="input-group">
                                <label className="input-label">Email (optional)</label>
                                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Username *</label>
                                <div style={{ position: 'relative' }}>
                                    <KeyRound size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input className="input" style={{ paddingLeft: 38 }} value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} placeholder="e.g. rahul_123" maxLength={20} />
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>4–20 chars, letters/numbers/underscores only</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label">Password *</label>
                                    <div style={{ position: 'relative' }}>
                                        <input className="input" style={{ paddingRight: 36 }} type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 chars" autoComplete="new-password" />
                                        <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                            {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Confirm Password *</label>
                                    <input className="input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password"
                                        style={{ border: confirmPassword && confirmPassword !== password ? '1.5px solid #EF4444' : undefined }} autoComplete="new-password" />
                                    {confirmPassword && confirmPassword !== password && <span style={{ fontSize: '0.7rem', color: '#EF4444' }}>Passwords don&apos;t match</span>}
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">City</label>
                                <select className="input" value={city} onChange={e => setCity(e.target.value)}>
                                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Address</label>
                                <input className="input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Your address" />
                            </div>
                            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading || !otpVerified} style={{ marginTop: 8 }}>
                                {loading ? <div className="spinner" /> : <>Create Account <ChevronRight size={16} /></>}
                            </button>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                                By signing up you agree to our <Link href="/legal" style={{ color: 'var(--brand-primary)' }}>Terms of Service</Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Provider Registration (multi-step) ─────────────────────────────────
    const provSteps = ['Basic Info', 'Skills & City', 'Documents', 'Portfolio', 'Review & Sign'];

    return (
        <div style={{ minHeight: '100vh', padding: '80px 24px 40px', position: 'relative' }}>
            <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.08), transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <button onClick={() => step === 0 ? setRole(null) : setStep(s => s - 1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 24, fontFamily: 'inherit', fontSize: '0.875rem' }}>
                    <ChevronLeft size={16} /> Back
                </button>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>Provider Registration</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.875rem' }}>Complete all steps to start receiving jobs</p>
                </div>

                {/* Step wizard */}
                <div className="step-wizard" style={{ marginBottom: 32 }}>
                    {provSteps.map((s, i) => (
                        <div key={i} className="step-item">
                            <div className={`step-circle${i === step ? ' active' : i < step ? ' done' : ''}`}>
                                {i < step ? <Check size={14} /> : i + 1}
                            </div>
                            {i < provSteps.length - 1 && <div className={`step-line${i < step ? ' done' : ''}`} />}
                        </div>
                    ))}
                </div>

                <div className="card" style={{ padding: 32 }}>
                    {/* STEP 0: Basic Info */}
                    {step === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Basic Information</h3>

                            {/* Profile Photo */}
                            <div className="input-group">
                                <label className="input-label">Profile Photo</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div
                                        style={{ width: 72, height: 72, borderRadius: '50%', border: '2px dashed var(--bg-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--bg-surface)', flexShrink: 0, cursor: 'pointer' }}
                                        onClick={() => profileRef.current?.click()}
                                    >
                                        {profilePhoto
                                            ? <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <User size={28} style={{ color: 'var(--text-muted)' }} />
                                        }
                                    </div>
                                    <div>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => profileRef.current?.click()}>
                                            <Upload size={14} /> {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                                        </button>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG — max 5MB</p>
                                    </div>
                                    <input ref={profileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfilePhoto} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Full Name *</label>
                                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Phone Number *</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input className="input" style={{ flex: 1 }} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" maxLength={10} />
                                    {!otpSent
                                        ? <button type="button" className="btn btn-secondary" onClick={sendOtp}>Send OTP</button>
                                        : !otpVerified
                                            ? <button type="button" className="btn btn-accent btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={verifyOtp}>Verify</button>
                                            : <div className="badge badge-success" style={{ padding: '0 12px' }}><Check size={12} /> OK</div>}
                                </div>
                                {otpSent && !otpVerified && <input className="input" style={{ marginTop: 8 }} value={otp} onChange={e => setOtp(e.target.value)} placeholder="OTP (demo: 1234)" />}
                                {otpCooldown > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Resend in {otpCooldown}s</span>}
                            </div>
                            <div className="input-group">
                                <label className="input-label">Email (optional)</label>
                                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                            </div>
                            <button className="btn btn-primary btn-full" disabled={!name || !otpVerified} onClick={() => setStep(1)}>
                                Continue <ChevronRight size={16} />
                            </button>
                        </div>
                    )}

                    {/* STEP 1: Skills & City */}
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Skill Categories & City</h3>
                            <div className="input-group">
                                <label className="input-label">Select Your Skills *</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                                    {SKILLS.map(s => (
                                        <button key={s} type="button" onClick={() => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                                            style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${skills.includes(s) ? '#F59E0B' : 'var(--bg-border)'}`, background: skills.includes(s) ? 'rgba(245,158,11,0.12)' : 'var(--bg-surface)', color: skills.includes(s) ? '#F59E0B' : 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">City *</label>
                                <select className="input" value={city} onChange={e => setCity(e.target.value)}>
                                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Address</label>
                                <input className="input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Your work area / address" />
                            </div>
                            <button className="btn btn-primary btn-full" disabled={skills.length === 0} onClick={() => setStep(2)}>
                                Continue <ChevronRight size={16} />
                            </button>
                        </div>
                    )}

                    {/* STEP 2: Documents */}
                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Verification Documents</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: -8 }}>All documents are encrypted and securely stored.</p>

                            {/* Aadhaar / Gov ID */}
                            <div className="input-group">
                                <label className="input-label">Aadhaar Number *</label>
                                <input className="input" value={aadhaar} onChange={e => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="12-digit Aadhaar number" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Government ID / Legal Document *</label>
                                <div
                                    style={{ border: `2px dashed ${govIdDoc ? 'var(--color-success)' : 'var(--bg-border)'}`, borderRadius: 12, padding: 20, textAlign: 'center', cursor: 'pointer', background: govIdDoc ? 'rgba(16,185,129,0.05)' : 'var(--bg-surface)', transition: 'all 0.2s' }}
                                    onClick={() => govIdRef.current?.click()}
                                >
                                    {govIdDoc
                                        ? <><Check size={20} style={{ color: 'var(--color-success)', margin: '0 auto 6px' }} /><div style={{ fontSize: '0.82rem', color: 'var(--color-success)', fontWeight: 600 }}>Document uploaded ✓</div></>
                                        : <><Upload size={20} style={{ color: 'var(--text-muted)', margin: '0 auto 6px' }} /><div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Click to upload ID (Aadhaar / PAN / Passport)</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>JPG, PNG, PDF — max 10MB</div></>
                                    }
                                </div>
                                <input ref={govIdRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleGovId} />
                            </div>

                            {/* Address Proof */}
                            <div className="input-group">
                                <label className="input-label">Address Proof *</label>
                                <div
                                    style={{ border: `2px dashed ${addressProofDoc ? 'var(--color-success)' : 'var(--bg-border)'}`, borderRadius: 12, padding: 20, textAlign: 'center', cursor: 'pointer', background: addressProofDoc ? 'rgba(16,185,129,0.05)' : 'var(--bg-surface)', transition: 'all 0.2s' }}
                                    onClick={() => addressProofRef.current?.click()}
                                >
                                    {addressProofDoc
                                        ? <><Check size={20} style={{ color: 'var(--color-success)', margin: '0 auto 6px' }} /><div style={{ fontSize: '0.82rem', color: 'var(--color-success)', fontWeight: 600 }}>Address proof uploaded ✓</div></>
                                        : <><Upload size={20} style={{ color: 'var(--text-muted)', margin: '0 auto 6px' }} /><div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Utility bill / Rent agreement / Voter ID</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>JPG, PNG, PDF — max 10MB</div></>
                                    }
                                </div>
                                <input ref={addressProofRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleAddressProof} />
                            </div>

                            {/* Bank & Police */}
                            {[
                                { label: 'Bank Account Number *', value: bank, set: setBank, ph: 'Account number', maxLen: 18 },
                                { label: 'IFSC Code *', value: ifsc, set: setIfsc, ph: 'e.g. SBIN0001234', maxLen: 11 },
                                { label: 'Police Verification Cert No. *', value: police, set: setPolice, ph: 'Certificate number', maxLen: 30 },
                            ].map(f => (
                                <div key={f.label} className="input-group">
                                    <label className="input-label">{f.label}</label>
                                    <input className="input" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} maxLength={f.maxLen} />
                                </div>
                            ))}

                            <button className="btn btn-primary btn-full" disabled={!aadhaar || !bank || !ifsc || !police || !govIdDoc || !addressProofDoc} onClick={() => setStep(3)}>
                                Continue <ChevronRight size={16} />
                            </button>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                Documents required to proceed. Upload both ID and address proof.
                            </p>
                        </div>
                    )}

                    {/* STEP 3: Work Portfolio */}
                    {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Work Portfolio</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                    Showcase your past work — builds customer trust and increases bookings!
                                </p>
                            </div>

                            {/* Work Photos */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <label className="input-label" style={{ marginBottom: 0 }}>Work Photos ({workPhotos.length}/8)</label>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => workPhotoRef.current?.click()} disabled={workPhotos.length >= 8}>
                                        <Image size={14} /> Add Photos
                                    </button>
                                </div>
                                <input ref={workPhotoRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleWorkPhotos} />
                                {workPhotos.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                        {workPhotos.map((p, i) => (
                                            <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                                                <img src={p} alt={`Work ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button
                                                    type="button"
                                                    onClick={() => setWorkPhotos(prev => prev.filter((_, idx) => idx !== i))}
                                                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 20, height: 20, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', lineHeight: 1 }}
                                                >✕</button>
                                            </div>
                                        ))}
                                        {workPhotos.length < 8 && (
                                            <div onClick={() => workPhotoRef.current?.click()} style={{ aspectRatio: '1', border: '2px dashed var(--bg-border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                <Upload size={18} />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div onClick={() => workPhotoRef.current?.click()} style={{ border: '2px dashed var(--bg-border)', borderRadius: 12, padding: 28, textAlign: 'center', cursor: 'pointer', background: 'var(--bg-surface)' }}>
                                        <Image size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Upload up to 8 photos of your work</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>JPG, PNG — max 5MB each</div>
                                    </div>
                                )}
                            </div>

                            {/* Work Videos */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <label className="input-label" style={{ marginBottom: 0 }}>Work Videos ({workVideos.length}/2) <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— max 30 seconds each</span></label>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => workVideoRef.current?.click()} disabled={workVideos.length >= 2}>
                                        <Video size={14} /> Add Video
                                    </button>
                                </div>
                                <input ref={workVideoRef} type="file" accept="video/*" multiple style={{ display: 'none' }} onChange={handleWorkVideos} />
                                {workVideos.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {workVideos.map((v, i) => (
                                            <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--bg-border)' }}>
                                                <video src={v} controls style={{ width: '100%', maxHeight: 180, display: 'block' }} />
                                                <button type="button" onClick={() => setWorkVideos(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div onClick={() => workVideoRef.current?.click()} style={{ border: '2px dashed var(--bg-border)', borderRadius: 12, padding: 28, textAlign: 'center', cursor: 'pointer', background: 'var(--bg-surface)' }}>
                                        <Video size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Upload up to 2 short work videos (max 30s)</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>MP4, MOV — max 50MB each</div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                                <button className="btn btn-primary btn-full" onClick={() => setStep(4)}>
                                    Continue <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Review & Sign */}
                    {step === 4 && (
                        <form onSubmit={handleProviderSignup} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Review & Submit</h3>

                            {[['Name', name], ['Phone', phone], ['City', city], ['Skills', skills.join(', ')],
                            ['Work Photos', `${workPhotos.length} uploaded`], ['Work Videos', `${workVideos.length} uploaded`]].map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '8px 0', borderBottom: '1px solid var(--bg-border)' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{v}</span>
                                </div>
                            ))}

                            {/* Liability Agreement */}
                            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 16 }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
                                    <Shield size={18} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', marginBottom: 8 }}>Provider Liability Agreement</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                            By registering as a provider on QAVRA, you acknowledge and agree that:
                                        </div>
                                        <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: '8px 0 0 16px' }}>
                                            <li>You are an <strong>independent contractor</strong>, not an employee of QAVRA.</li>
                                            <li>You are solely <strong>responsible for any service damage or misconduct</strong> during jobs.</li>
                                            <li>QAVRA is a <strong>marketplace platform only</strong> and is not liable for provider negligence.</li>
                                            <li>You must comply with all applicable laws and safety standards.</li>
                                            <li>Violation of these terms may result in immediate suspension or legal action.</li>
                                        </ul>
                                    </div>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={liabilityAccepted}
                                        onChange={e => setLiabilityAccepted(e.target.checked)}
                                        style={{ width: 18, height: 18, marginTop: 2, accentColor: '#EF4444', flexShrink: 0 }}
                                    />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.5 }}>
                                        I agree that I am responsible for any service damage or misconduct. I have read and accept the <Link href="/legal?tab=provider" style={{ color: '#EF4444' }}>Provider Agreement</Link> and <Link href="/legal?tab=terms" style={{ color: '#EF4444' }}>Terms & Conditions</Link>.
                                    </span>
                                </label>
                            </div>

                            {!liabilityAccepted && (
                                <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
                                    <AlertCircle size={16} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        You must accept the liability agreement before submitting your application.
                                    </p>
                                </div>
                            )}

                            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 14 }}>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    <strong style={{ color: 'var(--color-success)' }}>⏳ Pending Verification</strong> — An admin will review your documents within 24 hours. You will receive a notification once approved.
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setStep(3)}>Back</button>
                                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || !liabilityAccepted}>
                                    {loading ? <div className="spinner" /> : <><Check size={16} /> Submit Application</>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
