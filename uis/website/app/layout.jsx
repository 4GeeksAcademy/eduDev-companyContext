import './globals.css';

export const metadata = {
  title: 'TrackFlow | Logistics that keeps commerce moving',
  description: 'TrackFlow provides warehouse, delivery, and returns operations for e-commerce brands in the United States and Spain.',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
