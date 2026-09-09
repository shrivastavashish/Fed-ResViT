import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Fed-ResViT | Research & Clinical Intelligence',
  description:
    'Explore trust-aware federated skin lesion classification across ten clients, robust aggregation baselines, adaptive poisoning and Trust sensitivity. Research results await verified artifacts.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
