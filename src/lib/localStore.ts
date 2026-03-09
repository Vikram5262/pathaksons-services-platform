// LocalStorage abstraction layer — mirrors Firestore document structure
// Easily swappable to Firestore calls when ready

export type UserRole = 'customer' | 'provider' | 'admin';

export interface User {
    id: string;
    name: string;
    phone: string;
    email?: string;
    username?: string;       // NEW: for username+password login
    passwordHash?: string;   // NEW: btoa(password + salt)
    role: UserRole;
    verificationStatus: 'pending' | 'verified' | 'suspended' | 'blacklisted';
    city?: string;
    address?: string;
    createdAt: string;
    avatar?: string;
}

export interface Provider {
    id: string;
    userId: string;
    name: string;
    phone: string;
    email?: string;
    skillCategories: string[];
    aadhaarStatus: 'pending' | 'verified' | 'rejected';
    selfieStatus: 'pending' | 'verified' | 'rejected';
    bankStatus: 'pending' | 'verified' | 'rejected';
    policeVerificationStatus: 'pending' | 'verified' | 'rejected';
    overallStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
    rating: number;
    totalJobs: number;
    earnings: number;
    city: string;
    address?: string;
    bio?: string;
    createdAt: string;
    isAvailable: boolean;
    // Enhanced signup fields
    profilePhoto?: string;
    govIdDoc?: string;
    addressProofDoc?: string;
    workPhotos?: string[];
    workVideos?: string[];
    liabilityAccepted?: boolean;
    liabilityAcceptedAt?: string;
    complaintCount?: number;
    blacklisted?: boolean;
    // Location
    latitude?: number;
    longitude?: number;
    // AI Matching
    avgResponseTimeMin?: number;  // average response time in minutes
    // Rejection
    rejectionReason?: string;     // set by admin when rejecting
}

export interface Booking {
    id: string;
    customerId: string;
    customerName: string;
    providerId?: string;
    providerName?: string;
    serviceType: string;
    description: string;
    images?: string[];
    timeSlot: string;
    scheduledDate: string;
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
    paymentStatus: 'pending' | 'held' | 'released' | 'refunded';
    amount: number;
    dynamicMultiplier?: number;  // surge pricing multiplier used
    otp?: string;
    beforePhoto?: string;
    afterPhoto?: string;
    createdAt: string;
    city: string;
    address: string;
    sharedWith?: string;
    reportFiled?: boolean;
}

export interface Payment {
    id: string;
    bookingId: string;
    customerId: string;
    providerId?: string;
    amount: number;
    platformFee: number;
    providerPayout: number;
    escrowStatus: 'held' | 'released' | 'refunded';
    payoutStatus: 'pending' | 'paid';
    paymentMethod: 'upi' | 'card' | 'wallet';
    transactionId: string;
    createdAt: string;
}

export interface Review {
    id: string;
    customerId: string;
    customerName: string;
    providerId: string;
    bookingId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface FraudLog {
    id: string;
    userId: string;
    userName: string;
    fraudType: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    actionTaken: 'flagged' | 'suspended' | 'blacklisted' | 'cleared';
    createdAt: string;
}

export interface Complaint {
    id: string;
    bookingId: string;
    customerId: string;
    customerName: string;
    providerId: string;
    providerName: string;
    reason: string;
    description: string;
    status: 'open' | 'reviewed' | 'resolved';
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    bookingId: string;
    senderId: string;
    senderName: string;
    senderRole: 'customer' | 'provider';
    message: string;
    createdAt: string;
}

// AI Matching result type
export interface AIMatchResult {
    provider: Provider;
    score: number;         // lower = better
    distanceKm: number;
    etaMinutes: number;
    matchLabel: string;
}

// Dynamic pricing result
export interface PricingResult {
    basePrice: number;
    finalPrice: number;
    multiplier: number;
    isSurge: boolean;
    surgeLabel: string;
}

// ─── Generic helpers ──────────────────────────────────────────────────────────
function getAll<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(key) || '[]') as T[];
    } catch {
        return [];
    }
}

function saveAll<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ─── Password hashing (simple, suitable for localStorage demo) ────────────────
export function hashPassword(password: string): string {
    return btoa(password + '_qavra_2026');
}

export function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash;
}

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Base prices per service category ─────────────────────────────────────────
const BASE_PRICES: Record<string, number> = {
    'Electrician': 800,
    'Plumber': 500,
    'Cook': 2500,
    'Driver': 600,
    'Daily Helper': 400,
    'Security Guard': 700,
    'Senior Care': 900,
    'Grocery Runner': 300,
    'Local Freelancer': 450,
};

export const DEFAULT_BASE_PRICE = 400;

// ─── LOCALSTORE ───────────────────────────────────────────────────────────────
export const localStore = {
    users: {
        getAll: (): User[] => getAll<User>('qavra_users'),
        getById: (id: string): User | undefined => getAll<User>('qavra_users').find(u => u.id === id),
        getByPhone: (phone: string): User | undefined => getAll<User>('qavra_users').find(u => u.phone === phone),
        getByEmail: (email: string): User | undefined => getAll<User>('qavra_users').find(u => u.email === email),
        getByUsername: (username: string): User | undefined => getAll<User>('qavra_users').find(u => u.username === username),
        create: (data: Omit<User, 'id' | 'createdAt'>): User => {
            const users = getAll<User>('qavra_users');
            const user: User = { ...data, id: generateId(), createdAt: new Date().toISOString() };
            saveAll('qavra_users', [...users, user]);
            return user;
        },
        update: (id: string, data: Partial<User>): void => {
            const users = getAll<User>('qavra_users').map(u => u.id === id ? { ...u, ...data } : u);
            saveAll('qavra_users', users);
        },
        delete: (id: string): void => {
            saveAll('qavra_users', getAll<User>('qavra_users').filter(u => u.id !== id));
        },
    },

    providers: {
        getAll: (): Provider[] => getAll<Provider>('qavra_providers'),
        getById: (id: string): Provider | undefined => getAll<Provider>('qavra_providers').find(p => p.id === id),
        getByUserId: (uid: string): Provider | undefined => getAll<Provider>('qavra_providers').find(p => p.userId === uid),
        create: (data: Omit<Provider, 'id' | 'createdAt'>): Provider => {
            const providers = getAll<Provider>('qavra_providers');
            const provider: Provider = { ...data, id: generateId(), createdAt: new Date().toISOString() };
            saveAll('qavra_providers', [...providers, provider]);
            return provider;
        },
        update: (id: string, data: Partial<Provider>): void => {
            const providers = getAll<Provider>('qavra_providers').map(p => p.id === id ? { ...p, ...data } : p);
            saveAll('qavra_providers', providers);
        },
    },

    bookings: {
        getAll: (): Booking[] => getAll<Booking>('qavra_bookings'),
        getById: (id: string): Booking | undefined => getAll<Booking>('qavra_bookings').find(b => b.id === id),
        getByCustomer: (cid: string): Booking[] => getAll<Booking>('qavra_bookings').filter(b => b.customerId === cid),
        getByProvider: (pid: string): Booking[] => getAll<Booking>('qavra_bookings').filter(b => b.providerId === pid),
        create: (data: Omit<Booking, 'id' | 'createdAt'>): Booking => {
            const bookings = getAll<Booking>('qavra_bookings');
            const booking: Booking = { ...data, id: generateId(), createdAt: new Date().toISOString() };
            saveAll('qavra_bookings', [...bookings, booking]);
            return booking;
        },
        update: (id: string, data: Partial<Booking>): void => {
            const bookings = getAll<Booking>('qavra_bookings').map(b => b.id === id ? { ...b, ...data } : b);
            saveAll('qavra_bookings', bookings);
        },
    },

    payments: {
        getAll: (): Payment[] => getAll<Payment>('qavra_payments'),
        getByBooking: (bid: string): Payment | undefined => getAll<Payment>('qavra_payments').find(p => p.bookingId === bid),
        create: (data: Omit<Payment, 'id' | 'createdAt'>): Payment => {
            const payments = getAll<Payment>('qavra_payments');
            const payment: Payment = { ...data, id: generateId(), createdAt: new Date().toISOString() };
            saveAll('qavra_payments', [...payments, payment]);
            return payment;
        },
        update: (id: string, data: Partial<Payment>): void => {
            const payments = getAll<Payment>('qavra_payments').map(p => p.id === id ? { ...p, ...data } : p);
            saveAll('qavra_payments', payments);
        },
    },

    reviews: {
        getAll: (): Review[] => getAll<Review>('qavra_reviews'),
        getByProvider: (pid: string): Review[] => getAll<Review>('qavra_reviews').filter(r => r.providerId === pid),
        getByBooking: (bid: string): Review | undefined => getAll<Review>('qavra_reviews').find(r => r.bookingId === bid),
        create: (data: Omit<Review, 'id' | 'createdAt'>): Review => {
            const reviews = getAll<Review>('qavra_reviews');
            const review: Review = { ...data, id: generateId(), createdAt: new Date().toISOString() };
            saveAll('qavra_reviews', [...reviews, review]);
            return review;
        },
    },

    fraudLogs: {
        getAll: (): FraudLog[] => getAll<FraudLog>('qavra_fraud_logs'),
        create: (data: Omit<FraudLog, 'id' | 'createdAt'>): FraudLog => {
            const logs = getAll<FraudLog>('qavra_fraud_logs');
            const log: FraudLog = { ...data, id: generateId(), createdAt: new Date().toISOString() };
            saveAll('qavra_fraud_logs', [...logs, log]);
            return log;
        },
        update: (id: string, data: Partial<FraudLog>): void => {
            const logs = getAll<FraudLog>('qavra_fraud_logs').map(l => l.id === id ? { ...l, ...data } : l);
            saveAll('qavra_fraud_logs', logs);
        },
    },

    complaints: {
        getAll: (): Complaint[] => getAll<Complaint>('qavra_complaints'),
        getByProvider: (pid: string): Complaint[] => getAll<Complaint>('qavra_complaints').filter(c => c.providerId === pid),
        create: (data: Omit<Complaint, 'id' | 'createdAt'>): Complaint => {
            const complaints = getAll<Complaint>('qavra_complaints');
            const complaint: Complaint = { ...data, id: generateId(), createdAt: new Date().toISOString() };
            saveAll('qavra_complaints', [...complaints, complaint]);
            const providerComplaints = complaints.filter(c => c.providerId === data.providerId).length + 1;
            if (providerComplaints >= 3) {
                const providers = getAll<Provider>('qavra_providers');
                saveAll('qavra_providers', providers.map(p => p.id === data.providerId
                    ? { ...p, complaintCount: providerComplaints, blacklisted: true, overallStatus: 'suspended' as const }
                    : p
                ));
            } else {
                const providers = getAll<Provider>('qavra_providers');
                saveAll('qavra_providers', providers.map(p => p.id === data.providerId
                    ? { ...p, complaintCount: providerComplaints }
                    : p
                ));
            }
            return complaint;
        },
        update: (id: string, data: Partial<Complaint>): void => {
            const complaints = getAll<Complaint>('qavra_complaints').map(c => c.id === id ? { ...c, ...data } : c);
            saveAll('qavra_complaints', complaints);
        },
    },

    chat: {
        getByBooking: (bid: string): ChatMessage[] => getAll<ChatMessage>('qavra_chat').filter(m => m.bookingId === bid),
        send: (data: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage => {
            const msgs = getAll<ChatMessage>('qavra_chat');
            const msg: ChatMessage = { ...data, id: generateId(), createdAt: new Date().toISOString() };
            saveAll('qavra_chat', [...msgs, msg]);
            return msg;
        },
    },

    // ─── Email OTP store ────────────────────────────────────────────────────────
    emailOTP: {
        send: (email: string): string => {
            if (typeof window === 'undefined') return '';
            const otp = '1234'; // Demo OTP — replace with real email API in production
            const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
            localStorage.setItem(`qavra_otp_${email}`, JSON.stringify({ otp, expiry }));
            return otp;
        },
        verify: (email: string, code: string): boolean => {
            if (typeof window === 'undefined') return false;
            try {
                const raw = localStorage.getItem(`qavra_otp_${email}`);
                if (!raw) return false;
                const { otp, expiry } = JSON.parse(raw);
                if (Date.now() > expiry) { localStorage.removeItem(`qavra_otp_${email}`); return false; }
                if (otp === code) { localStorage.removeItem(`qavra_otp_${email}`); return true; }
                return false;
            } catch { return false; }
        },
    },

    // ─── Auth session ───────────────────────────────────────────────────────────
    session: {
        get: (): User | null => {
            if (typeof window === 'undefined') return null;
            try {
                const raw = localStorage.getItem('qavra_session');
                return raw ? JSON.parse(raw) : null;
            } catch { return null; }
        },
        set: (user: User): void => {
            if (typeof window === 'undefined') return;
            localStorage.setItem('qavra_session', JSON.stringify(user));
            // Also set cookie for Next.js middleware (can't read localStorage)
            const encoded = encodeURIComponent(JSON.stringify({ id: user.id, role: user.role, name: user.name }));
            document.cookie = `qavra_session=${encoded}; path=/; max-age=86400; SameSite=Strict`;
        },
        clear: (): void => {
            if (typeof window === 'undefined') return;
            localStorage.removeItem('qavra_session');
            // Clear cookie
            document.cookie = 'qavra_session=; path=/; max-age=0';
        },
    },

    // ─── AI Provider Matching ───────────────────────────────────────────────────
    // Score = (distance_norm × 0.4) + (rating_inverse × 0.4) + (response_time_norm × 0.2)
    // Lower score = better match
    aiMatchProviders: (
        serviceCategory: string,
        customerLat?: number,
        customerLng?: number
    ): AIMatchResult[] => {
        const providers = getAll<Provider>('qavra_providers').filter(
            p => p.overallStatus === 'approved' && p.isAvailable && p.skillCategories.includes(serviceCategory)
        );
        if (providers.length === 0) return [];

        // Default customer location (Indore city center) if geolocation unavailable
        const cLat = customerLat ?? 22.7196;
        const cLng = customerLng ?? 75.8577;

        const withScores = providers.map(p => {
            const pLat = p.latitude ?? (22.7 + Math.random() * 0.1);
            const pLng = p.longitude ?? (75.8 + Math.random() * 0.1);
            const distanceKm = haversineKm(cLat, cLng, pLat, pLng);
            const etaMinutes = Math.round((distanceKm / 17) * 60); // 17km/h urban speed
            const responseTime = p.avgResponseTimeMin ?? Math.round(5 + Math.random() * 20); // 5-25 min

            // Normalize scores (0-1 range using fixed max values)
            const maxDist = 20;
            const distNorm = Math.min(distanceKm / maxDist, 1);
            const ratingInverse = (5 - Math.min(p.rating, 5)) / 5; // higher rating = lower inverse
            const responseNorm = Math.min(responseTime / 60, 1);

            const score = (distNorm * 0.4) + (ratingInverse * 0.4) + (responseNorm * 0.2);

            const matchLabel = score < 0.2 ? '🏆 Best Match' : score < 0.4 ? '⭐ Great Match' : '✅ Good Match';

            return { provider: p, score, distanceKm: Math.round(distanceKm * 10) / 10, etaMinutes, matchLabel };
        });

        return withScores.sort((a, b) => a.score - b.score);
    },

    // ─── Dynamic Pricing ────────────────────────────────────────────────────────
    // Demand ratio = active bookings for category / approved available providers for category
    getDynamicPrice: (serviceCategory: string): PricingResult => {
        const basePrice = BASE_PRICES[serviceCategory] ?? DEFAULT_BASE_PRICE;

        const allBookings = getAll<Booking>('qavra_bookings');
        const activeBookings = allBookings.filter(
            b => b.serviceType === serviceCategory && ['pending', 'accepted', 'in_progress'].includes(b.status)
        ).length;

        const availableProviders = getAll<Provider>('qavra_providers').filter(
            p => p.overallStatus === 'approved' && p.isAvailable && p.skillCategories.includes(serviceCategory)
        ).length;

        const demandRatio = availableProviders > 0 ? activeBookings / availableProviders : 0;

        let multiplier = 1.0;
        let surgeLabel = '';
        if (demandRatio >= 2.0) {
            multiplier = 1.5;
            surgeLabel = '🔥 High Demand · 1.5×';
        } else if (demandRatio >= 1.0) {
            multiplier = 1.2;
            surgeLabel = '⚡ Busy · 1.2×';
        }

        const finalPrice = Math.round(basePrice * multiplier);
        return { basePrice, finalPrice, multiplier, isSurge: multiplier > 1.0, surgeLabel };
    },

    // ─── Fraud Detection ────────────────────────────────────────────────────────
    checkFraudSignals: (userId: string): void => {
        if (typeof window === 'undefined') return;
        const bookings = getAll<Booking>('qavra_bookings');
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const recentBookings = bookings.filter(b => b.customerId === userId && b.createdAt > oneHourAgo).length;
        if (recentBookings > 10) {
            const user = getAll<User>('qavra_users').find(u => u.id === userId);
            if (!user) return;
            const logs = getAll<FraudLog>('qavra_fraud_logs');
            const alreadyFlagged = logs.some(l => l.userId === userId && l.fraudType === 'Excessive Bookings' && l.actionTaken === 'flagged');
            if (!alreadyFlagged) {
                const log: FraudLog = {
                    id: generateId(), userId, userName: user.name,
                    fraudType: 'Excessive Bookings', severity: 'high',
                    description: `User made ${recentBookings} bookings in the last hour.`,
                    actionTaken: 'flagged', createdAt: new Date().toISOString(),
                };
                saveAll('qavra_fraud_logs', [...logs, log]);
            }
        }
    },

    // ─── Seed demo data ─────────────────────────────────────────────────────────
    seed: (): void => {
        if (typeof window === 'undefined') return;
        if (localStorage.getItem('qavra_seeded_v2')) return;

        const admin: User = {
            id: 'admin_001', name: 'QAVRA Admin', phone: '9999999999',
            email: 'admin@qavra.com', username: 'admin', passwordHash: hashPassword('admin@123'),
            role: 'admin', verificationStatus: 'verified', city: 'Indore', createdAt: new Date().toISOString(),
        };

        const customers: User[] = [
            {
                id: 'cust_001', name: 'Rahul Sharma', phone: '9876543210',
                email: 'rahul@example.com', username: 'rahul123', passwordHash: hashPassword('test123'),
                role: 'customer', verificationStatus: 'verified', city: 'Indore', address: 'MG Road, Indore', createdAt: new Date().toISOString(),
            },
            {
                id: 'cust_002', name: 'Priya Patel', phone: '9876543211',
                email: 'priya@example.com', username: 'priya_p', passwordHash: hashPassword('test123'),
                role: 'customer', verificationStatus: 'verified', city: 'Bhopal', address: 'New Market, Bhopal', createdAt: new Date().toISOString(),
            },
            {
                id: 'cust_003', name: 'Amit Verma', phone: '9876543212',
                username: 'amit_v', passwordHash: hashPassword('test123'),
                role: 'customer', verificationStatus: 'verified', city: 'Indore', createdAt: new Date().toISOString(),
            },
        ];

        const providerUsers: User[] = [
            { id: 'puser_001', name: 'Suresh Electrician', phone: '9765432100', username: 'suresh_e', passwordHash: hashPassword('prov123'), role: 'provider', verificationStatus: 'verified', city: 'Indore', createdAt: new Date().toISOString() },
            { id: 'puser_002', name: 'Ramesh Plumber', phone: '9765432101', username: 'ramesh_p', passwordHash: hashPassword('prov123'), role: 'provider', verificationStatus: 'verified', city: 'Indore', createdAt: new Date().toISOString() },
            { id: 'puser_003', name: 'Geeta Cook', phone: '9765432102', username: 'geeta_c', passwordHash: hashPassword('prov123'), role: 'provider', verificationStatus: 'verified', city: 'Bhopal', createdAt: new Date().toISOString() },
            { id: 'puser_004', name: 'Mohan Driver', phone: '9765432103', username: 'mohan_d', passwordHash: hashPassword('prov123'), role: 'provider', verificationStatus: 'pending', city: 'Indore', createdAt: new Date().toISOString() },
            { id: 'puser_005', name: 'Sita Caregiver', phone: '9765432104', username: 'sita_care', passwordHash: hashPassword('prov123'), role: 'provider', verificationStatus: 'verified', city: 'Jabalpur', createdAt: new Date().toISOString() },
        ];

        const providers: Provider[] = [
            { id: 'prov_001', userId: 'puser_001', name: 'Suresh Electrician', phone: '9765432100', skillCategories: ['Electrician'], aadhaarStatus: 'verified', selfieStatus: 'verified', bankStatus: 'verified', policeVerificationStatus: 'verified', overallStatus: 'approved', rating: 4.8, totalJobs: 142, earnings: 85200, city: 'Indore', bio: 'Certified electrician with 8 years of experience.', createdAt: new Date().toISOString(), isAvailable: true, liabilityAccepted: true, liabilityAcceptedAt: new Date().toISOString(), complaintCount: 0, latitude: 22.7196, longitude: 75.8577, avgResponseTimeMin: 8 },
            { id: 'prov_002', userId: 'puser_002', name: 'Ramesh Plumber', phone: '9765432101', skillCategories: ['Plumber'], aadhaarStatus: 'verified', selfieStatus: 'verified', bankStatus: 'verified', policeVerificationStatus: 'verified', overallStatus: 'approved', rating: 4.5, totalJobs: 98, earnings: 54000, city: 'Indore', bio: 'Expert plumber, all pipe and sanitary work.', createdAt: new Date().toISOString(), isAvailable: true, liabilityAccepted: true, liabilityAcceptedAt: new Date().toISOString(), complaintCount: 0, latitude: 22.7250, longitude: 75.8650, avgResponseTimeMin: 15 },
            { id: 'prov_003', userId: 'puser_003', name: 'Geeta Cook', phone: '9765432102', skillCategories: ['Cook'], aadhaarStatus: 'verified', selfieStatus: 'verified', bankStatus: 'verified', policeVerificationStatus: 'verified', overallStatus: 'approved', rating: 4.9, totalJobs: 210, earnings: 126000, city: 'Bhopal', bio: 'Home chef specializing in North & South Indian cuisine.', createdAt: new Date().toISOString(), isAvailable: true, liabilityAccepted: true, liabilityAcceptedAt: new Date().toISOString(), complaintCount: 0, latitude: 23.2599, longitude: 77.4126, avgResponseTimeMin: 10 },
            { id: 'prov_004', userId: 'puser_004', name: 'Mohan Driver', phone: '9765432103', skillCategories: ['Driver'], aadhaarStatus: 'pending', selfieStatus: 'pending', bankStatus: 'pending', policeVerificationStatus: 'pending', overallStatus: 'pending', rating: 0, totalJobs: 0, earnings: 0, city: 'Indore', createdAt: new Date().toISOString(), isAvailable: false, liabilityAccepted: false, complaintCount: 0 },
            { id: 'prov_005', userId: 'puser_005', name: 'Sita Caregiver', phone: '9765432104', skillCategories: ['Senior Care', 'Daily Helper'], aadhaarStatus: 'verified', selfieStatus: 'verified', bankStatus: 'verified', policeVerificationStatus: 'verified', overallStatus: 'approved', rating: 4.7, totalJobs: 65, earnings: 39000, city: 'Jabalpur', bio: 'Compassionate caregiver for elderly and differently-abled.', createdAt: new Date().toISOString(), isAvailable: true, liabilityAccepted: true, liabilityAcceptedAt: new Date().toISOString(), complaintCount: 0, latitude: 23.1815, longitude: 79.9864, avgResponseTimeMin: 12 },
        ];

        const bookings: Booking[] = [
            { id: 'book_001', customerId: 'cust_001', customerName: 'Rahul Sharma', providerId: 'prov_001', providerName: 'Suresh Electrician', serviceType: 'Electrician', description: 'Wiring fix in bedroom – some switches not working.', timeSlot: '10:00 AM – 12:00 PM', scheduledDate: '2026-03-10', status: 'completed', paymentStatus: 'released', amount: 800, otp: '4821', createdAt: new Date().toISOString(), city: 'Indore', address: 'MG Road, Indore' },
            { id: 'book_002', customerId: 'cust_002', customerName: 'Priya Patel', providerId: 'prov_003', providerName: 'Geeta Cook', serviceType: 'Cook', description: 'Need cook for dinner party – 30 guests, North Indian menu.', timeSlot: '4:00 PM – 8:00 PM', scheduledDate: '2026-03-12', status: 'accepted', paymentStatus: 'held', amount: 2500, otp: '7634', createdAt: new Date().toISOString(), city: 'Bhopal', address: 'New Market, Bhopal' },
            { id: 'book_003', customerId: 'cust_003', customerName: 'Amit Verma', providerId: 'prov_002', providerName: 'Ramesh Plumber', serviceType: 'Plumber', description: 'Bathroom tap leaking badly.', timeSlot: '9:00 AM – 11:00 AM', scheduledDate: '2026-03-09', status: 'in_progress', paymentStatus: 'held', amount: 500, otp: '2901', createdAt: new Date().toISOString(), city: 'Indore', address: 'Vijay Nagar, Indore' },
            { id: 'book_004', customerId: 'cust_001', customerName: 'Rahul Sharma', serviceType: 'Driver', description: 'Airport pickup at 6 AM, car required.', timeSlot: '6:00 AM', scheduledDate: '2026-03-15', status: 'pending', paymentStatus: 'pending', amount: 600, createdAt: new Date().toISOString(), city: 'Indore', address: 'MG Road, Indore' },
        ];

        const reviews: Review[] = [
            { id: 'rev_001', customerId: 'cust_001', customerName: 'Rahul Sharma', providerId: 'prov_001', bookingId: 'book_001', rating: 5, comment: 'Excellent work! Very professional and quick.', createdAt: new Date().toISOString() },
        ];

        const payments: Payment[] = [
            { id: 'pay_001', bookingId: 'book_001', customerId: 'cust_001', providerId: 'prov_001', amount: 800, platformFee: 80, providerPayout: 720, escrowStatus: 'released', payoutStatus: 'paid', paymentMethod: 'upi', transactionId: 'TXN' + Date.now(), createdAt: new Date().toISOString() },
            { id: 'pay_002', bookingId: 'book_002', customerId: 'cust_002', providerId: 'prov_003', amount: 2500, platformFee: 250, providerPayout: 2250, escrowStatus: 'held', payoutStatus: 'pending', paymentMethod: 'card', transactionId: 'TXN' + (Date.now() + 1), createdAt: new Date().toISOString() },
            { id: 'pay_003', bookingId: 'book_003', customerId: 'cust_003', providerId: 'prov_002', amount: 500, platformFee: 50, providerPayout: 450, escrowStatus: 'held', payoutStatus: 'pending', paymentMethod: 'wallet', transactionId: 'TXN' + (Date.now() + 2), createdAt: new Date().toISOString() },
        ];

        const fraudLogs: FraudLog[] = [
            { id: 'fraud_001', userId: 'cust_003', userName: 'Amit Verma', fraudType: 'Repeated Cancellations', severity: 'medium', description: 'User cancelled 4 bookings in 7 days without valid reason.', actionTaken: 'flagged', createdAt: new Date().toISOString() },
            { id: 'fraud_002', userId: 'puser_004', userName: 'Mohan Driver', fraudType: 'Suspicious Account Pattern', severity: 'low', description: 'Multiple accounts linked to same device fingerprint.', actionTaken: 'flagged', createdAt: new Date().toISOString() },
        ];

        saveAll('qavra_users', [admin, ...customers, ...providerUsers]);
        saveAll('qavra_providers', providers);
        saveAll('qavra_bookings', bookings);
        saveAll('qavra_payments', payments);
        saveAll('qavra_reviews', reviews);
        saveAll('qavra_fraud_logs', fraudLogs);
        saveAll('qavra_complaints', []);
        saveAll('qavra_chat', []);
        localStorage.setItem('qavra_seeded_v2', 'true');
    },
};
