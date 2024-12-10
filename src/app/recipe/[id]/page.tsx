'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateAndSanitizeRecipe } from '@/lib/recipe-validator';
import { getRecipeById } from '@/lib/mealdb';
import type { Recipe } from '@/types/recipe';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useNavigation } from '@/contexts/NavigationContext';
import { EditRecipeDialog } from '@/components/EditRecipeDialog';
import { RestoreRecipeButton } from '@/components/RestoreRecipeButton';
import { toggleLike } from '@/utils/likeUtils';
import { use } from 'react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';

interface RecipeDetailsProps {
  params: Promise<{ id: string }>;
}

function RecipeContent({ id }: { id: string }) {
  const [recipe, setRecipe] = useState<(Recipe & { id: string; isCustomized?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { previousPath } = useNavigation();
  const { toast } = useToast();

  const handleBack = () => {
    router.push(previousPath);
  };

  const fetchRecipe = useCallback(async () => {
    if (!id) return;
    
    try {
      console.log('Fetching recipe details:', id);
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
            console.log('Found customized recipe');
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
            console.log('Found liked recipe');
            setRecipe({
              ...validationResult.sanitizedRecipe,
              isCustomized: false
            });
            return;
          }
        }
      }

      // If not found in either collection, try MealDB
      console.log('Fetching from MealDB');
      const mealDbRecipe = await getRecipeById(id);
      if (mealDbRecipe) {
        console.log('Found recipe in MealDB');
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
  }, [id]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  const handleRecipeUpdate = async (updatedRecipe: Recipe & { id: string }) => {
    setRecipe(updatedRecipe);
    toast({
      title: "Success",
      description: "Recipe updated successfully",
    });
  };

  const handleRecipeRestore = async () => {
    await fetchRecipe();
    toast({
      title: "Success",
      description: "Recipe restored to original version",
    });
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
            <div className="relative w-full h-full">
              {recipe.strMealThumb && recipe.strMealThumb.startsWith('http') ? (
                <Image
                  src={recipe.strMealThumb}
                  alt={recipe.strMeal}
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/recipe-placeholder.jpg';
                  }}
                />
              ) : (
                <Image
                  src="/recipe-placeholder.jpg"
                  alt={recipe.strMeal}
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
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
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    
    if (!user || !recipe?.id || !db) {
      console.log('No user or recipe ID, or DB not initialized');
      setLoading(false);
      return;
    }

    const checkIfLiked = async () => {
      try {
        console.log('Checking if recipe is liked:', recipe.id);
        const docRef = doc(db, 'liked_recipes', recipe.id);
        const docSnap = await getDoc(docRef);
        if (mounted) {
          const liked = docSnap.exists();
          console.log('Recipe liked status:', liked);
          setIsLiked(liked);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkIfLiked();
    return () => { mounted = false; };
  }, [recipe?.id, user]);

  const handleLike = async () => {
    if (!user) {
      router.push('/auth/sign-in');
      return;
    }

    setLoading(true);
    try {
      console.log('Toggling like for recipe:', recipe.id);
      await toggleLike(recipe);
      const newLikeState = !isLiked;
      setIsLiked(newLikeState);
      console.log('Like state updated:', newLikeState);
      
      toast({
        title: newLikeState ? "Recipe Added" : "Recipe Removed",
        description: newLikeState 
          ? "Recipe added to your liked recipes" 
          : "Recipe removed from your liked recipes",
        variant: newLikeState ? "default" : "destructive",
      });
      console.log('Toast notification sent');
    } catch (error) {
      console.error('Error in handleLike:', error);
      toast({
        title: "Error",
        description: "Failed to update recipe like status",
        variant: "destructive",
      });
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
      <Heart className={isLiked ? "fill-current text-foreground" : ""} />
    </Button>
  );
}

export default function RecipeDetails({ params }: RecipeDetailsProps) {
  const resolvedParams = use(params);
  return <RecipeContent id={resolvedParams.id} />;
}
