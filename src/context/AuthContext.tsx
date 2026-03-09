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
        const found = localStore.users.getByPhone(phone);
        if (!found) return { success: false, error: 'No account found with this phone number.' };
        if (found.verificationStatus === 'blacklisted') return { success: false, error: 'Account has been banned from the platform.' };
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
        const existing = localStore.users.getByPhone(data.phone);
        if (existing) return { success: false, error: 'Phone number already registered.' };
        const { password: _, ...userData } = data;
        const newUser = localStore.users.create({
            ...userData,
            verificationStatus: data.role === 'provider' ? 'pending' : 'verified',
        });
        if (data.role !== 'provider') {
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
