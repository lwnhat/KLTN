import React from 'react';

interface LuxuryLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
  showText?: boolean;
  className?: string;
}

export default function LuxuryLogo({ size = 'md', variant = 'light', className = '' }: LuxuryLogoProps) {
  const heights = {
    sm: 'h-3.5 sm:h-4',
    md: 'h-4 sm:h-5 md:h-6',
    lg: 'h-6 sm:h-8',
  };

  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center select-none py-1 ${className}`}>
      <img
        src="/brand-logo.png"
        alt="DANIEL WELLINGTON"
        className={`${heights[size]} w-auto object-contain transition-opacity duration-300 hover:opacity-85 ${
          isDark ? 'brightness-0 invert' : ''
        }`}
      />
    </div>
  );
}

