'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { validateAndSanitizeRecipe } from '@/lib/recipe-validator';
import type { Recipe } from '@/types/recipe';

export default function WeeklyPlan() {
  const [weeklyRecipes, setWeeklyRecipes] = useState<(Recipe & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyRecipes = async () => {
      try {
        const querySnapshot = await getDocs(
          query(collection(db, 'liked_recipes'), orderBy('likedAt', 'desc'))
        );
        
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

        const allRecipes = Array.from(recipesMap.values());
        const numRecipes = Math.min(7, allRecipes.length);
        const shuffled = [...allRecipes].sort(() => 0.5 - Math.random());
        setWeeklyRecipes(shuffled.slice(0, numRecipes));
      } catch (error) {
        console.error('Error fetching weekly recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyRecipes();
  }, []);

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <main className="max-w-4xl mx-auto p-4 mb-20">
      <h1 className="text-3xl font-bold mb-6">Weekly Meal Plan</h1>
      <div className="space-y-4">
        {weeklyRecipes.map((recipe, index) => (
          <Card key={recipe.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{daysOfWeek[index]}</span>
                <span className="text-xl">{recipe.strMeal}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <img 
                src={recipe.strMealThumb} 
                alt={recipe.strMeal}
                className="w-32 h-32 object-cover rounded-md"
              />
              <div>
                <p className="text-sm text-muted-foreground">
                  Category: {recipe.strCategory}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Area: {recipe.strArea}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}