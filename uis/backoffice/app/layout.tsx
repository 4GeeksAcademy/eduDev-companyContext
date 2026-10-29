import type { ReactNode } from 'react';
import Script from 'next/script';

export const metadata = { title: 'TrackFlow Inventory' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><Script src="/uis/backoffice/api-config.js" strategy="beforeInteractive" />{children}</body></html>;
}
