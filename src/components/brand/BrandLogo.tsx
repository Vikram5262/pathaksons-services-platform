// Shared brand identity for "Services by Pathak & Sons"
// Use this component everywhere the logo appears.

interface BrandLogoProps {
    /** 'full' = icon + two-line text (default, for navbar/sidebar)
     *  'compact' = icon + single-line name (for tight spots)
     *  'icon' = icon only (for small tiles / favicon replica)
     */
    variant?: 'full' | 'compact' | 'icon';
    /** Override icon size in px. Defaults vary per variant. */
    size?: number;
}

/** Deep blue + gold shield-wrench inline SVG icon */
export function BrandIcon({ size = 36 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{ flexShrink: 0, display: 'block' }}
        >
            {/* Shield background */}
            <path
                d="M20 3L5 9v10c0 9.4 6.4 18.2 15 20.5C29.6 37.2 35 28.4 35 19V9L20 3z"
                fill="#1E3A8A"
            />
            {/* Lighter shield inner */}
            <path
                d="M20 7L8 12v7c0 7.5 5.1 14.5 12 17 6.9-2.5 12-9.5 12-17v-7L20 7z"
                fill="#1E40AF"
            />
            {/* Wrench icon in gold */}
            <g transform="translate(12, 12)">
                <path
                    d="M14.5 1.5C12.2 1.5 10.3 3 9.7 5.1L7.5 7.3 5.7 5.5 4.3 6.9 6.1 8.7 2.5 12.3c-.6.6-.6 1.6 0 2.2l1 1c.6.6 1.6.6 2.2 0l3.6-3.6 1.8 1.8 1.4-1.4-1.8-1.8 2.2-2.2C14 8.8 15 9 16 9c2.2 0 4-1.8 4-4 0-.4-.1-.9-.2-1.3l-2.5 2.5-1.5-1.5 2.5-2.5C17.9 1.9 17.2 1.5 16.5 1.5H14.5z"
                    fill="#F59E0B"
                    transform="scale(0.9) translate(0, 0)"
                />
            </g>
        </svg>
    );
}

export default function BrandLogo({ variant = 'full', size }: BrandLogoProps) {
    const iconSize = size ?? (variant === 'compact' ? 32 : variant === 'icon' ? 36 : 36);

    if (variant === 'icon') return <BrandIcon size={iconSize} />;

    if (variant === 'compact') {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
                <BrandIcon size={iconSize} />
                <span style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#1E3A8A',
                    letterSpacing: '-0.2px',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                }}>
                    Pathak &amp; Sons
                </span>
            </div>
        );
    }

    // 'full' variant – two-line branding
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandIcon size={iconSize} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    color: '#1E3A8A',
                    letterSpacing: '-0.2px',
                    whiteSpace: 'nowrap',
                }}>
                    Pathak &amp; Sons
                </span>
                <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '0.6rem',
                    color: '#F59E0B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    whiteSpace: 'nowrap',
                }}>
                    Services
                </span>
            </div>
        </div>
    );
}
