import type { Metadata } from "next";
import { Navigation } from '@/components/Navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

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
          <NavigationProvider>
            <Navigation />
            <div className="pt-20">
              {children}
            </div>
          </NavigationProvider>
        </AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: '',
            duration: 2000,
            style: {
              background: '#fafaf9',
              color: '#18181b',
              padding: '12px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'var(--font-geist-sans)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e7e5e4',
              maxWidth: '360px',
            },
            success: {
              iconTheme: {
                primary: '#18181b',
                secondary: '#fafaf9',
              },
            },
            error: {
              iconTheme: {
                primary: '#18181b',
                secondary: '#fafaf9',
              },
              duration: 3000,
            },
          }}
        />
      </body>
    </html>
  );
}