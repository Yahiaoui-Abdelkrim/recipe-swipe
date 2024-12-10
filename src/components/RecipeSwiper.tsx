'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRandomRecipe } from '@/lib/mealdb';
import type { Recipe } from '@/types/recipe';
import { useAuth } from '@/lib/auth';
import { toggleLike } from '@/utils/likeUtils';
import { useRouter } from 'next/navigation';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { RecipeIcon } from '@/components/ui/recipe-icon';

export function RecipeSwiper() {
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
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

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (!user) {
      router.push('/auth/sign-in');
      return;
    }

    try {
      await toggleLike(currentRecipe!);
      fetchNewRecipe();
    } catch (error) {
      console.error('Error liking recipe:', error);
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    fetchNewRecipe();
  };

  if (loading || !currentRecipe) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRecipe.id}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Link href={`/recipe/${currentRecipe.id}`}>
            <Card className="w-full cursor-pointer hover:shadow-lg transition-shadow relative">
              <CardContent className="p-4">
                <div className="aspect-video relative overflow-hidden rounded-lg mb-3">
                  <div className="relative w-full h-full">
                    <img
                      src={currentRecipe.strMealThumb || '/recipe-placeholder.jpg'}
                      alt={currentRecipe.strMeal}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = '/recipe-placeholder.jpg';
                      }}
                    />
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-background hover:bg-background/90 w-12 h-12 rounded-full"
                      onClick={handleSkip}
                    >
                      <ThumbsDown className="h-6 w-6" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-background hover:bg-background/90 w-12 h-12 rounded-full"
                      onClick={handleLike}
                    >
                      <ThumbsUp className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-1">{currentRecipe.strMeal}</h2>
                <p className="text-sm text-muted-foreground">{currentRecipe.strCategory} • {currentRecipe.strArea}</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}