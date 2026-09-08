'use client';

import React, { useState } from 'react';
import { X, Check, Crown, ShieldCheck } from 'lucide-react';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({ isOpen, onClose }) => {
  const [billingCycle, setBillingCycle] = useState<'yearly' | 'monthly'>('yearly');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-stone-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="pt-8 pb-6 px-6 sm:px-8 text-center bg-gradient-to-b from-amber-50/70 to-white">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100/80 text-amber-700 mb-3 shadow-xs">
            <Crown className="w-6 h-6" />
          </div>
          <h2 className="font-serif-brand text-2xl font-bold tracking-wide text-stone-900">
            LUXS PRO
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            動画に宿る一瞬のアウラを、余すことなく極限の美しさであなたの手元へ。
          </p>

          {/* Billing Switch */}
          <div className="inline-flex p-1 mt-5 bg-stone-100 rounded-full border border-stone-200 text-xs font-medium">
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              年額プラン (25% OFF)
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              月額プラン
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-serif-brand text-3xl sm:text-4xl font-black text-stone-900">
                {billingCycle === 'yearly' ? '¥730' : '¥980'}
              </span>
              <span className="text-xs text-stone-500 font-medium">/ 月</span>
            </div>
            {billingCycle === 'yearly' && (
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                年額 8,800円 (一括払い) で年間 2,960円 お得
              </p>
            )}
          </div>
        </div>

        {/* Feature List */}
        <div className="px-6 sm:px-8 py-5 space-y-3 bg-white border-t border-stone-100 text-xs text-stone-700">
          <div className="font-semibold text-stone-900 text-xs tracking-wider uppercase mb-1">
            Proプランのすべての特典:
          </div>

          {[
            { title: '4K / 8K Ultra-HD 超解像書き出し', desc: '大画面や印刷にも耐えうる最高精細クオリティ' },
            { title: 'ブランド透かし（ウォーターマーク）の完全解除', desc: '保存画像に一切のロゴを入れず純粋な写真として保存' },
            { title: '全コマZIP一括保存の無制限ダウンロード', desc: '数百コマのバースト連写アーカイブをまとめて保存' },
            { title: 'プレミアム・アウラフィルター全開放', desc: '自然な美肌補正、瞳のキャッチライト、銀塩フィルム調の全プリセット' },
            { title: '長尺動画・超高密度バースト（0.05秒刻み）解析', desc: 'どんな長さの動画でも瞬時にフルフレームスキャン' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div>
                <span className="font-semibold text-stone-900">{item.title}</span>
                <p className="text-[11px] text-stone-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="p-6 sm:px-8 bg-stone-50/80 border-t border-stone-200/80 space-y-2.5 text-center">
          <button
            onClick={() => {
              alert('現在はプロトタイププレビュー期間中のため、Pro機能をすべて無料でご利用いただけます。');
              onClose();
            }}
            className="w-full py-3 px-6 rounded-2xl font-bold text-sm text-stone-950 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 hover:from-amber-300 hover:to-orange-300 shadow-md shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer"
          >
            7日間の無料体験を始める
          </button>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>いつでもキャンセル可能。無料期間終了まで課金は発生しません。</span>
          </div>
        </div>
      </div>
    </div>
  );
};
