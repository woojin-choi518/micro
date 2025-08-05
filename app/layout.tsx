import React from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Header from './components/common/Header';
import GoogleMapsProvider from '@/app/components/providers/GoogleMapsProvider';
import MainWrapper from './components/common/MainWrapper';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Microbiome Map',
  description: 'Explore the world of microorganisms.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 전역 헤더 */}
        <Header />
        <GoogleMapsProvider>
          <MainWrapper>{children}</MainWrapper>
        </GoogleMapsProvider>
      </body>
    </html>
  );
}
