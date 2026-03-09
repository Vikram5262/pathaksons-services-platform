// LocalStorage abstraction layer — mirrors Firestore document structure
// Easily swappable to Firestore calls when ready

export type UserRole = 'customer' | 'provider' | 'admin';

export interface User {
    id: string;
    name: string;
    phone: string;
    email?: string;
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
    profilePhoto?: string;       // base64 data URL
    govIdDoc?: string;           // base64 data URL
    addressProofDoc?: string;    // base64 data URL
    workPhotos?: string[];       // up to 8 base64 URLs
    workVideos?: string[];       // up to 2 base64 URLs
    liabilityAccepted?: boolean;
    liabilityAcceptedAt?: string;
    complaintCount?: number;
    blacklisted?: boolean;
    // Location (simulated)
    latitude?: number;
    longitude?: number;
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
    otp?: string;
    beforePhoto?: string;
    afterPhoto?: string;
    createdAt: string;
    city: string;
    address: string;
    // Safety
    sharedWith?: string;   // contact phone/name for share feature
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

// Generic helpers
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

// ─── USERS ───────────────────────────────────────────────────────────────────
export const localStore = {
    users: {
        getAll: (): User[] => getAll<User>('qavra_users'),
        getById: (id: string): User | undefined => getAll<User>('qavra_users').find(u => u.id === id),
        getByPhone: (phone: string): User | undefined => getAll<User>('qavra_users').find(u => u.phone === phone),
        getByEmail: (email: string): User | undefined => getAll<User>('qavra_users').find(u => u.email === email),
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
            // Auto-flag provider if ≥3 complaints
            const providerComplaints = complaints.filter(c => c.providerId === data.providerId).length + 1;
            if (providerComplaints >= 3) {
                const providers = getAll<Provider>('qavra_providers');
                const updated = providers.map(p => p.id === data.providerId
                    ? { ...p, complaintCount: providerComplaints, blacklisted: true, overallStatus: 'suspended' as const }
                    : p
                );
                saveAll('qavra_providers', updated);
            } else {
                const providers = getAll<Provider>('qavra_providers');
                const updated = providers.map(p => p.id === data.providerId
                    ? { ...p, complaintCount: providerComplaints }
                    : p
                );
                saveAll('qavra_providers', updated);
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

    // ─── Auth session ──────────────────────────────────────────────────────────
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
        },
        clear: (): void => {
            if (typeof window === 'undefined') return;
            localStorage.removeItem('qavra_session');
        },
    },

    // ─── Seed demo data ────────────────────────────────────────────────────────
    seed: (): void => {
        if (typeof window === 'undefined') return;
        if (localStorage.getItem('qavra_seeded')) return;

        // Admin user
        const admin: User = {
            id: 'admin_001',
            name: 'QAVRA Admin',
            phone: '9999999999',
            email: 'admin@qavra.com',
            role: 'admin',
            verificationStatus: 'verified',
            city: 'Indore',
            createdAt: new Date().toISOString(),
        };

        // Sample customers
        const customers: User[] = [
            { id: 'cust_001', name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@example.com', role: 'customer', verificationStatus: 'verified', city: 'Indore', address: 'MG Road, Indore', createdAt: new Date().toISOString() },
            { id: 'cust_002', name: 'Priya Patel', phone: '9876543211', email: 'priya@example.com', role: 'customer', verificationStatus: 'verified', city: 'Bhopal', address: 'New Market, Bhopal', createdAt: new Date().toISOString() },
            { id: 'cust_003', name: 'Amit Verma', phone: '9876543212', role: 'customer', verificationStatus: 'verified', city: 'Indore', createdAt: new Date().toISOString() },
        ];

        // Sample provider users
        const providerUsers: User[] = [
            { id: 'puser_001', name: 'Suresh Electrician', phone: '9765432100', role: 'provider', verificationStatus: 'verified', city: 'Indore', createdAt: new Date().toISOString() },
            { id: 'puser_002', name: 'Ramesh Plumber', phone: '9765432101', role: 'provider', verificationStatus: 'verified', city: 'Indore', createdAt: new Date().toISOString() },
            { id: 'puser_003', name: 'Geeta Cook', phone: '9765432102', role: 'provider', verificationStatus: 'verified', city: 'Bhopal', createdAt: new Date().toISOString() },
            { id: 'puser_004', name: 'Mohan Driver', phone: '9765432103', role: 'provider', verificationStatus: 'pending', city: 'Indore', createdAt: new Date().toISOString() },
            { id: 'puser_005', name: 'Sita Caregiver', phone: '9765432104', role: 'provider', verificationStatus: 'verified', city: 'Jabalpur', createdAt: new Date().toISOString() },
        ];

        // Sample providers
        const providers: Provider[] = [
            { id: 'prov_001', userId: 'puser_001', name: 'Suresh Electrician', phone: '9765432100', skillCategories: ['Electrician'], aadhaarStatus: 'verified', selfieStatus: 'verified', bankStatus: 'verified', policeVerificationStatus: 'verified', overallStatus: 'approved', rating: 4.8, totalJobs: 142, earnings: 85200, city: 'Indore', bio: 'Certified electrician with 8 years of experience.', createdAt: new Date().toISOString(), isAvailable: true, liabilityAccepted: true, liabilityAcceptedAt: new Date().toISOString(), complaintCount: 0, latitude: 22.7196, longitude: 75.8577 },
            { id: 'prov_002', userId: 'puser_002', name: 'Ramesh Plumber', phone: '9765432101', skillCategories: ['Plumber'], aadhaarStatus: 'verified', selfieStatus: 'verified', bankStatus: 'verified', policeVerificationStatus: 'verified', overallStatus: 'approved', rating: 4.5, totalJobs: 98, earnings: 54000, city: 'Indore', bio: 'Expert plumber, all pipe and sanitary work.', createdAt: new Date().toISOString(), isAvailable: true, liabilityAccepted: true, liabilityAcceptedAt: new Date().toISOString(), complaintCount: 0, latitude: 22.7250, longitude: 75.8650 },
            { id: 'prov_003', userId: 'puser_003', name: 'Geeta Cook', phone: '9765432102', skillCategories: ['Cook'], aadhaarStatus: 'verified', selfieStatus: 'verified', bankStatus: 'verified', policeVerificationStatus: 'verified', overallStatus: 'approved', rating: 4.9, totalJobs: 210, earnings: 126000, city: 'Bhopal', bio: 'Home chef specializing in North & South Indian cuisine.', createdAt: new Date().toISOString(), isAvailable: true, liabilityAccepted: true, liabilityAcceptedAt: new Date().toISOString(), complaintCount: 0, latitude: 23.2599, longitude: 77.4126 },
            { id: 'prov_004', userId: 'puser_004', name: 'Mohan Driver', phone: '9765432103', skillCategories: ['Driver'], aadhaarStatus: 'pending', selfieStatus: 'pending', bankStatus: 'pending', policeVerificationStatus: 'pending', overallStatus: 'pending', rating: 0, totalJobs: 0, earnings: 0, city: 'Indore', createdAt: new Date().toISOString(), isAvailable: false, liabilityAccepted: false, complaintCount: 0 },
            { id: 'prov_005', userId: 'puser_005', name: 'Sita Caregiver', phone: '9765432104', skillCategories: ['Senior Care', 'Daily Helper'], aadhaarStatus: 'verified', selfieStatus: 'verified', bankStatus: 'verified', policeVerificationStatus: 'verified', overallStatus: 'approved', rating: 4.7, totalJobs: 65, earnings: 39000, city: 'Jabalpur', bio: 'Compassionate caregiver for elderly and differently-abled.', createdAt: new Date().toISOString(), isAvailable: true, liabilityAccepted: true, liabilityAcceptedAt: new Date().toISOString(), complaintCount: 0, latitude: 23.1815, longitude: 79.9864 },
        ];

        // Sample bookings
        const bookings: Booking[] = [
            { id: 'book_001', customerId: 'cust_001', customerName: 'Rahul Sharma', providerId: 'prov_001', providerName: 'Suresh Electrician', serviceType: 'Electrician', description: 'Wiring fix in bedroom – some switches not working.', timeSlot: '10:00 AM – 12:00 PM', scheduledDate: '2026-03-10', status: 'completed', paymentStatus: 'released', amount: 800, otp: '4821', createdAt: new Date().toISOString(), city: 'Indore', address: 'MG Road, Indore' },
            { id: 'book_002', customerId: 'cust_002', customerName: 'Priya Patel', providerId: 'prov_003', providerName: 'Geeta Cook', serviceType: 'Cook', description: 'Need cook for dinner party – 30 guests, North Indian menu.', timeSlot: '4:00 PM – 8:00 PM', scheduledDate: '2026-03-12', status: 'accepted', paymentStatus: 'held', amount: 2500, otp: '7634', createdAt: new Date().toISOString(), city: 'Bhopal', address: 'New Market, Bhopal' },
            { id: 'book_003', customerId: 'cust_003', customerName: 'Amit Verma', providerId: 'prov_002', providerName: 'Ramesh Plumber', serviceType: 'Plumber', description: 'Bathroom tap leaking badly.', timeSlot: '9:00 AM – 11:00 AM', scheduledDate: '2026-03-09', status: 'in_progress', paymentStatus: 'held', amount: 500, otp: '2901', createdAt: new Date().toISOString(), city: 'Indore', address: 'Vijay Nagar, Indore' },
            { id: 'book_004', customerId: 'cust_001', customerName: 'Rahul Sharma', serviceType: 'Driver', description: 'Airport pickup at 6 AM, car required.', timeSlot: '6:00 AM', scheduledDate: '2026-03-15', status: 'pending', paymentStatus: 'pending', amount: 600, createdAt: new Date().toISOString(), city: 'Indore', address: 'MG Road, Indore' },
        ];

        // Sample reviews
        const reviews: Review[] = [
            { id: 'rev_001', customerId: 'cust_001', customerName: 'Rahul Sharma', providerId: 'prov_001', bookingId: 'book_001', rating: 5, comment: 'Excellent work! Very professional and quick.', createdAt: new Date().toISOString() },
        ];

        // Sample payments
        const payments: Payment[] = [
            { id: 'pay_001', bookingId: 'book_001', customerId: 'cust_001', providerId: 'prov_001', amount: 800, platformFee: 80, providerPayout: 720, escrowStatus: 'released', payoutStatus: 'paid', paymentMethod: 'upi', transactionId: 'TXN' + Date.now(), createdAt: new Date().toISOString() },
            { id: 'pay_002', bookingId: 'book_002', customerId: 'cust_002', providerId: 'prov_003', amount: 2500, platformFee: 250, providerPayout: 2250, escrowStatus: 'held', payoutStatus: 'pending', paymentMethod: 'card', transactionId: 'TXN' + (Date.now() + 1), createdAt: new Date().toISOString() },
            { id: 'pay_003', bookingId: 'book_003', customerId: 'cust_003', providerId: 'prov_002', amount: 500, platformFee: 50, providerPayout: 450, escrowStatus: 'held', payoutStatus: 'pending', paymentMethod: 'wallet', transactionId: 'TXN' + (Date.now() + 2), createdAt: new Date().toISOString() },
        ];

        // Sample fraud logs
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
        localStorage.setItem('qavra_seeded', 'true');
    },
};
