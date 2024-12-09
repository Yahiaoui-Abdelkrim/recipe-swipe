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
import { useNavigation } from '@/contexts/NavigationContext';
import { EditRecipeDialog } from '@/components/EditRecipeDialog';
import { RestoreRecipeButton } from '@/components/RestoreRecipeButton';
import toast from 'react-hot-toast';
import { toggleLike } from '@/utils/likeUtils';

interface RecipeDetailsProps {
  params: Promise<{ id: string }>;
}

function RecipeContent({ id }: { id: string }) {
  const [recipe, setRecipe] = useState<(Recipe & { id: string; isCustomized?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { previousPath } = useNavigation();

  const handleBack = () => {
    router.push(previousPath);
  };

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      // First check for a customized version in user_recipes
      const customizedRef = doc(db, 'user_recipes', id);
      const customizedSnap = await getDoc(customizedRef);

      if (customizedSnap.exists()) {
        const docData = customizedSnap.data();
        const docId = customizedSnap.id;
        
        if (docId && docData) {
          const validationResult = validateAndSanitizeRecipe(docId, docData);
          if (validationResult.isValid && validationResult.sanitizedRecipe) {
            setRecipe({
              ...validationResult.sanitizedRecipe,
              isCustomized: true
            });
            return;
          }
        }
      }

      // Then check liked recipes
      const likedRef = doc(db, 'liked_recipes', id);
      const likedSnap = await getDoc(likedRef);
      
      if (likedSnap.exists()) {
        const docData = likedSnap.data();
        const docId = likedSnap.id;
        
        if (docId && docData) {
          const validationResult = validateAndSanitizeRecipe(docId, docData);
          if (validationResult.isValid && validationResult.sanitizedRecipe) {
            setRecipe({
              ...validationResult.sanitizedRecipe,
              isCustomized: false
            });
            return;
          }
        }
      }

      // If not found in either collection, try MealDB
      const mealDbRecipe = await getRecipeById(id);
      if (mealDbRecipe) {
        setRecipe({
          ...mealDbRecipe,
          isCustomized: false
        });
      } else {
        setError('Recipe not found');
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setError('Failed to fetch recipe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const handleRecipeUpdate = async (updatedRecipe: Recipe & { id: string }) => {
    setRecipe(updatedRecipe);
    toast.success('Recipe updated successfully');
  };

  const handleRecipeRestore = async (originalRecipe: Recipe & { id: string }) => {
    // Refetch the recipe to ensure we have the latest data
    await fetchRecipe();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!recipe) return <div>Recipe not found</div>;

  return (
    <main className="max-w-2xl mx-auto p-4 mb-20">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleBack}>← Back</Button>
        <div className="flex items-center gap-2">
          <EditRecipeDialog recipe={recipe} onUpdate={handleRecipeUpdate} />
          {recipe.isCustomized && (
            <RestoreRecipeButton 
              recipe={recipe} 
              onRestore={handleRecipeRestore}
            />
          )}
          <LikeButton recipe={recipe} />
        </div>
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
                {recipe?.strInstructions?.split('\n').filter(Boolean).map((step, index) => (
                  <p key={index}>{step}</p>
                )) || <p>No instructions available</p>}
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
    if (!user || !recipe?.id || !db) {
      setLoading(false);
      return;
    }

    const checkIfLiked = async () => {
      console.log('🔍 Checking if recipe is liked:', recipe.id);
      try {
        const docRef = doc(db, 'liked_recipes', recipe.id);
        const docSnap = await getDoc(docRef);
        const liked = docSnap.exists();
        console.log('📊 Recipe liked status:', liked);
        setIsLiked(liked);
      } catch (error) {
        console.error('❌ Error checking like status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkIfLiked();
  }, [recipe?.id, user]);

  const handleLike = async () => {
    console.log('🔄 Like button clicked');
    console.log('Current isLiked state:', isLiked);
    console.log('Recipe data:', recipe);
    
    if (!user) {
      console.log('❌ No user found - redirecting to sign in');
      router.push('/auth/sign-in');
      return;
    }

    setLoading(true);
    try {
      await toggleLike(recipe);
      setIsLiked(!isLiked); // Toggle the local state after successful operation
      console.log('✅ Like operation completed. New isLiked state:', !isLiked);
    } catch (error) {
      console.error('❌ Error in handleLike:', error);
    } finally {
      setLoading(false);
    }
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
