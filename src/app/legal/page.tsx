'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PublicHeader from '@/components/layout/PublicHeader';
import Link from 'next/link';
import { Shield, FileText, Lock, AlertTriangle } from 'lucide-react';

const TABS = [
    { id: 'terms', label: 'Terms & Conditions', icon: <FileText size={15} /> },
    { id: 'provider', label: 'Provider Agreement', icon: <Shield size={15} /> },
    { id: 'privacy', label: 'Privacy Policy', icon: <Lock size={15} /> },
    { id: 'liability', label: 'Liability Disclaimer', icon: <AlertTriangle size={15} /> },
];

function LegalContent() {
    const params = useSearchParams();
    const [activeTab, setActiveTab] = useState(params.get('tab') || 'terms');

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 60px' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h1 className="font-display" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, color: 'var(--text-primary)' }}>Legal & Policies</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Please read these terms carefully before using the QAVRA platform.</p>
            </div>

            {/* Tab navigation */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap', borderBottom: '2px solid var(--bg-border)', paddingBottom: 0 }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem',
                        background: 'none', borderBottom: `2px solid ${activeTab === t.id ? 'var(--brand-primary)' : 'transparent'}`,
                        color: activeTab === t.id ? 'var(--brand-primary)' : 'var(--text-muted)', marginBottom: -2, transition: 'all 0.15s',
                    }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Terms & Conditions */}
            {activeTab === 'terms' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    <Section title="1. Introduction">
                        <p>Welcome to QAVRA ("Platform"), a marketplace that connects customers with independent service providers across India. By accessing or using our platform, you agree to be bound by these Terms & Conditions.</p>
                    </Section>
                    <Section title="2. Platform Role">
                        <p>QAVRA is a <strong>technology marketplace platform only</strong>. We facilitate connections between customers and independent service professionals. QAVRA does not employ service providers and is not responsible for the quality, safety, or legality of the services offered.</p>
                    </Section>
                    <Section title="3. User Eligibility">
                        <ul>
                            <li>You must be at least 18 years old to use this platform.</li>
                            <li>Providing false information during registration is grounds for immediate termination.</li>
                            <li>One account per individual — multiple accounts are prohibited.</li>
                        </ul>
                    </Section>
                    <Section title="4. Booking & Payment">
                        <ul>
                            <li>Payments are held in escrow until the customer confirms job completion.</li>
                            <li>QAVRA charges a 10% platform fee on all transactions.</li>
                            <li>Refunds are processed within 5–7 business days for cancelled bookings.</li>
                            <li>Customers must confirm job completion using the in-app OTP system.</li>
                        </ul>
                    </Section>
                    <Section title="5. Conduct">
                        <ul>
                            <li>Users must treat all parties with respect. Harassment or abuse leads to account suspension.</li>
                            <li>Fake bookings or fraudulent reviews are prohibited.</li>
                            <li>Any misuse of the platform may result in legal action.</li>
                        </ul>
                    </Section>
                    <Section title="6. Cancellations">
                        <ul>
                            <li>Customers may cancel up to 2 hours before scheduled service for a full refund.</li>
                            <li>Repeated cancellations (4+ in 30 days) may trigger account review.</li>
                        </ul>
                    </Section>
                    <Section title="7. Intellectual Property">
                        <p>All content on this platform, including logos, UI, and text, is the property of QAVRA Technologies Pvt. Ltd. Unauthorized use or reproduction is strictly prohibited.</p>
                    </Section>
                    <Section title="8. Governing Law">
                        <p>These Terms are governed by the laws of India. Any disputes shall be resolved in the courts of Indore, Madhya Pradesh, India.</p>
                    </Section>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--bg-border)', paddingTop: 16 }}>
                        Last updated: March 9, 2026
                    </div>
                </div>
            )}

            {/* Provider Agreement */}
            {activeTab === 'provider' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 18 }}>
                        <p style={{ fontWeight: 700, color: '#EF4444', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={16} /> Important Legal Notice</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>By registering as a provider, you confirm that you have read, understood, and accepted this agreement. This is a legally binding document.</p>
                    </div>
                    <Section title="1. Independent Contractor Status">
                        <p>Service providers on QAVRA are <strong>independent contractors</strong>, not employees, agents, or partners of QAVRA Technologies Pvt. Ltd. QAVRA does not control how you perform your services, your work schedule, or your methods.</p>
                    </Section>
                    <Section title="2. Provider Responsibilities">
                        <ul>
                            <li>You are solely responsible for the quality and safety of services you provide.</li>
                            <li>You must hold all required licenses, permits, and qualifications for your trade.</li>
                            <li>You are responsible for your own tools, equipment, and materials.</li>
                            <li>You must comply with all applicable laws, regulations, and safety standards.</li>
                        </ul>
                    </Section>
                    <Section title="3. Liability for Damage">
                        <p style={{ fontWeight: 600, color: '#EF4444', marginBottom: 8 }}>CRITICAL CLAUSE — Read Carefully:</p>
                        <ul>
                            <li>You are <strong>fully liable for any damage, loss, or harm</strong> caused during or as a result of services you provide.</li>
                            <li>QAVRA shall not be held responsible for provider negligence, errors, accidents, or misconduct.</li>
                            <li>Customers may file complaints and seek compensation directly from you.</li>
                            <li>QAVRA may assist in dispute resolution but bears no financial liability.</li>
                        </ul>
                    </Section>
                    <Section title="4. Document Verification">
                        <ul>
                            <li>All submitted documents must be authentic. Fraudulent documents lead to permanent ban and legal action.</li>
                            <li>Admin approval is required before you can accept bookings.</li>
                            <li>Re-verification may be required annually or on reasonable suspicion.</li>
                        </ul>
                    </Section>
                    <Section title="5. Earnings & Fees">
                        <ul>
                            <li>QAVRA retains a 10% commission from each completed job.</li>
                            <li>Payouts are released within 24 hours after customer confirmation.</li>
                            <li>QAVRA reserves the right to withhold payments during dispute investigations.</li>
                        </ul>
                    </Section>
                    <Section title="6. Complaint & Suspension Policy">
                        <ul>
                            <li>Providers who receive 3 or more validated complaints will be automatically suspended.</li>
                            <li>Suspended accounts require admin review before reinstatement.</li>
                            <li>Providers found guilty of fraud, assault, or serious misconduct will be permanently banned.</li>
                        </ul>
                    </Section>
                    <Section title="7. Termination">
                        <p>QAVRA reserves the right to suspend or terminate any provider account at its sole discretion for violations of this agreement, platform policies, or the law.</p>
                    </Section>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--bg-border)', paddingTop: 16 }}>
                        By completing provider registration, you electronically sign and agree to this agreement. Last updated: March 9, 2026
                    </div>
                </div>
            )}

            {/* Privacy Policy */}
            {activeTab === 'privacy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    <Section title="1. Data We Collect">
                        <ul>
                            <li><strong>Account data:</strong> Name, phone number, email address, city.</li>
                            <li><strong>Provider documents:</strong> Government ID, address proof, bank details (encrypted).</li>
                            <li><strong>Booking data:</strong> Service requests, locations, transaction history.</li>
                            <li><strong>Usage data:</strong> App interactions, device info, IP address.</li>
                        </ul>
                    </Section>
                    <Section title="2. How We Use Your Data">
                        <ul>
                            <li>To connect customers with suitable service providers.</li>
                            <li>To verify provider identity and qualifications.</li>
                            <li>To process payments and maintain transaction records.</li>
                            <li>To improve platform safety and user experience.</li>
                            <li>To send important notifications about bookings.</li>
                        </ul>
                    </Section>
                    <Section title="3. Data Sharing">
                        <ul>
                            <li>We share minimal data between customers and providers as needed to facilitate bookings.</li>
                            <li>We do not sell your personal data to third parties.</li>
                            <li>We may share data with law enforcement when legally required.</li>
                        </ul>
                    </Section>
                    <Section title="4. Data Security">
                        <p>We implement industry-standard security measures to protect your data. Provider documents are encrypted. We use HTTPS for all data transmission.</p>
                    </Section>
                    <Section title="5. Your Rights">
                        <ul>
                            <li>Right to access your personal data.</li>
                            <li>Right to request data correction or deletion.</li>
                            <li>Right to withdraw consent (subject to legal obligations).</li>
                            <li>Contact us at privacy@qavra.com for data requests.</li>
                        </ul>
                    </Section>
                    <Section title="6. Cookies & Tracking">
                        <p>We use essential cookies for platform functionality. No advertising or tracking cookies are used. You can control cookie settings through your browser.</p>
                    </Section>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--bg-border)', paddingTop: 16 }}>
                        Last updated: March 9, 2026 · Contact: privacy@qavra.com
                    </div>
                </div>
            )}

            {/* Liability Disclaimer */}
            {activeTab === 'liability' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    <div style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: 18 }}>
                        <p style={{ fontWeight: 700, color: '#D97706', marginBottom: 6 }}>⚠️ Important Disclaimer</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>This disclaimer limits QAVRA&apos;s legal liability. Please read carefully before using our platform.</p>
                    </div>
                    <Section title="1. Platform as Marketplace Only">
                        <p>QAVRA Technologies Pvt. Ltd. operates exclusively as a <strong>technology marketplace platform</strong>. We connect customers with independent service professionals. We do not employ service providers and are not a party to any service agreement between customers and providers.</p>
                    </Section>
                    <Section title="2. No Liability for Provider Services">
                        <ul>
                            <li>QAVRA is <strong>not responsible</strong> for the quality, safety, or outcome of any service performed by a provider.</li>
                            <li>QAVRA is not liable for property damage, personal injury, financial loss, or any other harm caused by a provider.</li>
                            <li>Providers are independent contractors and solely responsible for their services.</li>
                        </ul>
                    </Section>
                    <Section title="3. Customer Due Diligence">
                        <ul>
                            <li>While QAVRA verifies provider documents, this does not guarantee service quality or safety.</li>
                            <li>Customers are advised to take reasonable precautions when inviting service providers to their premises.</li>
                            <li>Use the in-app safety features (SOS, share booking, chat) to enhance personal safety.</li>
                        </ul>
                    </Section>
                    <Section title="4. Limitation of Liability">
                        <p>To the maximum extent permitted by law, QAVRA&apos;s total liability to any customer or provider shall not exceed the platform fees collected from the specific booking in dispute. QAVRA shall not be liable for indirect, incidental, or consequential damages.</p>
                    </Section>
                    <Section title="5. Indemnification">
                        <p>Users agree to indemnify and hold harmless QAVRA Technologies Pvt. Ltd., its directors, employees, and agents from any claims, losses, or damages arising from their use of the platform or their interactions with other users.</p>
                    </Section>
                    <Section title="6. Dispute Resolution">
                        <p>In the event of a dispute between a customer and provider, QAVRA will provide records and facilitate communication but will not act as arbitrator. Legal disputes must be resolved between the parties themselves through appropriate legal channels.</p>
                    </Section>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--bg-border)', paddingTop: 16 }}>
                        This disclaimer is governed by Indian law. Last updated: March 9, 2026
                    </div>
                </div>
            )}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{title}</h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                {children}
            </div>
            <style>{`
                ul { padding-left: 20px; margin: 0; }
                ul li { margin-bottom: 6px; }
                p { margin: 0; }
            `}</style>
        </div>
    );
}

export default function LegalPage() {
    return (
        <>
            <PublicHeader />
            <div style={{ paddingTop: 72 }}>
                <Suspense fallback={<div className="spinner spinner-lg" style={{ margin: '60px auto' }} />}>
                    <LegalContent />
                </Suspense>
            </div>
        </>
    );
}
