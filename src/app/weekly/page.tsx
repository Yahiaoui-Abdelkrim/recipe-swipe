'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateAndSanitizeRecipe } from '@/lib/recipe-validator';
import type { Recipe } from '@/types/recipe';
import Link from 'next/link';

export default function WeeklyPlan() {
  const [weeklyRecipes, setWeeklyRecipes] = useState<(Recipe & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableRecipes, setAvailableRecipes] = useState<(Recipe & { id: string })[]>([]);

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
        setAvailableRecipes(allRecipes);
        
        if (weeklyRecipes.length === 0) {
          const numRecipes = Math.min(7, allRecipes.length);
          const shuffled = [...allRecipes].sort(() => 0.5 - Math.random());
          setWeeklyRecipes(shuffled.slice(0, numRecipes));
        }
      } catch (error) {
        console.error('Error fetching weekly recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyRecipes();
  }, [weeklyRecipes.length]);

  const handleChangeRecipe = (index: number) => {
    const currentRecipeIds = weeklyRecipes.map(recipe => recipe.id);
    const availableNewRecipes = availableRecipes.filter(
      recipe => !currentRecipeIds.includes(recipe.id)
    );

    if (availableNewRecipes.length === 0) {
      alert('No more unique recipes available to swap!');
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableNewRecipes.length);
    const newRecipe = availableNewRecipes[randomIndex];

    setWeeklyRecipes(prev => {
      const updated = [...prev];
      updated[index] = newRecipe;
      return updated;
    });
  };

  const downloadIngredientsList = () => {
    let content = 'Weekly Meal Plan - Shopping List\n\n';

    weeklyRecipes.forEach((recipe, index) => {
      content += `${daysOfWeek[index]} - ${recipe.strMeal}\n`;
      content += '----------------------------------------\n';
      
      if (recipe.ingredients && recipe.measures) {
        recipe.ingredients.forEach((ingredient, i) => {
          if (ingredient && ingredient.trim()) {
            const measure = recipe.measures[i] || '';
            content += `• ${measure} ${ingredient}\n`;
          }
        });
      }
      content += '\n';
    });

    // Create and trigger download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'shopping_list.txt';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <main className="max-w-4xl mx-auto p-4 mb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Weekly Meal Plan</h1>
        <Button 
          onClick={downloadIngredientsList}
          variant="outline"
          className="whitespace-nowrap"
        >
          Download Shopping List
        </Button>
      </div>
      <div className="space-y-4">
        {weeklyRecipes.map((recipe, index) => (
          <div key={recipe.id} className="relative">
            <Link href={`/recipe/${recipe.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center gap-4">
                    <span>{daysOfWeek[index]}</span>
                    <span className="text-xl flex-1 text-right">{recipe.strMeal}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 ml-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleChangeRecipe(index);
                      }}
                    >
                      Change Recipe
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <img 
                      src={recipe.strMealThumb} 
                      alt={recipe.strMeal}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
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
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}