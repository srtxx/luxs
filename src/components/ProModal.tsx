'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({ isOpen, onClose }) => {
  const [billingCycle, setBillingCycle] = useState<'yearly' | 'monthly'>('yearly');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="relative w-full max-w-md bg-[var(--surface)] rounded-2xl border border-[var(--surface-border)] shadow-2xl text-[var(--foreground)] overflow-hidden flex flex-col transition-colors duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="pt-8 pb-4 px-6 text-center">
          <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            LUXS PRO
          </h2>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            4K超解像出力、透かし解除、無制限アーカイブ。
          </p>

          {/* Billing Switch */}
          <div className="inline-flex p-1 mt-5 bg-[var(--surface-subtle)] rounded-xl border border-[var(--surface-border)] text-xs font-medium">
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-2xs font-semibold'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              年額（月480円換算）
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-2xs font-semibold'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              月額（980円/月）
            </button>
          </div>
        </div>

        {/* Price Box */}
        <div className="px-6 py-3 text-center">
          <div className="text-3xl font-bold text-[var(--foreground)] font-mono tabular-numbers">
            {billingCycle === 'yearly' ? '¥5,800' : '¥980'}
            <span className="text-xs font-normal text-[var(--foreground-muted)] font-sans ml-1">
              {billingCycle === 'yearly' ? '/ 年' : '/ 月'}
            </span>
          </div>
        </div>

        {/* Feature List */}
        <div className="px-8 py-4 space-y-2.5 text-xs text-[var(--foreground)]">
          {[
            '4K / ロスレス高解像度出力',
            '透かし（ウォーターマーク）完全非表示',
            '全コマ一括ZIPダウンロード',
            'すべてのトーンプリセット解放',
            '無制限の動画解析',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="p-6 pt-2">
          <button
            onClick={() => {
              alert('PRO体験を開始しました（デモ環境）');
              onClose();
            }}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all shadow-sm cursor-pointer"
          >
            7日間の無料体験を開始
          </button>
          <p className="text-[10px] text-[var(--foreground-muted)] text-center mt-2">
            いつでもキャンセル可能。無料期間終了まで課金されません。
          </p>
        </div>
      </div>
    </div>
  );
};
