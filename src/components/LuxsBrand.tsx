'use client';

import React from 'react';

interface LuxsBrandProps {
  compact?: boolean;
  className?: string;
  showStatus?: boolean;
}

/**
 * LUXS Studio Brand Symbol & Wordmark
 * Precision-crafted optical aperture & prism geometry.
 * Follows strict anti-AI-cliché and tactile craft design guidelines.
 */
export const LuxsBrand: React.FC<LuxsBrandProps> = ({
  compact = false,
  className = '',
  showStatus = true,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Optical Aperture Monogram */}
      <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--surface-subtle)] border border-[var(--surface-border)] shadow-2xs shrink-0">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-[var(--foreground)]"
        >
          {/* Outer Lens Ring */}
          <circle cx="12" cy="12" r="9" className="opacity-40" />
          {/* Internal Aperture Blades (Geometric Interlocking Lines) */}
          <path d="M12 3 L16.5 12" className="opacity-90 stroke-[var(--accent-primary)]" />
          <path d="M16.5 12 L10 19.5" className="opacity-90 stroke-[var(--accent-primary)]" />
          <path d="M10 19.5 L4.5 12" className="opacity-90 stroke-[var(--accent-primary)]" />
          <path d="M4.5 12 L12 3" className="opacity-90 stroke-[var(--accent-primary)]" />
          {/* Center Sensor / Pupil */}
          <circle cx="12" cy="12" r="2" className="fill-[var(--foreground)] opacity-90" />
        </svg>
      </div>

      {/* Wordmark & Type */}
      <div className="flex items-center gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold text-xs sm:text-sm tracking-[0.14em] uppercase text-[var(--foreground)]">
            LUXS
          </span>
          <span className="text-[9px] font-medium tracking-wider uppercase text-[var(--foreground-muted)] px-1 py-0.2 bg-[var(--surface-subtle)] border border-[var(--surface-border)] rounded">
            STUDIO
          </span>
        </div>

        {/* Engine Status Indicator (Non-compact only) */}
        {!compact && showStatus && (
          <div className="hidden sm:flex items-center gap-1.5 pl-2 ml-1 border-l border-[var(--surface-border)] text-[10px] text-[var(--foreground-muted)] font-mono">
            <span className="relative flex h-1.5 w-1.5">
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500/80" />
            </span>
            <span className="tracking-wider uppercase opacity-80">LOCAL ENGINE</span>
          </div>
        )}
      </div>
    </div>
  );
};
