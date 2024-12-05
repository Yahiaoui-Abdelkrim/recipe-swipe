'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RecipeSwiper } from '@/components/RecipeSwiper';

export default function Home() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Recipe Swipe</CardTitle>
            <CardDescription className="text-lg mt-2">
              Discover, save, and organize your favorite recipes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Link href="/auth/sign-in">
                <Button className="w-full" size="lg">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button className="w-full" variant="outline" size="lg">
                  Create Account
                </Button>
              </Link>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Join our community to:
              <ul className="mt-2 space-y-1">
                <li>• Discover new recipes daily</li>
                <li>• Save your favorite recipes</li>
                <li>• Create weekly meal plans</li>
                <li>• Get personalized recommendations</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <div className="z-10 w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-8">Recipe Swiper</h1>
        <RecipeSwiper />
      </div>
    </main>
  );
}