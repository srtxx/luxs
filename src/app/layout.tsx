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
    <html lang="ja" className="h-full overflow-hidden" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('luxs_theme');if(t&&['luminous','blush','noir'].indexOf(t)!==-1){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="h-full w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
