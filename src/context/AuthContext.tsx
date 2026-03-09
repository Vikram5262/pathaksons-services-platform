'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { localStore, User, UserRole, hashPassword, verifyPassword } from '@/lib/localStore';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    // Legacy phone login (kept for compatibility)
    login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
    // New: username or email + password
    loginWithPassword: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
    // New: email OTP flow
    sendEmailOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
    verifyEmailOTP: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
    // Admin
    loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    // Signup
    signup: (data: Omit<User, 'id' | 'createdAt' | 'verificationStatus'> & { password: string }) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Rate limiters ────────────────────────────────────────────────────────────
function checkSignupRateLimit(): { allowed: boolean; waitSeconds?: number } {
    if (typeof window === 'undefined') return { allowed: true };
    const KEY = 'qavra_signup_attempts';
    const WINDOW_MS = 10 * 60 * 1000;
    const MAX_ATTEMPTS = 3;
    try {
        const raw = localStorage.getItem(KEY);
        const attempts: number[] = raw ? JSON.parse(raw) : [];
        const now = Date.now();
        const recent = attempts.filter(t => now - t < WINDOW_MS);
        if (recent.length >= MAX_ATTEMPTS) {
            const oldest = Math.min(...recent);
            return { allowed: false, waitSeconds: Math.ceil((WINDOW_MS - (now - oldest)) / 1000) };
        }
        recent.push(now);
        localStorage.setItem(KEY, JSON.stringify(recent));
        return { allowed: true };
    } catch { return { allowed: true }; }
}

function checkLoginRateLimit(key: string): { allowed: boolean; waitSeconds?: number } {
    if (typeof window === 'undefined') return { allowed: true };
    const KEY = `qavra_login_fail_${key}`;
    const WINDOW_MS = 5 * 60 * 1000;
    const MAX_FAILS = 5;
    try {
        const raw = localStorage.getItem(KEY);
        const fails: number[] = raw ? JSON.parse(raw) : [];
        const now = Date.now();
        const recent = fails.filter(t => now - t < WINDOW_MS);
        if (recent.length >= MAX_FAILS) {
            const oldest = Math.min(...recent);
            return { allowed: false, waitSeconds: Math.ceil((WINDOW_MS - (now - oldest)) / 1000) };
        }
        return { allowed: true };
    } catch { return { allowed: true }; }
}

function recordLoginFailure(key: string) {
    if (typeof window === 'undefined') return;
    const KEY = `qavra_login_fail_${key}`;
    try {
        const raw = localStorage.getItem(KEY);
        const fails: number[] = raw ? JSON.parse(raw) : [];
        fails.push(Date.now());
        localStorage.setItem(KEY, JSON.stringify(fails));
    } catch { /* noop */ }
}

function clearLoginFailures(key: string) {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`qavra_login_fail_${key}`);
}

function resolveRedirect(user: User): string {
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'provider') return '/provider/dashboard';
    return '/customer/dashboard';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        localStore.seed();
        const session = localStore.session.get();
        setUser(session);
        setLoading(false);
    }, []);

    // ─── Phone login (legacy) ──────────────────────────────────────────────────
    const login = async (phone: string, _password: string): Promise<{ success: boolean; error?: string }> => {
        const rateCheck = checkLoginRateLimit(phone);
        if (!rateCheck.allowed) return { success: false, error: `Too many attempts. Wait ${Math.ceil((rateCheck.waitSeconds || 60) / 60)} min.` };
        const found = localStore.users.getByPhone(phone);
        if (!found) { recordLoginFailure(phone); return { success: false, error: 'No account with this phone number.' }; }
        if (found.verificationStatus === 'blacklisted') return { success: false, error: 'Account banned from platform.' };
        if (found.verificationStatus === 'suspended') return { success: false, error: 'Account suspended. Contact support.' };
        clearLoginFailures(phone);
        localStore.session.set(found);
        setUser(found);
        return { success: true };
    };

    // ─── Username/email + password login ──────────────────────────────────────
    const loginWithPassword = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
        const rateKey = identifier.toLowerCase();
        const rateCheck = checkLoginRateLimit(rateKey);
        if (!rateCheck.allowed) return { success: false, error: `Too many failed attempts. Wait ${Math.ceil((rateCheck.waitSeconds || 60) / 60)} min.` };

        // Find by email or username
        const found = localStore.users.getByEmail(identifier) || localStore.users.getByUsername(identifier);
        if (!found) { recordLoginFailure(rateKey); return { success: false, error: 'No account found with this email or username.' }; }
        if (found.verificationStatus === 'blacklisted') return { success: false, error: 'Account banned from platform.' };
        if (found.verificationStatus === 'suspended') return { success: false, error: 'Account suspended. Contact support.' };

        // Verify password
        if (!found.passwordHash) { recordLoginFailure(rateKey); return { success: false, error: 'This account does not have a password set. Use phone login.' }; }
        if (!verifyPassword(password, found.passwordHash)) { recordLoginFailure(rateKey); return { success: false, error: 'Incorrect password.' }; }

        clearLoginFailures(rateKey);
        localStore.session.set(found);
        setUser(found);
        return { success: true };
    };

    // ─── Email OTP: send ───────────────────────────────────────────────────────
    const sendEmailOTP = async (email: string): Promise<{ success: boolean; error?: string }> => {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: 'Enter a valid email address.' };
        const rateKey = `otp_send_${email}`;
        const rateCheck = checkLoginRateLimit(rateKey);
        if (!rateCheck.allowed) return { success: false, error: `OTP already sent. Wait ${rateCheck.waitSeconds}s.` };

        const found = localStore.users.getByEmail(email);
        if (!found) return { success: false, error: 'No account found with this email.' };
        if (found.verificationStatus === 'blacklisted') return { success: false, error: 'Account banned.' };

        localStore.emailOTP.send(email);
        recordLoginFailure(rateKey); // throttle re-sends
        // In production: send real email via SendGrid/Resend
        return { success: true };
    };

    // ─── Email OTP: verify ─────────────────────────────────────────────────────
    const verifyEmailOTP = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
        const found = localStore.users.getByEmail(email);
        if (!found) return { success: false, error: 'No account found with this email.' };

        const valid = localStore.emailOTP.verify(email, code);
        if (!valid) return { success: false, error: 'Invalid or expired OTP. Try resending.' };

        localStore.session.set(found);
        setUser(found);
        return { success: true };
    };

    // ─── Admin login ───────────────────────────────────────────────────────────
    const loginAdmin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        const rateCheck = checkLoginRateLimit('admin_login');
        if (!rateCheck.allowed) return { success: false, error: `Admin locked. Wait ${Math.ceil((rateCheck.waitSeconds || 60) / 60)} min.` };

        const admin = localStore.users.getByEmail(email);
        if (!admin || admin.role !== 'admin') { recordLoginFailure('admin_login'); return { success: false, error: 'Invalid admin credentials.' }; }
        if (!admin.passwordHash || !verifyPassword(password, admin.passwordHash)) {
            // Fallback to hardcoded for demo
            if (email !== 'admin@qavra.com' || password !== 'admin@123') {
                recordLoginFailure('admin_login');
                return { success: false, error: 'Invalid admin credentials.' };
            }
        }
        clearLoginFailures('admin_login');
        localStore.session.set(admin);
        setUser(admin);
        return { success: true };
    };

    // ─── Signup ────────────────────────────────────────────────────────────────
    const signup = async (data: Omit<User, 'id' | 'createdAt' | 'verificationStatus'> & { password: string }): Promise<{ success: boolean; error?: string }> => {
        // Phone uniqueness
        if (localStore.users.getByPhone(data.phone)) return { success: false, error: 'Phone number already registered. Log in instead.' };
        // Email uniqueness
        if (data.email && localStore.users.getByEmail(data.email)) return { success: false, error: 'Email already registered.' };
        // Username uniqueness
        if (data.username && localStore.users.getByUsername(data.username)) return { success: false, error: 'Username already taken.' };
        // Rate limit
        const rateCheck = checkSignupRateLimit();
        if (!rateCheck.allowed) {
            const mins = Math.ceil((rateCheck.waitSeconds || 60) / 60);
            return { success: false, error: `Too many accounts created. Wait ${mins} min.` };
        }
        // Phone format
        if (!/^\d{10}$/.test(data.phone)) return { success: false, error: 'Phone must be exactly 10 digits.' };
        // Username format
        if (data.username && !/^[a-zA-Z0-9_]{4,20}$/.test(data.username)) return { success: false, error: 'Username: 4-20 chars, letters/numbers/underscores only.' };

        const { password, ...userData } = data;
        const newUser = localStore.users.create({
            ...userData,
            passwordHash: password ? hashPassword(password) : undefined,
            verificationStatus: data.role === 'provider' ? 'pending' : 'verified',
        });
        localStore.session.set(newUser);
        setUser(newUser);
        return { success: true };
    };

    const logout = () => { localStore.session.clear(); setUser(null); };

    const updateUser = (data: Partial<User>) => {
        if (!user) return;
        localStore.users.update(user.id, data);
        const updated = { ...user, ...data };
        localStore.session.set(updated);
        setUser(updated);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, loginWithPassword, sendEmailOTP, verifyEmailOTP, loginAdmin, signup, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

export function useRequireAuth(role?: UserRole) {
    const { user, loading } = useAuth();
    return { user, loading, authorized: !loading && !!user && (!role || user.role === role) };
}
