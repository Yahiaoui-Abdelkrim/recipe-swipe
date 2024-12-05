'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateAndSanitizeRecipe } from '@/lib/recipe-validator';
import { cleanupInvalidRecipes } from '@/lib/db-cleanup';
import type { Recipe } from '@/types/recipe';
import Link from 'next/link';

export default function LikedRecipes() {
  const [recipes, setRecipes] = useState<(Recipe & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  const fetchLikedRecipes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'liked_recipes'));
      const recipesMap = new Map();
      const invalidDocs: string[] = [];

      querySnapshot.docs.forEach(doc => {
        const validationResult = validateAndSanitizeRecipe(doc.id, doc.data());
        
        if (!validationResult.isValid) {
          invalidDocs.push(doc.id);
          console.error(
            `Recipe document ${doc.id} is invalid:`,
            validationResult.missingFields.join(', ')
          );
          return;
        }

        if (validationResult.sanitizedRecipe && !recipesMap.has(validationResult.sanitizedRecipe.id)) {
          recipesMap.set(validationResult.sanitizedRecipe.id, validationResult.sanitizedRecipe);
        }
      });

      if (invalidDocs.length > 0) {
        console.warn(`Found ${invalidDocs.length} invalid recipe documents`);
      }

      setRecipes(Array.from(recipesMap.values()));
    } catch (error) {
      console.error('Error fetching liked recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedRecipes();
  }, []);

  const handleCleanup = async () => {
    if (cleaning) return;
    
    setCleaning(true);
    try {
      const results = await cleanupInvalidRecipes();
      console.log('Cleanup completed:', results);
      // Refresh the recipes list after cleanup
      await fetchLikedRecipes();
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <main className="max-w-4xl mx-auto p-4 mb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Liked Recipes</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handleCleanup} 
            disabled={cleaning}
            variant="outline"
          >
            {cleaning ? 'Cleaning...' : 'Clean Invalid Recipes'}
          </Button>
          <Button onClick={() => window.location.href = '/add-recipe'}>
            Add Recipe
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader className="flex-none">
                <CardTitle className="text-xl leading-tight min-h-[3rem] line-clamp-2">
                  {recipe.strMeal}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="relative aspect-video mb-2 flex-none">
                  <img 
                    src={recipe.strMealThumb} 
                    alt={recipe.strMeal}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
                <div className="mt-auto">
                  <p className="text-sm text-gray-600">{recipe.strCategory}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}