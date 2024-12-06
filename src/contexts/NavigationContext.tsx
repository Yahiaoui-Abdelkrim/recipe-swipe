'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextType {
  previousPath: string;
  setPreviousPath: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [previousPath, setPreviousPath] = useState<string>('/search');
  const pathname = usePathname();

  // Update previous path when pathname changes
  useEffect(() => {
    // Don't update if current path is a recipe detail page
    if (!pathname.startsWith('/recipe/')) {
      setPreviousPath(pathname);
    }
  }, [pathname]);

  return (
    <NavigationContext.Provider value={{ previousPath, setPreviousPath }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
