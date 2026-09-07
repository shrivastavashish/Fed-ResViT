import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Fed-ResViT | Research & Clinical Intelligence',
  description:
    'Explore executed federated skin lesion research, targeted poisoning, trust-aware aggregation, and traceable evidence.',
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
