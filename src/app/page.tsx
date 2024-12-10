'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RecipeSwiper } from '@/components/RecipeSwiper';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Recipe } from '@/types/recipe';
import debounce from 'lodash/debounce';
import { searchRecipes } from '@/lib/mealdb';
import { Search, Shuffle } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const debouncedSearch = debounce(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const results = await searchRecipes(term);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching recipes:', error);
    } finally {
      setLoading(false);
    }
  }, 500);

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm]);

  const toggleView = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">140 Recipes</CardTitle>
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
      <div className="z-10 w-full max-w-4xl">
        <div className="flex flex-col items-center mb-8">
          <Button
            onClick={toggleView}
            variant="outline"
            className="flex items-center gap-2"
          >
            {showSearch ? (
              <>
                <Shuffle className="w-4 h-4" />
                Switch to Swiper
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Switch to Search
              </>
            )}
          </Button>
        </div>

        {showSearch ? (
          <div className="w-full">
            <div className="mb-8">
              <Input
                type="search"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {loading && (
              <div className="text-center py-4">
                <p>Loading recipes...</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((recipe) => (
                <Link href={`/recipe/${recipe.idMeal}`} key={recipe.idMeal}>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col">
                    <CardHeader className="flex-none">
                      <CardTitle className="text-xl leading-tight min-h-[3rem] line-clamp-2">
                        {recipe.strMeal}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="aspect-video relative overflow-hidden rounded-md">
                        <img
                          src={recipe.strMealThumb}
                          alt={recipe.strMeal}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="mt-2">
                        <Badge variant="secondary">{recipe.strCategory}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {!loading && searchResults.length === 0 && searchTerm && (
              <div className="text-center py-4">
                <p>No recipes found. Try a different search term.</p>
              </div>
            )}
          </div>
        ) : (
          <RecipeSwiper />
        )}
      </div>
    </main>
  );
}