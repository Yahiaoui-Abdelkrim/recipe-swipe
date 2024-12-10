import type { Metadata } from "next";
import { Navigation } from '@/components/Navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from '@/components/ui/toaster';

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
  title: "140 Recipes",
  description: "Discover and save your favorite recipes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background">
        <AuthProvider>
          <NavigationProvider>
            <Navigation />
            <div className="pt-20">
              {children}
            </div>
          </NavigationProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}