'use client';

import React, { useState } from 'react';
import { X, Package, Check } from 'lucide-react';
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
  specs: string;
  price: number;
  description: string;
}

const PRODUCTS: ProductInfo[] = [
  {
    id: 'acrylic',
    title: 'アクリルブロック',
    specs: '厚さ20mm 高透明度アクリル',
    price: 3800,
    description: 'デスクや本棚に自立して飾れる重厚感のある高透明アクリル仕上げ。',
  },
  {
    id: 'card',
    title: 'スクエアカード (3枚組)',
    specs: '高級マットファインペーパー',
    price: 1200,
    description: 'スマホケースに挟んだり手帳に挟めるコンパクトなスクエアカード。',
  },
  {
    id: 'frame',
    title: '天然木額装プリント',
    specs: '無垢木製フレーム + マット台紙',
    price: 6800,
    description: '美術館基準の長期保存性に優れた銀塩ファインアート額装。',
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
      alert('ご注文予約を受け付けました。（プロトタイプ環境のため決済は行われません）');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="relative w-full max-w-xl bg-[#141414] rounded-2xl border border-[#282828] shadow-2xl text-stone-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#242424]">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-stone-400" />
            <h2 className="text-sm font-semibold text-white">プリント注文</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Product Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-[#1C1C1C] p-1 rounded-xl border border-[#282828]">
            {PRODUCTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProduct(p.id)}
                className={`py-2 px-2 rounded-lg text-center transition-colors cursor-pointer ${
                  selectedProduct === p.id
                    ? 'bg-[#2A2A2A] text-white font-medium shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="text-xs truncate">{p.title}</div>
                <div className="text-[11px] font-mono text-stone-300 mt-0.5 tabular-numbers">
                  ¥{p.price.toLocaleString()}
                </div>
              </button>
            ))}
          </div>

          {/* Visual Mockup Preview */}
          <div className="relative w-full h-56 bg-[#0A0A0A] rounded-xl flex items-center justify-center p-4 border border-[#222222] overflow-hidden">
            {selectedProduct === 'acrylic' && (
              <div className="relative w-36 aspect-3/4 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20">
                <img
                  src={frame.dataUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
              </div>
            )}

            {selectedProduct === 'card' && (
              <div className="flex items-center justify-center -space-x-4">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className={`w-28 bg-[#1E1E1E] p-1.5 pb-4 rounded-md shadow-lg border border-[#333333] ${
                      idx === 0 ? '-rotate-6' : idx === 2 ? 'rotate-6' : 'rotate-0 z-10 scale-105'
                    }`}
                  >
                    <div className="aspect-square w-full bg-[#111111] overflow-hidden rounded">
                      <img
                        src={frame.dataUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedProduct === 'frame' && (
              <div className="relative w-44 aspect-3/4 bg-[#2C241E] p-3 rounded-md shadow-2xl border border-[#3E342B]">
                <div className="w-full h-full bg-[#EAE8E3] p-2 flex items-center justify-center">
                  <img
                    src={frame.dataUrl}
                    alt=""
                    className="w-full h-full object-cover shadow-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Product Description */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-stone-300">
              <span className="font-medium text-white">{currentProduct.title}</span>
              <span className="text-[11px] text-stone-500 font-mono">{currentProduct.specs}</span>
            </div>
            <p className="text-stone-400 leading-relaxed text-[11px]">
              {currentProduct.description}
            </p>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between pt-2 border-t border-[#242424] text-xs">
            <span className="text-stone-400">数量</span>
            <div className="flex items-center gap-2 bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg px-2 py-1 tabular-numbers">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-5 h-5 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center font-mono text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                className="w-5 h-5 flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Footer Order CTA */}
        <div className="p-4 border-t border-[#242424] bg-[#161616] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-stone-500">合計（税込）</div>
            <div className="text-base font-bold text-white font-mono tabular-numbers">
              ¥{totalPrice.toLocaleString()}
            </div>
          </div>

          <button
            type="button"
            onClick={handleOrder}
            disabled={isOrdered}
            className="flex items-center gap-1.5 py-2 px-5 rounded-lg text-xs font-semibold text-black bg-white hover:bg-stone-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isOrdered ? (
              <>
                <Check className="w-4 h-4 text-black" />
                <span>完了</span>
              </>
            ) : (
              <span>注文を確定する</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
