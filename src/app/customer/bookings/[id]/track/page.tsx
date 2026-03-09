'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { localStore, Booking, Provider } from '@/lib/localStore';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Link from 'next/link';
import { ArrowLeft, MapPin, Navigation, Clock, Phone, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PROVIDER_DEFAULT_LAT = 22.7196;
const PROVIDER_DEFAULT_LON = 75.8577;

export default function TrackProviderPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [provider, setProvider] = useState<Provider | null>(null);
    const [customerLat, setCustomerLat] = useState<number | null>(null);
    const [customerLon, setCustomerLon] = useState<number | null>(null);
    const [providerLat, setProviderLat] = useState(PROVIDER_DEFAULT_LAT);
    const [providerLon, setProviderLon] = useState(PROVIDER_DEFAULT_LON);
    const [distance, setDistance] = useState<number | null>(null);
    const [eta, setEta] = useState<string>('');
    const [geoError, setGeoError] = useState('');

    useEffect(() => {
        const b = localStore.bookings.getById(id);
        setBooking(b || null);
        if (b?.providerId) {
            const p = localStore.providers.getById(b.providerId);
            if (p) {
                setProvider(p);
                setProviderLat(p.latitude || PROVIDER_DEFAULT_LAT);
                setProviderLon(p.longitude || PROVIDER_DEFAULT_LON);
            }
        }
    }, [id]);

    // Get customer geolocation
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => { setCustomerLat(pos.coords.latitude); setCustomerLon(pos.coords.longitude); },
                () => { setGeoError('Location access denied. Showing approximate distance.'); setCustomerLat(22.7300); setCustomerLon(75.8700); }
            );
        } else {
            setGeoError('Geolocation not supported. Showing approximate distance.');
            setCustomerLat(22.7300);
            setCustomerLon(75.8700);
        }
    }, []);

    // Simulate provider moving closer every 8 seconds
    useEffect(() => {
        if (customerLat === null || customerLon === null || booking?.status === 'completed') return;
        const interval = setInterval(() => {
            setProviderLat(prev => {
                const target = customerLat || PROVIDER_DEFAULT_LAT;
                return prev + (target - prev) * 0.08;
            });
            setProviderLon(prev => {
                const target = customerLon || PROVIDER_DEFAULT_LON;
                return prev + (target - prev) * 0.08;
            });
        }, 8000);
        return () => clearInterval(interval);
    }, [customerLat, customerLon, booking?.status]);

    // Update distance & ETA
    useEffect(() => {
        if (customerLat === null || customerLon === null) return;
        const d = haversineKm(providerLat, providerLon, customerLat, customerLon);
        setDistance(d);
        const mins = Math.max(1, Math.round(d * 3.5)); // ~17km/h avg urban speed
        if (mins >= 60) { setEta(`${Math.floor(mins / 60)}h ${mins % 60}m`); }
        else { setEta(`${mins} min`); }
    }, [providerLat, providerLon, customerLat, customerLon]);

    const openInMaps = () => {
        if (customerLat === null) { toast.error('Location not available'); return; }
        const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${providerLat},${providerLon};${customerLat},${customerLon}`;
        window.open(url, '_blank');
    };

    if (!booking) return (
        <div className="layout-with-sidebar"><Sidebar role="customer" />
            <main className="main-content"><div className="content-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner spinner-lg" /></div></main>
        </div>
    );

    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${providerLon - 0.03},${providerLat - 0.03},${providerLon + 0.03},${providerLat + 0.03}&layer=mapnik&marker=${providerLat},${providerLon}`;

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="customer" />
            <main className="main-content">
                <div className="content-area">
                    <Link href={`/customer/bookings/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24, textDecoration: 'none' }}>
                        <ArrowLeft size={14} /> Back to Booking
                    </Link>

                    <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                        Live Provider Tracking
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
                        Booking #{booking.id.slice(-6).toUpperCase()} — {booking.serviceType}
                    </p>

                    {geoError && (
                        <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, marginBottom: 16 }}>
                            <AlertCircle size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{geoError}</span>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
                        {/* Map */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ position: 'relative' }}>
                                <iframe
                                    src={mapUrl}
                                    style={{ width: '100%', height: 420, border: 'none', display: 'block' }}
                                    title="Provider Location Map"
                                    allowFullScreen
                                />
                                {/* Live indicator */}
                                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.75)', borderRadius: 20, padding: '5px 12px' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s infinite' }} />
                                    <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>LIVE</span>
                                </div>
                            </div>
                            <div style={{ padding: 16, display: 'flex', gap: 12 }}>
                                <button className="btn btn-primary btn-full" onClick={openInMaps} style={{ gap: 8 }}>
                                    <Navigation size={16} /> Open Route in Maps
                                </button>
                            </div>
                        </div>

                        {/* Info panel */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Provider card */}
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <div className="avatar avatar-lg">{booking.providerName?.charAt(0) || '?'}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{booking.providerName || 'Provider'}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{booking.serviceType}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button
                                        className="btn btn-secondary btn-full btn-sm"
                                        onClick={() => toast.success(`Calling ${booking.providerName || 'provider'}...`)}
                                        style={{ gap: 6 }}
                                    >
                                        <Phone size={14} /> Call
                                    </button>
                                </div>
                            </div>

                            {/* Distance & ETA */}
                            <div className="card">
                                <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Arrival Info</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <MapPin size={18} style={{ color: '#F59E0B' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Distance</div>
                                            <div style={{ fontWeight: 700, fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                                                {distance !== null ? `${distance.toFixed(1)} km` : '—'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Clock size={18} style={{ color: '#06B6D4' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Estimated Arrival</div>
                                            <div style={{ fontWeight: 700, fontSize: '1.3rem', color: 'var(--text-primary)' }}>{eta || '—'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking reference */}
                            <div className="card">
                                <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 12 }}>Job Details</h4>
                                {[['Date', booking.scheduledDate], ['Time', booking.timeSlot], ['Address', booking.address]].map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bg-border)', fontSize: '0.8rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                                        <span style={{ fontWeight: 500, color: 'var(--text-primary)', maxWidth: '60%', textAlign: 'right' }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                @media (max-width: 768px) {
                    [style*="grid-template-columns: 1fr 300px"] { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}
