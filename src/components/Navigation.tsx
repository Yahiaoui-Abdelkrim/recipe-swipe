'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background border-b p-4 z-50">
      <div className="max-w-md mx-auto flex justify-around">
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
        <Link href="/search">
          <Button variant={pathname === '/search' ? 'default' : 'ghost'}>
            Search
          </Button>
        </Link>
        <Link href="/weekly">
          <Button variant={pathname === '/weekly' ? 'default' : 'ghost'}>
            Weekly Plan
          </Button>
        </Link>
      </div>
    </nav>
  );
}