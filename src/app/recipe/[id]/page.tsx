'use client';

import { useState, useEffect, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateAndSanitizeRecipe } from '@/lib/recipe-validator';
import type { Recipe } from '@/types/recipe';
import Link from 'next/link';

interface RecipeDetailsProps {
  params: Promise<{ id: string }>;
}

function RecipeContent({ id }: { id: string }) {
  const [recipe, setRecipe] = useState<(Recipe & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const docRef = doc(db, 'liked_recipes', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const validationResult = validateAndSanitizeRecipe(docSnap.id, docSnap.data());
          
          if (!validationResult.isValid || !validationResult.sanitizedRecipe) {
            setError('Invalid recipe data');
            return;
          }

          setRecipe(validationResult.sanitizedRecipe);
        } else {
          setError('Recipe not found');
        }
      } catch (error) {
        console.error('Error fetching recipe:', error);
        setError('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (error || !recipe) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Link href="/liked">
                <Button variant="outline">Back to Liked Recipes</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-4 mb-20">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">{recipe.strMeal}</CardTitle>
            <Link href="/liked">
              <Button variant="outline">Back to Liked Recipes</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="aspect-video relative overflow-hidden rounded-lg">
            <img 
              src={recipe.strMealThumb} 
              alt={recipe.strMeal}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2">Details</h3>
              <p><span className="font-medium">Category:</span> {recipe.strCategory}</p>
              <p><span className="font-medium">Cuisine:</span> {recipe.strArea}</p>
              {recipe.strSocialMediaLink && (
                <p>
                  <span className="font-medium">Social Media:</span>{' '}
                  <a 
                    href={recipe.strSocialMediaLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Related Content
                  </a>
                </p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Ingredients</h3>
              <ul className="list-disc list-inside space-y-1">
                {recipe.ingredients.map((ingredient, index) => (
                  ingredient && (
                    <li key={index}>
                      {ingredient} - {recipe.measures[index]}
                    </li>
                  )
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Instructions</h3>
            <p className="whitespace-pre-wrap">{recipe.strInstructions}</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function RecipeDetails({ params }: RecipeDetailsProps) {
  const resolvedParams = use(params);
  return <RecipeContent id={resolvedParams.id} />;
}
