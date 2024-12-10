'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAuthPage = pathname.startsWith('/auth/');
  if (isAuthPage) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background border-b p-4 z-50">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-2">
          {user?.emailVerified && (
            <>
              <Link href="/">
                <Button variant={pathname === '/' ? 'default' : 'ghost'}>
                  Discover
                </Button>
              </Link>
              <Link href="/liked">
                <Button variant={pathname === '/liked' ? 'default' : 'ghost'}>
                  Liked
                </Button>
              </Link>
              <Link href="/weekly">
                <Button variant={pathname === '/weekly' ? 'default' : 'ghost'}>
                  Weekly Plan
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Center Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link href="/">
            <h1 className="text-xl font-bold hover:text-primary cursor-pointer">140 Recipes</h1>
          </Link>
        </div>

        {/* Desktop User Menu */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                href="/profile" 
                className={`text-sm hover:text-foreground transition-colors ${
                  pathname === '/profile' ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
              >
                {user.displayName || 'User'}
              </Link>
              <Button variant="outline" onClick={() => logout()}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Link href="/auth/sign-in">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] bg-background z-40">
          <div className="flex flex-col p-4 space-y-4">
            {user?.emailVerified && (
              <>
                <Link href="/" onClick={() => setIsMenuOpen(false)}>
                  <Button 
                    variant={pathname === '/' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                  >
                    Discover
                  </Button>
                </Link>
                <Link href="/liked" onClick={() => setIsMenuOpen(false)}>
                  <Button 
                    variant={pathname === '/liked' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                  >
                    Liked
                  </Button>
                </Link>
                <Link href="/weekly" onClick={() => setIsMenuOpen(false)}>
                  <Button 
                    variant={pathname === '/weekly' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                  >
                    Weekly Plan
                  </Button>
                </Link>
                <div className="border-t pt-4">
                  <Link 
                    href="/profile" 
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2"
                  >
                    {user.displayName || 'User'}
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full mt-2"
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            )}
            {!user && (
              <Link href="/auth/sign-in" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}