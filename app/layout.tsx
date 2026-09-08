import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Fed-ResViT | Research & Clinical Intelligence',
  description:
    'Explore the revised ten-client Fed-ResViT protocol, robust baselines, adaptive poisoning and Trust sensitivity, with original measured evidence kept separate from pending results.',
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
