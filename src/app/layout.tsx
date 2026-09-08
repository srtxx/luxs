import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LUXS - 一瞬に宿るアウラを、永遠の1枚に。',
  description:
    '動画の連続する時間の中から、あなただけの最も美しい奇跡の瞬間（アウラ）を救い出す。AI鮮明度解析と高精細レタッチによる新しいポートレート体験。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased light">
      <body className="min-h-full flex flex-col bg-[#FAF9F5] text-stone-900">{children}</body>
    </html>
  );
}
