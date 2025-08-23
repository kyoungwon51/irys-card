import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IRYS CARD",
  description: "Generate personalized Irys Cards from your Twitter profile with AI analysis",
  icons: {
    icon: [
      { url: '/1.png', sizes: '32x32', type: 'image/png' },
      { url: '/1.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/1.png',
    apple: [
      { url: '/1.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/1.png" type="image/png" />
        <link rel="shortcut icon" href="/1.png" type="image/png" />
        <link rel="apple-touch-icon" href="/1.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
