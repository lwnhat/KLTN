import React from 'react';

interface LuxuryLogoProps {
  size?: 'sm' | 'md' | 'lg';
  collapsed?: boolean;
}

export default function LuxuryLogo({ size = 'md', collapsed = false }: LuxuryLogoProps) {
  const heights = {
    sm: 14,
    md: 18,
    lg: 24,
  };
  const h = heights[size] || 18;

  if (collapsed) {
    return (
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: 14,
          letterSpacing: '0.08em',
        }}
      >
        DW
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, userSelect: 'none', padding: '4px 0' }}>
      <img
        src="/brand-logo.png"
        alt="DANIEL WELLINGTON"
        style={{
          height: h,
          width: 'auto',
          maxWidth: '100%',
          objectFit: 'contain',
          filter: 'brightness(0) invert(1)',
        }}
      />
      <div
        style={{
          color: '#94a3b8',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        Back-Office Suite
      </div>
    </div>
  );
}

