'use client';

import React from 'react';
import { RefreshCw, Crown, Sparkles, Film, Columns2 } from 'lucide-react';

export type ActiveView = 'curated' | 'atelier' | 'compare';

interface HeaderProps {
  hasVideo: boolean;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onReset: () => void;
  onOpenProModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasVideo,
  activeView,
  onSelectView,
  onReset,
  onOpenProModal,
}) => {
  return (
    <header className="glass-panel sticky top-0 z-40 shadow-xs border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-300 p-[1.5px] flex items-center justify-center shadow-xs">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <span className="font-serif-brand font-bold text-amber-700 text-xs">L</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif-brand text-xl font-bold tracking-widest text-stone-900">
              LUXS
            </span>
            <span className="text-[10px] tracking-wider uppercase font-semibold text-stone-400 hidden sm:inline">
              L&apos;ATELIER D&apos;AURA
            </span>
          </div>
        </div>

        {/* Center: View Switcher (Visible when video is loaded) */}
        {hasVideo && (
          <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-full border border-stone-200/60 shadow-inner">
            <button
              type="button"
              onClick={() => onSelectView('curated')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'curated'
                  ? 'bg-white text-stone-900 shadow-xs ring-1 ring-stone-900/10'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>奇跡の3瞬</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('atelier')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'atelier'
                  ? 'bg-white text-stone-900 shadow-xs ring-1 ring-stone-900/10'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Film className="w-3 h-3 text-stone-700" />
              <span>タイムライン</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'compare'
                  ? 'bg-white text-stone-900 shadow-xs ring-1 ring-stone-900/10'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Columns2 className="w-3 h-3 text-stone-700" />
              <span>2画面比較</span>
            </button>
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Pro Modal Trigger */}
          <button
            onClick={onOpenProModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-gradient-to-r from-amber-100/90 via-orange-100/70 to-amber-50 hover:from-amber-200/90 hover:to-amber-100 border border-amber-300/80 rounded-full shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">LUXS PRO</span>
            <span className="sm:hidden">PRO</span>
          </button>

          {hasVideo && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 rounded-full shadow-xs transition-colors cursor-pointer"
              title="動画を変更"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">別の動画</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
