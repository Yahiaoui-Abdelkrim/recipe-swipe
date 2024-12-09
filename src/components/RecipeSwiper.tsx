'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRandomRecipe } from '@/lib/mealdb';
import type { Recipe } from '@/types/recipe';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { toggleLike } from '@/utils/likeUtils';
import { useRouter } from 'next/navigation';

export function RecipeSwiper() {
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const fetchNewRecipe = async () => {
    setLoading(true);
    try {
      const recipe = await getRandomRecipe();
      setCurrentRecipe(recipe);
    } catch (error) {
      console.error('Error fetching recipe:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNewRecipe();
  }, []);

  const handleLike = async (recipe: Recipe) => {
    console.log('🔄 Like button clicked for recipe:', recipe.strMeal);
    if (!user) {
      console.log('❌ No user found - redirecting to sign in');
      router.push('/auth/sign-in');
      return;
    }

    try {
      await toggleLike(recipe);
      // Fetch new recipe after successful like/unlike
      fetchNewRecipe();
    } catch (error) {
      console.error('❌ Error in handleLike:', error);
    }
  };

  const handleSkip = () => {
    fetchNewRecipe();
  };

  if (loading || !currentRecipe) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto mb-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRecipe.id}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="aspect-square relative overflow-hidden rounded-lg mb-4">
                <img
                  src={currentRecipe.strMealThumb}
                  alt={currentRecipe.strMeal}
                  className="object-cover w-full h-full"
                />
              </div>
              <h2 className="text-2xl font-bold mb-2">{currentRecipe.strMeal}</h2>
              <p className="text-sm text-gray-500 mb-4">{currentRecipe.strCategory}</p>
              
              <div className="flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleSkip}
                  className="w-24"
                >
                  Skip
                </Button>
                <Button 
                  onClick={() => handleLike(currentRecipe)}
                  className="w-24"
                >
                  Like
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}