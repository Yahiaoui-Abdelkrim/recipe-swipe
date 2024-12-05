'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRandomRecipe } from '@/lib/mealdb';
import type { Recipe } from '@/types/recipe';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';

export function RecipeSwiper() {
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

  const handleLike = async () => {
    if (currentRecipe && user) {
      try {
        // Ensure all required fields are present and properly formatted
        const recipeToSave = {
          id: currentRecipe.id,
          userId: user.uid,  // Add user ID to the recipe
          strMeal: currentRecipe.strMeal,
          strCategory: currentRecipe.strCategory,
          strInstructions: currentRecipe.strInstructions,
          strMealThumb: currentRecipe.strMealThumb,
          strArea: currentRecipe.strArea || '',
          ingredients: currentRecipe.ingredients || [],
          measures: currentRecipe.measures || [],
          likedAt: new Date().toISOString(), // Store as ISO string for consistency
        };
        
        // Validate required fields before saving
        if (!recipeToSave.strMeal || !recipeToSave.strCategory || 
            !recipeToSave.strInstructions || !recipeToSave.strMealThumb) {
          console.error('Missing required fields in recipe:', recipeToSave);
          return;
        }
        
        await addDoc(collection(db, 'liked_recipes'), recipeToSave);
        fetchNewRecipe();
      } catch (error) {
        console.error('Error saving recipe:', error);
      }
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
                  onClick={handleLike}
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