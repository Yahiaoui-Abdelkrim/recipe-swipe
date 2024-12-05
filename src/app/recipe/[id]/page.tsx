'use client';

import { useState, useEffect, use } from 'react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateAndSanitizeRecipe } from '@/lib/recipe-validator';
import { getRecipeById } from '@/lib/mealdb';
import type { Recipe } from '@/types/recipe';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

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
        // First try to get from liked recipes
        const docRef = doc(db, 'liked_recipes', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const docData = docSnap.data();
          const docId = docSnap.id;
          
          if (docId && docData) {
            const validationResult = validateAndSanitizeRecipe(docId, docData);
            if (validationResult.isValid && validationResult.sanitizedRecipe) {
              setRecipe(validationResult.sanitizedRecipe);
              return;
            }
          }
        }

        // If not found in liked recipes, try MealDB
        const mealDbRecipe = await getRecipeById(id);
        if (mealDbRecipe) {
          setRecipe(mealDbRecipe);
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
              <Link href="/search">
                <Button variant="outline">Back to Search</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-4 mb-20">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/search">
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
        <LikeButton recipe={recipe} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="aspect-[4/3] relative overflow-hidden">
            <img 
              src={recipe.strMealThumb} 
              alt={recipe.strMeal}
              className="object-cover w-full h-full"
            />
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{recipe.strMeal}</h1>
              <p className="text-sm text-muted-foreground">{recipe.strCategory} • {recipe.strArea}</p>
            </div>

            <div>
              <h2 className="font-semibold mb-3">Ingredients</h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  ingredient && (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-4 h-4 mt-0.5 rounded-full bg-green-100 flex-shrink-0" />
                      <span>
                        <span className="font-medium">{recipe.measures[index]}</span> {ingredient}
                      </span>
                    </li>
                  )
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-semibold mb-3">Instructions</h2>
              <div className="space-y-4 text-sm">
                {recipe.strInstructions.split('\n').filter(Boolean).map((step, index) => (
                  <p key={index}>{step}</p>
                ))}
              </div>
            </div>

            {recipe.strSocialMediaLink && (
              <a 
                href={recipe.strSocialMediaLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-green-600 hover:text-green-700"
              >
                View Recipe Video →
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function LikeButton({ recipe }: { recipe: Recipe }) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkIfLiked = async () => {
      const docRef = doc(db, 'liked_recipes', recipe.id);
      const docSnap = await getDoc(docRef);
      setIsLiked(docSnap.exists());
      setLoading(false);
    };

    checkIfLiked();
  }, [recipe.id, user]);

  const handleLike = async () => {
    if (!user) {
      router.push('/auth/sign-in');
      return;
    }

    setLoading(true);
    const docRef = doc(db, 'liked_recipes', recipe.id);

    try {
      if (isLiked) {
        await deleteDoc(docRef);
        setIsLiked(false);
      } else {
        // Prepare the recipe data without the id field
        const { id, idMeal, ...recipeData } = recipe;
        
        // Ensure all required fields are present
        const recipeToValidate = {
          ...recipeData,
          idMeal: id,
          id: id,
          ingredients: recipe.ingredients || [],
          measures: recipe.measures || [],
          likedAt: new Date().toISOString()
        };

        const validationResult = validateAndSanitizeRecipe(id, recipeToValidate);
        
        if (!validationResult.isValid) {
          console.error('Recipe validation failed:', validationResult.missingFields);
          return;
        }

        if (validationResult.sanitizedRecipe) {
          await setDoc(docRef, validationResult.sanitizedRecipe);
          setIsLiked(true);
        }
      }
    } catch (error) {
      console.error('Error updating like status:', error);
    }

    setLoading(false);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full"
      onClick={handleLike}
      disabled={loading}
    >
      <Heart className={isLiked ? "fill-current" : ""} />
      {!user && (
        <span className="sr-only">Sign in to like this recipe</span>
      )}
    </Button>
  );
}

export default function RecipeDetails({ params }: RecipeDetailsProps) {
  const resolvedParams = use(params);
  return <RecipeContent id={resolvedParams.id} />;
}
