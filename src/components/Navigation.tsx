'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isAuthPage = pathname.startsWith('/auth/');
  if (isAuthPage) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background border-b p-4 z-50">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex gap-2">
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

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link href="/">
            <h1 className="text-xl font-bold hover:text-primary cursor-pointer">140 Recipes</h1>
          </Link>
        </div>

        <div className="flex items-center gap-2">
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
    </nav>
  );
}