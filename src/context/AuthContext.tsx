'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { localStore, User, UserRole } from '@/lib/localStore';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
    loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (data: Omit<User, 'id' | 'createdAt' | 'verificationStatus'> & { password: string }) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Rate limiter — prevents spam account creation ────────────────────────────
// Stores timestamps of signup attempts per phone prefix (first 5 digits)
function checkSignupRateLimit(phone: string): { allowed: boolean; waitSeconds?: number } {
    if (typeof window === 'undefined') return { allowed: true };
    const KEY = 'qavra_signup_attempts';
    const WINDOW_MS = 10 * 60 * 1000; // 10 minute window
    const MAX_ATTEMPTS = 3;           // max 3 signup attempts per 10 min from same device

    try {
        const raw = localStorage.getItem(KEY);
        const attempts: number[] = raw ? JSON.parse(raw) : [];
        const now = Date.now();
        // Filter to only attempts within the window
        const recent = attempts.filter(t => now - t < WINDOW_MS);
        if (recent.length >= MAX_ATTEMPTS) {
            const oldest = Math.min(...recent);
            const waitSeconds = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
            return { allowed: false, waitSeconds };
        }
        // Record this attempt
        recent.push(now);
        localStorage.setItem(KEY, JSON.stringify(recent));
        return { allowed: true };
    } catch {
        return { allowed: true };
    }
}

// ─── Failed login rate limit — 5 attempts per 5 minutes per phone ─────────────
function checkLoginRateLimit(phone: string): { allowed: boolean; waitSeconds?: number } {
    if (typeof window === 'undefined') return { allowed: true };
    const KEY = `qavra_login_fail_${phone}`;
    const WINDOW_MS = 5 * 60 * 1000;
    const MAX_FAILS = 5;
    try {
        const raw = localStorage.getItem(KEY);
        const fails: number[] = raw ? JSON.parse(raw) : [];
        const now = Date.now();
        const recent = fails.filter(t => now - t < WINDOW_MS);
        if (recent.length >= MAX_FAILS) {
            const oldest = Math.min(...recent);
            const waitSeconds = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
            return { allowed: false, waitSeconds };
        }
        // Record this failed attempt (will be called only on failure)
        return { allowed: true };
    } catch {
        return { allowed: true };
    }
}

function recordLoginFailure(phone: string) {
    if (typeof window === 'undefined') return;
    const KEY = `qavra_login_fail_${phone}`;
    try {
        const raw = localStorage.getItem(KEY);
        const fails: number[] = raw ? JSON.parse(raw) : [];
        fails.push(Date.now());
        localStorage.setItem(KEY, JSON.stringify(fails));
    } catch { /* noop */ }
}

function clearLoginFailures(phone: string) {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`qavra_login_fail_${phone}`);
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

    const login = async (phone: string, _password: string): Promise<{ success: boolean; error?: string }> => {
        // Rate limit check
        const rateCheck = checkLoginRateLimit(phone);
        if (!rateCheck.allowed) {
            return { success: false, error: `Too many failed attempts. Try again in ${Math.ceil((rateCheck.waitSeconds || 60) / 60)} minute(s).` };
        }
        const found = localStore.users.getByPhone(phone);
        if (!found) {
            recordLoginFailure(phone);
            return { success: false, error: 'No account found with this phone number.' };
        }
        if (found.verificationStatus === 'blacklisted') {
            recordLoginFailure(phone);
            return { success: false, error: 'Account has been banned from the platform.' };
        }
        if (found.verificationStatus === 'suspended') {
            return { success: false, error: 'Account has been suspended. Contact support.' };
        }
        clearLoginFailures(phone);
        localStore.session.set(found);
        setUser(found);
        return { success: true };
    };

    const loginAdmin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        if (email === 'admin@qavra.com' && password === 'admin@123') {
            const admin = localStore.users.getByEmail('admin@qavra.com');
            if (admin) {
                localStore.session.set(admin);
                setUser(admin);
                return { success: true };
            }
        }
        return { success: false, error: 'Invalid admin credentials.' };
    };

    const signup = async (data: Omit<User, 'id' | 'createdAt' | 'verificationStatus'> & { password: string }): Promise<{ success: boolean; error?: string }> => {
        // Phone uniqueness check
        const existing = localStore.users.getByPhone(data.phone);
        if (existing) return { success: false, error: 'Phone number already registered. Please log in instead.' };

        // Email uniqueness check (if email provided)
        if (data.email) {
            const existingEmail = localStore.users.getByEmail(data.email);
            if (existingEmail) return { success: false, error: 'Email address already registered.' };
        }

        // Spam prevention — rate limit account creation per device
        const rateCheck = checkSignupRateLimit(data.phone);
        if (!rateCheck.allowed) {
            const mins = Math.ceil((rateCheck.waitSeconds || 60) / 60);
            return { success: false, error: `Too many accounts created recently. Please wait ${mins} minute(s) before trying again.` };
        }

        // Phone format validation
        if (!/^\d{10}$/.test(data.phone)) {
            return { success: false, error: 'Phone number must be exactly 10 digits.' };
        }

        const { password: _, ...userData } = data;
        const newUser = localStore.users.create({
            ...userData,
            verificationStatus: data.role === 'provider' ? 'pending' : 'verified',
        });

        // Auto-login for customers only; providers need admin approval first
        if (data.role !== 'provider') {
            localStore.session.set(newUser);
            setUser(newUser);
        } else {
            // For providers: log them in with pending status so they can see their dashboard
            localStore.session.set(newUser);
            setUser(newUser);
        }
        return { success: true };
    };

    const logout = () => {
        localStore.session.clear();
        setUser(null);
    };

    const updateUser = (data: Partial<User>) => {
        if (!user) return;
        localStore.users.update(user.id, data);
        const updated = { ...user, ...data };
        localStore.session.set(updated);
        setUser(updated);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, loginAdmin, signup, logout, updateUser }}>
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
