'use client';

import React from 'react';
import { RefreshCw, Crown } from 'lucide-react';

interface HeaderProps {
  hasVideo: boolean;
  onReset: () => void;
  onOpenProModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasVideo,
  onReset,
  onOpenProModal,
}) => {
  return (
    <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-300 p-[1.5px] flex items-center justify-center shadow-xs">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <span className="font-serif-brand font-bold text-amber-700 text-sm">L</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-brand text-xl font-bold tracking-widest text-stone-900">
                LUXS
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                AURA
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block tracking-wide">
              動画に宿る奇跡の瞬間（アウラ）を救い出す
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Pro Modal Trigger */}
          <button
            onClick={onOpenProModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-gradient-to-r from-amber-100/90 via-orange-100/70 to-amber-50 hover:from-amber-200/90 hover:to-amber-100 border border-amber-300/80 rounded-full shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-amber-700" />
            <span>LUXS PRO</span>
          </button>

          {hasVideo && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 border border-stone-200 rounded-full transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">動画を変更</span>
            </button>
          )}

          <a
            href="https://github.com/srtxx/luxs"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-stone-400 hover:text-stone-700 transition-colors"
            title="GitHub Repository"
          >
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};
