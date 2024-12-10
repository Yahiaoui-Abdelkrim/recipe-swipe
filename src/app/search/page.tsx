'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Recipe } from '@/types/recipe';
import Link from 'next/link';
import debounce from 'lodash/debounce';
import { searchRecipes } from '@/lib/mealdb';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setRecipes([]);
        return;
      }
      
      setLoading(true);
      try {
        const results = await searchRecipes(term);
        setRecipes(results);
      } catch (error) {
        console.error('Error searching recipes:', error);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  return (
    <main className="max-w-4xl mx-auto p-4 mb-20">
      <div className="flex flex-col space-y-4">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {recipes.map((recipe) => (
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

      {!loading && recipes.length === 0 && searchTerm && (
        <div className="text-center py-4">
          <p>No recipes found. Try a different search term.</p>
        </div>
      )}
    </main>
  );
}
