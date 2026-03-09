'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { localStore, Provider } from '@/lib/localStore';
import { Search, Check, X, UserX, RefreshCw, Eye, ZoomIn, Play, FileText, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const REJECTION_REASONS = [
    'Incorrect document',
    'Blurry image',
    'Expired document',
    'Fake or altered document',
    'Mismatch with profile',
    'Wrong ID type submitted',
    'Incomplete document',
    'Document cropped or cut off',
    'Low quality image',
    'Invalid proof of address',
];

interface DocModalProps {
    provider: Provider;
    onClose: () => void;
    onAction: (id: string, status: Provider['overallStatus'], reason?: string) => void;
}

function DocModal({ provider, onClose, onAction }: DocModalProps) {
    const [tab, setTab] = useState<'photos' | 'videos' | 'docs'>('docs');
    const [zoomUrl, setZoomUrl] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState('');

    const docs = [
        { label: 'Profile Photo', url: provider.profilePhoto, type: 'image' },
        { label: 'Government ID', url: provider.govIdDoc, type: 'image' },
        { label: 'Address Proof', url: provider.addressProofDoc, type: 'image' },
    ].filter(d => d.url);

    const workPhotos = provider.workPhotos || [];
    const workVideos = provider.workVideos || [];

    const handleReject = () => {
        if (!reason) { toast.error('Select a rejection reason first'); return; }
        onAction(provider.id, 'rejected', reason);
        onClose();
    };

    return (
        <>
            {/* Overlay */}
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, backdropFilter: 'blur(4px)' }} />

            {/* Zoom overlay */}
            {zoomUrl && (
                <div onClick={() => setZoomUrl(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1010, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
                    <img src={zoomUrl} alt="Zoomed" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, objectFit: 'contain', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }} />
                    <div style={{ position: 'absolute', top: 20, right: 24, color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</div>
                </div>
            )}

            {/* Modal */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 1005, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none',
            }}>
                <div style={{
                    background: 'var(--bg-card)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 700,
                    maxHeight: '90vh', overflowY: 'auto', pointerEvents: 'all', boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
                    border: '1px solid var(--bg-border)',
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {provider.profilePhoto ? (
                                <img src={provider.profilePhoto} alt={provider.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg-border)' }} />
                            ) : (
                                <div className="avatar avatar-md">{provider.name.charAt(0)}</div>
                            )}
                            <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{provider.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{provider.phone} · {provider.city}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className={`badge ${provider.overallStatus === 'approved' ? 'badge-success' : provider.overallStatus === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                                {provider.overallStatus}
                            </div>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
                        </div>
                    </div>

                    {/* Rejection reason display if already rejected */}
                    {provider.overallStatus === 'rejected' && provider.rejectionReason && (
                        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 16, fontSize: '0.82rem', color: '#EF4444' }}>
                            ⚠️ Rejection reason: <strong>{provider.rejectionReason}</strong>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="tab-bar" style={{ marginBottom: 20 }}>
                        <button className={`tab-btn${tab === 'docs' ? ' active' : ''}`} onClick={() => setTab('docs')}>
                            <FileText size={12} style={{ display: 'inline', marginRight: 4 }} />
                            Documents ({docs.length})
                        </button>
                        <button className={`tab-btn${tab === 'photos' ? ' active' : ''}`} onClick={() => setTab('photos')}>
                            Work Photos ({workPhotos.length})
                        </button>
                        <button className={`tab-btn${tab === 'videos' ? ' active' : ''}`} onClick={() => setTab('videos')}>
                            <Play size={12} style={{ display: 'inline', marginRight: 4 }} />
                            Videos ({workVideos.length})
                        </button>
                    </div>

                    {/* Documents Tab */}
                    {tab === 'docs' && (
                        <div>
                            {docs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No documents uploaded yet</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                                    {docs.map((doc, i) => (
                                        <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--bg-border)', position: 'relative' }}>
                                            <div style={{ padding: '6px 10px', background: 'var(--bg-surface)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--bg-border)' }}>
                                                {doc.label}
                                            </div>
                                            {doc.url?.startsWith('data:image') || doc.url?.startsWith('http') ? (
                                                <div style={{ position: 'relative' }}>
                                                    <img src={doc.url!} alt={doc.label} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                                                    <button onClick={() => setZoomUrl(doc.url!)} style={{
                                                        position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none',
                                                        borderRadius: 8, color: '#fff', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem',
                                                    }}>
                                                        <ZoomIn size={12} /> Zoom
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-surface)' }}>
                                                    📄 PDF Document
                                                    <a href={doc.url!} download style={{ marginLeft: 8, color: 'var(--brand-primary)', fontSize: '0.7rem' }}>Download</a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Work Photos Tab */}
                    {tab === 'photos' && (
                        <div>
                            {workPhotos.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No work photos uploaded</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                                    {workPhotos.map((url, i) => (
                                        <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', cursor: 'zoom-in' }} onClick={() => setZoomUrl(url)}>
                                            <img src={url} alt={`Work ${i + 1}`} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                                            <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.5)', borderRadius: 5, padding: '2px 6px', fontSize: '0.65rem', color: '#fff' }}>#{i + 1}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Videos Tab */}
                    {tab === 'videos' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {workVideos.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No videos uploaded</div>
                            ) : (
                                workVideos.map((url, i) => (
                                    <div key={i}>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>Video {i + 1}</div>
                                        <video src={url} controls style={{ width: '100%', borderRadius: 10, maxHeight: 280, background: '#000' }} />
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--bg-border)' }}>
                        {provider.overallStatus === 'pending' && (
                            <div>
                                {!rejecting ? (
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button className="btn btn-success btn-full" onClick={() => { onAction(provider.id, 'approved'); onClose(); }}>
                                            <Check size={14} /> Approve Provider
                                        </button>
                                        <button className="btn btn-danger" style={{ minWidth: 120 }} onClick={() => setRejecting(true)}>
                                            <X size={14} /> Reject
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="input-group" style={{ marginBottom: 12 }}>
                                            <label className="input-label">Select Rejection Reason *</label>
                                            <div style={{ position: 'relative' }}>
                                                <select className="input" value={reason} onChange={e => setReason(e.target.value)} style={{ paddingRight: 36, appearance: 'none' }}>
                                                    <option value="">— Choose a reason —</option>
                                                    {REJECTION_REASONS.map((r, i) => (
                                                        <option key={i} value={r}>{i + 1}. {r}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button className="btn btn-secondary" onClick={() => setRejecting(false)}>Cancel</button>
                                            <button className="btn btn-danger btn-full" onClick={handleReject} disabled={!reason}>
                                                Confirm Rejection
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {provider.overallStatus === 'approved' && (
                            <button className="btn btn-danger btn-full" onClick={() => { onAction(provider.id, 'suspended'); onClose(); }}>
                                <UserX size={14} /> Suspend Provider
                            </button>
                        )}
                        {(provider.overallStatus === 'suspended' || provider.overallStatus === 'rejected') && (
                            <button className="btn btn-success btn-full" onClick={() => { onAction(provider.id, 'approved'); onClose(); }}>
                                <RefreshCw size={14} /> Restore & Approve
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default function AdminProvidersPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [providers, setProviders] = useState<Provider[]>([]);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState<Provider | null>(null);

    const reload = () => setProviders(localStore.providers.getAll());
    useEffect(() => { if (!loading && (!user || user.role !== 'admin')) router.push('/login'); }, [user, loading, router]);
    useEffect(() => { if (user) reload(); }, [user]);

    const filtered = providers.filter(p => {
        const qOk = !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.phone.includes(query);
        const fOk = filter === 'all' || p.overallStatus === filter;
        return qOk && fOk;
    });

    const action = (id: string, status: Provider['overallStatus'], rejectionReason?: string) => {
        localStore.providers.update(id, { overallStatus: status, ...(rejectionReason ? { rejectionReason } : {}) });
        const provider = localStore.providers.getById(id);
        if (provider) localStore.users.update(provider.userId, {
            verificationStatus: status === 'approved' ? 'verified' : status === 'rejected' ? 'suspended' : status as 'pending' | 'verified' | 'suspended' | 'blacklisted',
        });
        reload();
        toast.success(`Provider ${status}${rejectionReason ? ` — Reason: ${rejectionReason}` : ''}`);
    };

    const statusBadge = (s: string) => ({ approved: 'badge-success', pending: 'badge-warning', rejected: 'badge-danger', suspended: 'badge-danger' }[s] || 'badge-muted');
    const docStatus = (s: string) => s === 'verified' ? '✅' : s === 'pending' ? '⏳' : '❌';
    const hasUploads = (p: Provider) => !!(p.profilePhoto || p.govIdDoc || p.addressProofDoc || (p.workPhotos?.length) || (p.workVideos?.length));

    const pendingCount = providers.filter(p => p.overallStatus === 'pending').length;

    if (loading || !user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner spinner-lg" /></div>;

    return (
        <div className="layout-with-sidebar">
            <Sidebar role="admin" />
            <main className="main-content">
                <div className="content-area">
                    <div style={{ marginBottom: 24 }}>
                        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Provider Verification</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                            {pendingCount > 0 ? (
                                <><span style={{ color: '#F59E0B', fontWeight: 600 }}>{pendingCount} providers</span> awaiting document review</>
                            ) : 'All providers reviewed'}
                        </p>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
                        {[
                            { label: 'Pending', value: providers.filter(p => p.overallStatus === 'pending').length, color: '#F59E0B', click: 'pending' },
                            { label: 'Approved', value: providers.filter(p => p.overallStatus === 'approved').length, color: '#10B981', click: 'approved' },
                            { label: 'Rejected', value: providers.filter(p => p.overallStatus === 'rejected').length, color: '#EF4444', click: 'rejected' },
                            { label: 'Suspended', value: providers.filter(p => p.overallStatus === 'suspended').length, color: '#8B5CF6', click: 'suspended' },
                        ].map(s => (
                            <div key={s.label} className="card" style={{ padding: 16, cursor: 'pointer', border: filter === s.click ? `2px solid ${s.color}` : undefined }} onClick={() => setFilter(f => f === s.click ? 'all' : s.click)}>
                                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                        <div className="search-bar" style={{ flex: 1 }}>
                            <Search size={16} style={{ color: 'var(--text-muted)' }} />
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search provider name or phone..." />
                        </div>
                        <select className="input" style={{ width: 170 }} value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>

                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Provider</th>
                                    <th>Skills</th>
                                    <th>City</th>
                                    <th>Documents</th>
                                    <th>Status</th>
                                    <th>Rating</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {p.profilePhoto ? (
                                                    <img src={p.profilePhoto} alt={p.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg-border)', flexShrink: 0 }} />
                                                ) : (
                                                    <div className="avatar avatar-sm">{p.name.charAt(0)}</div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{p.name}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.78rem' }}>{p.skillCategories.join(', ')}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{p.city}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <div title="Aadhaar | Selfie | Bank | Police" style={{ display: 'flex', gap: 2, fontSize: '0.85rem' }}>
                                                    <span title="Aadhaar">{docStatus(p.aadhaarStatus)}</span>
                                                    <span title="Selfie">{docStatus(p.selfieStatus)}</span>
                                                    <span title="Bank">{docStatus(p.bankStatus)}</span>
                                                    <span title="Police">{docStatus(p.policeVerificationStatus)}</span>
                                                </div>
                                                {hasUploads(p) && (
                                                    <span style={{ fontSize: '0.65rem', color: '#10B981' }}>📎 {[p.profilePhoto, p.govIdDoc, p.addressProofDoc].filter(Boolean).length} docs, {p.workPhotos?.length || 0} photos, {p.workVideos?.length || 0} videos</span>
                                                )}
                                                {p.rejectionReason && (
                                                    <span style={{ fontSize: '0.65rem', color: '#EF4444', maxWidth: 160 }} title={p.rejectionReason}>⚠️ {p.rejectionReason.slice(0, 22)}...</span>
                                                )}
                                            </div>
                                        </td>
                                        <td><div className={`badge ${statusBadge(p.overallStatus)}`}>{p.overallStatus}</div></td>
                                        <td style={{ fontSize: '0.85rem' }}>{p.rating ? `${p.rating}★` : '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {/* View Docs button — always shown */}
                                                <button className="btn btn-sm btn-secondary" onClick={() => setSelected(p)} title="View uploaded documents and media">
                                                    <Eye size={12} /> Review
                                                </button>
                                                {/* Quick approve for pending without docs */}
                                                {p.overallStatus === 'pending' && (
                                                    <button className="btn btn-sm btn-success" onClick={() => action(p.id, 'approved')}>
                                                        <Check size={12} />
                                                    </button>
                                                )}
                                                {p.overallStatus === 'approved' && (
                                                    <button className="btn btn-sm btn-danger" onClick={() => action(p.id, 'suspended')}>
                                                        <UserX size={12} />
                                                    </button>
                                                )}
                                                {(p.overallStatus === 'suspended' || p.overallStatus === 'rejected') && (
                                                    <button className="btn btn-sm btn-success" onClick={() => action(p.id, 'approved')}>
                                                        <RefreshCw size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No providers found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Document Review Modal */}
            {selected && (
                <DocModal
                    provider={selected}
                    onClose={() => setSelected(null)}
                    onAction={(id, status, reason) => {
                        action(id, status, reason);
                        setSelected(null);
                    }}
                />
            )}
        </div>
    );
}
