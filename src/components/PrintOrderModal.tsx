'use client';

import React, { useState } from 'react';
import { X, Check, Package, Truck } from 'lucide-react';
import { BurstFrame } from '@/lib/video-burst';

interface PrintOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  frame: BurstFrame;
}

type ProductType = 'acrylic' | 'card' | 'frame';

interface ProductInfo {
  id: ProductType;
  title: string;
  subtitle: string;
  price: number;
  description: string;
}

const PRODUCTS: ProductInfo[] = [
  {
    id: 'acrylic',
    title: '自立型アクリルアートブロック',
    subtitle: '厚さ20mm 高透明度アクリル仕上げ',
    price: 3800,
    description: '光を受けると写真が浮かび上がるような透明感。デスクや部屋の棚にそのまま飾れる重厚なプレミアムインテリア。',
  },
  {
    id: 'card',
    title: 'ポラロイド風・高精細カード (3枚セット)',
    subtitle: '上質マットファインペーパー仕様',
    price: 1200,
    description: 'スマホケースに挟んだり、手帳にコレクションできる上品なポラロイド調デザイン。選んだコマの前後の表情も合わせて3枚お届け。',
  },
  {
    id: 'frame',
    title: '銀塩ファインアート・木製額装プリント',
    subtitle: '天然無垢木フレーム ＋ 高級マット台紙',
    price: 6800,
    description: '美術館基準の最高品質プリント。天然木の温もりと額装マットが、奇跡の1枚を生涯色褪せない芸術品へと仕立てます。',
  },
];

export const PrintOrderModal: React.FC<PrintOrderModalProps> = ({
  isOpen,
  onClose,
  frame,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductType>('acrylic');
  const [quantity, setQuantity] = useState(1);
  const [isOrdered, setIsOrdered] = useState(false);

  if (!isOpen) return null;

  const currentProduct = PRODUCTS.find((p) => p.id === selectedProduct) || PRODUCTS[0];
  const totalPrice = currentProduct.price * quantity;

  const handleOrder = () => {
    setIsOrdered(true);
    setTimeout(() => {
      setIsOrdered(false);
      onClose();
      alert('ご注文予約を受け付けました。（プロトタイプ環境のため実際の決済・課金は行われません）');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-stone-900 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="pt-6 pb-4 px-6 sm:px-8 border-b border-stone-100 bg-gradient-to-b from-stone-50 to-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <Package className="w-4 h-4 text-amber-600" />
            <span>AURA PRINT - 物質化サービス</span>
          </div>
          <h2 className="font-serif-brand text-2xl font-bold tracking-wide text-stone-900">
            この奇跡の1瞬を、一生触れられる形に。
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            画面のデータを超えて、光と質量を持った唯一無二の物質として手元に残します。
          </p>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:px-8 space-y-6">
          {/* Product Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-2.5 p-1 bg-stone-100 rounded-2xl">
            {PRODUCTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProduct(p.id)}
                className={`py-2.5 px-2 rounded-xl text-center transition-all cursor-pointer ${
                  selectedProduct === p.id
                    ? 'bg-white text-stone-900 shadow-xs font-bold border border-stone-200/80'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <div className="text-xs truncate">{p.title.split(' (')[0]}</div>
                <div className="text-[11px] font-mono text-amber-800 mt-0.5 font-bold">
                  ¥{p.price.toLocaleString()}
                </div>
              </button>
            ))}
          </div>

          {/* Realistic Product Mockup Preview */}
          <div className="relative w-full h-64 sm:h-72 bg-gradient-to-b from-stone-100 to-stone-200/70 rounded-2xl flex items-center justify-center p-6 overflow-hidden border border-stone-200/80 shadow-inner">
            {/* Acrylic Block Mockup */}
            {selectedProduct === 'acrylic' && (
              <div className="relative group transition-transform duration-300 hover:scale-105">
                <div className="relative w-40 sm:w-48 aspect-3/4 rounded-xl overflow-hidden shadow-2xl border-4 border-white/60 ring-8 ring-black/5">
                  <img
                    src={frame.dataUrl}
                    alt="Acrylic Preview"
                    className="w-full h-full object-cover"
                  />
                  {/* Glass Reflection Highlight */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-white/40 pointer-events-none" />
                  <div className="absolute bottom-2 right-2 text-[9px] font-serif-brand font-bold text-white/70 tracking-widest pointer-events-none">
                    LUXS
                  </div>
                </div>
                {/* 3D Acrylic Depth Shadow */}
                <div className="w-40 sm:w-48 h-4 bg-stone-400/40 rounded-full blur-md mx-auto mt-2" />
              </div>
            )}

            {/* Polaroid Cards Mockup */}
            {selectedProduct === 'card' && (
              <div className="flex items-center justify-center -space-x-8 hover:space-x-2 transition-all duration-300">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className={`w-32 sm:w-36 bg-white p-2.5 pb-6 rounded-lg shadow-xl border border-stone-200 transition-transform ${
                      idx === 0 ? '-rotate-6 mt-2' : idx === 2 ? 'rotate-6 mt-2' : 'rotate-0 z-10 scale-105'
                    }`}
                  >
                    <div className="aspect-square w-full bg-stone-100 overflow-hidden rounded">
                      <img
                        src={frame.dataUrl}
                        alt="Card"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[9px] font-mono text-stone-400 mt-2 text-center tracking-wider">
                      {frame.timestamp.toFixed(2)}s • AURA #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Wooden Frame Mockup */}
            {selectedProduct === 'frame' && (
              <div className="relative transition-transform duration-300 hover:scale-105">
                {/* Wooden Frame Exterior */}
                <div className="p-4 bg-gradient-to-b from-[#8B5A2B] to-[#5C3A21] rounded-xl shadow-2xl border border-stone-800">
                  {/* Mat board */}
                  <div className="p-4 bg-[#FAF8F5] rounded shadow-inner">
                    <div className="w-36 sm:w-44 aspect-3/4 overflow-hidden rounded shadow">
                      <img
                        src={frame.dataUrl}
                        alt="Frame Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                <div className="w-40 sm:w-48 h-4 bg-stone-500/30 rounded-full blur-md mx-auto mt-3" />
              </div>
            )}
          </div>

          {/* Selected Product Details */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-900">{currentProduct.title}</h4>
                <p className="text-xs text-amber-800 font-medium">{currentProduct.subtitle}</p>
              </div>
              <div className="text-right">
                <span className="font-serif-brand text-lg font-bold text-stone-900">
                  ¥{currentProduct.price.toLocaleString()}
                </span>
                <span className="text-[10px] text-stone-500 block">(税込・送料無料)</span>
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed pt-1 border-t border-stone-200/60">
              {currentProduct.description}
            </p>
          </div>

          {/* Quantity & Shipping Info */}
          <div className="flex items-center justify-between text-xs text-stone-600 px-1">
            <div className="flex items-center gap-2">
              <span>数量:</span>
              <div className="inline-flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  -
                </button>
                <span className="px-3 py-1 font-mono font-bold text-stone-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-stone-500">
              <Truck className="w-4 h-4 text-stone-400" />
              <span>国内製造・3〜5営業日でお届け</span>
            </div>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 sm:px-8 border-t border-stone-200 bg-white flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-stone-500 block">合計金額</span>
            <span className="font-serif-brand text-xl font-bold text-stone-900">
              ¥{totalPrice.toLocaleString()}
            </span>
          </div>

          <button
            onClick={handleOrder}
            disabled={isOrdered}
            className="flex-1 max-w-xs py-3 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-stone-900 to-stone-800 hover:from-stone-800 hover:to-stone-700 shadow-lg shadow-stone-900/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isOrdered ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>予約完了</span>
              </>
            ) : (
              <span>注文手続きへ進む</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
