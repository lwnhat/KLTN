import React from 'react';

interface LuxuryLogoProps {
  size?: 'sm' | 'md' | 'lg';
  collapsed?: boolean;
}

export default function LuxuryLogo({ size = 'md', collapsed = false }: LuxuryLogoProps) {
  const iconSize = size === 'sm' ? 32 : size === 'lg' ? 48 : 38;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, userSelect: 'none' }}>
      {/* ─── EMERALD CUT SOLITAIRE DIAMOND ICON ─── */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <svg
          viewBox="0 0 100 100"
          style={{
            width: iconSize,
            height: iconSize,
            filter: 'drop-shadow(0 2px 8px rgba(202, 138, 4, 0.45))',
          }}
        >
          <defs>
            <linearGradient id="adminLogoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="30%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#fef08a" />
              <stop offset="75%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            <linearGradient id="adminFacetGold" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            <radialGradient id="adminPlaqueBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="70%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>

          {/* Obsidian Plaque */}
          <rect x="5" y="5" width="90" height="90" rx="20" fill="url(#adminPlaqueBg)" stroke="url(#adminLogoGold)" strokeWidth="1.5" />

          {/* Emerald Cut Octagon Outer Frame */}
          <polygon
            points="24,14 76,14 86,24 86,76 76,86 24,86 14,76 14,24"
            fill="none"
            stroke="url(#adminFacetGold)"
            strokeWidth="1.2"
            opacity="0.8"
          />

          {/* Emerald Cut Octagon Inner Frame */}
          <polygon
            points="28,20 72,20 80,28 80,72 72,80 28,80 20,72 20,28"
            fill="none"
            stroke="url(#adminLogoGold)"
            strokeWidth="0.8"
            strokeDasharray="2 3"
            opacity="0.5"
          />

          {/* Top Solitaire Diamond Facet */}
          <polygon points="50,6 58,14 50,18 42,14" fill="url(#adminLogoGold)" />
          <polygon points="50,6 50,18 58,14" fill="#ffffff" opacity="0.6" />
          <circle cx="50" cy="11" r="1.2" fill="#ffffff" />

          {/* Monogram 'M' and 'N' Intertwined */}
          <g fill="url(#adminLogoGold)">
            {/* Stem 1 of M */}
            <path d="M 28 32 L 34 32 L 34 68 L 28 68 Z" />
            {/* Stem 2 of M */}
            <path d="M 52 32 L 58 32 L 58 68 L 52 68 Z" />
            {/* V of M */}
            <path d="M 32 34 L 43 56 L 47 56 L 54 34 L 49 34 L 45 50 L 37 34 Z" />
            {/* N diagonal & stem */}
            <path d="M 54 34 L 70 64 L 74 64 L 74 32 L 68 32 L 68 58 L 56 34 Z" />
          </g>

          {/* Sparkles */}
          <circle cx="43" cy="38" r="1" fill="#ffffff" />
          <circle cx="70" cy="60" r="1" fill="#ffffff" />
        </svg>
      </div>

      {/* ─── BRAND TYPOGRAPHY ─── */}
      {!collapsed && (
        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div
            style={{
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: '0.12em',
              lineHeight: 1.2,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            MN JEWELRY
          </div>
          <div
            style={{
              color: '#94a3b8',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            Back-office Portal
          </div>
        </div>
      )}
    </div>
  );
}
