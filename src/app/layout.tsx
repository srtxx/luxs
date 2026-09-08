import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LUXS - 動画からベストショットを高画質抽出',
  description: '動画からブレのない美しい瞬間を選び出し、高画質写真として保存するポートレートツール。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full overflow-hidden dark">
      <body className="h-full w-full overflow-hidden bg-[#0C0C0C] text-[#F5F5F5] antialiased">
        {children}
      </body>
    </html>
  );
}
