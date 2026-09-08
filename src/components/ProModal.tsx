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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="relative w-full max-w-md bg-[#141414] rounded-2xl border border-[#282828] shadow-2xl text-stone-100 overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-stone-400 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="pt-8 pb-4 px-6 text-center">
          <h2 className="text-xl font-bold tracking-tight text-white">
            LUXS PRO
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            4K超解像出力、透かし解除、無制限アーカイブ。
          </p>

          {/* Billing Switch */}
          <div className="inline-flex p-1 mt-5 bg-[#1E1E1E] rounded-lg border border-[#2C2C2C] text-xs font-medium">
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-[#2A2A2A] text-white shadow-xs font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              年額（月480円換算）
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-[#2A2A2A] text-white shadow-xs font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              月額（980円/月）
            </button>
          </div>
        </div>

        {/* Price Box */}
        <div className="px-6 py-3 text-center">
          <div className="text-3xl font-bold text-white font-mono tabular-numbers">
            {billingCycle === 'yearly' ? '¥5,800' : '¥980'}
            <span className="text-xs font-normal text-stone-400 font-sans ml-1">
              {billingCycle === 'yearly' ? '/ 年' : '/ 月'}
            </span>
          </div>
        </div>

        {/* Feature List */}
        <div className="px-8 py-4 space-y-2.5 text-xs text-stone-300">
          {[
            '4K / ロスレス高解像度出力',
            '透かし（ウォーターマーク）完全非表示',
            '全コマ一括ZIPダウンロード',
            'すべてのトーンプリセット解放',
            '無制限の動画解析',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-white shrink-0" />
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
            className="w-full py-2.5 rounded-lg text-xs font-semibold text-black bg-white hover:bg-stone-200 transition-colors shadow-xs cursor-pointer"
          >
            7日間の無料体験を開始
          </button>
          <p className="text-[10px] text-stone-500 text-center mt-2">
            いつでもキャンセル可能。無料期間終了まで課金されません。
          </p>
        </div>
      </div>
    </div>
  );
};
