'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
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
        <Link href="/weekly">
          <Button variant={pathname === '/weekly' ? 'default' : 'ghost'}>
            Weekly Plan
          </Button>
        </Link>
      </div>
    </nav>
  );
}