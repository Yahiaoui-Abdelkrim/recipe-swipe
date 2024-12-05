import type { Metadata } from "next";
import { Navigation } from '@/components/Navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Recipe Swipe",
  description: "Discover and save your favorite recipes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AuthProvider>
          <Navigation />
          <div className="pt-20">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}