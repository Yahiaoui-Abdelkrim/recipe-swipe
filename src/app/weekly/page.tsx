'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, doc, setDoc, getDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateAndSanitizeRecipe } from '@/lib/recipe-validator';
import type { Recipe } from '@/types/recipe';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useToast as useShadcnToast } from '@/components/ui/use-toast';
import toast from 'react-hot-toast';

export default function WeeklyPlan() {
  const { user } = useAuth();
  const { toast: shadowToast } = useShadcnToast();
  const [weeklyRecipes, setWeeklyRecipes] = useState<(Recipe & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableRecipes, setAvailableRecipes] = useState<(Recipe & { id: string })[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0); // 0 is current week
  const [isValidated, setIsValidated] = useState(false);
  const [weeklyPlans, setWeeklyPlans] = useState<{
    [key: number]: (Recipe & { id: string })[];
  }>({});

  const fetchWeeklyRecipes = useCallback(async () => {
    if (!user) return;
    
    try {
      // First, try to fetch existing weekly plan
      const weeklyPlanRef = doc(db, 'weekly_plans', `${user.uid}_${currentWeek}`);
      const weeklyPlanDoc = await getDoc(weeklyPlanRef);
      
      if (weeklyPlanDoc.exists()) {
        const planData = weeklyPlanDoc.data();
        setWeeklyRecipes(planData.recipes);
        setWeeklyPlans(prev => ({
          ...prev,
          [currentWeek]: planData.recipes
        }));
        setIsValidated(planData.isValidated || false);
      } else {
        // If no existing plan, fetch from liked recipes
        const querySnapshot = await getDocs(
          query(
            collection(db, 'liked_recipes'),
            where('userId', '==', user.uid)
          )
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
        
        // Initialize current week if not already set
        if (!weeklyPlans[currentWeek]) {
          const numRecipes = Math.min(7, allRecipes.length);
          const shuffled = [...allRecipes].sort(() => 0.5 - Math.random());
          const initialPlan = shuffled.slice(0, numRecipes);
          setWeeklyPlans(prev => ({
            ...prev,
            [currentWeek]: initialPlan
          }));
          setWeeklyRecipes(initialPlan);
        }
      }
    } catch (error) {
      console.error('Error fetching weekly recipes:', error);
      shadowToast({
        title: "Error",
        description: "Failed to load weekly plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, currentWeek, weeklyPlans, shadowToast]);

  useEffect(() => {
    fetchWeeklyRecipes();
  }, [fetchWeeklyRecipes]);

  const handleChangeRecipe = (index: number) => {
    console.log('🔄 Starting recipe change for index:', index);
    
    if (isValidated) {
      console.log('❌ Cannot change recipe - plan is validated');
      return;
    }
    
    console.log('📊 Current recipes:', {
      total: weeklyRecipes.length,
      available: availableRecipes.length,
      currentIds: weeklyRecipes.map(r => r.id)
    });
    
    const currentRecipeIds = weeklyRecipes.map(recipe => recipe.id);
    const availableNewRecipes = availableRecipes.filter(
      recipe => !currentRecipeIds.includes(recipe.id)
    );

    console.log('📊 Available new recipes:', availableNewRecipes.length);

    if (availableNewRecipes.length === 0) {
      console.log('❌ No more recipes available to swap');
      toast.error('No more unique recipes available to swap!');
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableNewRecipes.length);
    const newRecipe = availableNewRecipes[randomIndex];
    console.log('✅ Selected new recipe:', newRecipe.id, newRecipe.strMeal);

    const updatedRecipes = [...weeklyRecipes];
    updatedRecipes[index] = newRecipe;
    
    setWeeklyRecipes(updatedRecipes);
    setWeeklyPlans(prev => ({
      ...prev,
      [currentWeek]: updatedRecipes
    }));
    console.log('✅ Recipe change completed');
  };

  const handleValidateWeeklyPlan = async () => {
    console.log('🔄 Starting weekly plan validation');
    if (!user) {
      console.log('❌ No user found during validation');
      shadowToast({
        title: "Authentication Required",
        description: "Please sign in to save your weekly plan.",
        variant: "destructive"
      });
      return;
    }

    console.log('📊 Current weekly recipes count:', weeklyRecipes.length);
    if (weeklyRecipes.length !== 7) {
      console.log('❌ Invalid recipe count:', weeklyRecipes.length);
      shadowToast({
        title: "Validation Error",
        description: "Your weekly plan must have 7 recipes to be validated!",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('💾 Saving weekly plan to Firestore');
      const weeklyPlanRef = doc(db, 'weekly_plans', `${user.uid}_${currentWeek}`);
      await setDoc(weeklyPlanRef, {
        userId: user.uid,
        week: currentWeek,
        recipes: weeklyRecipes,
        isValidated: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('✅ Weekly plan saved successfully');
      setIsValidated(true);
      toast.success('Weekly plan has been saved successfully!');
    } catch (error) {
      console.error('❌ Error saving weekly plan:', error);
      toast.error('Failed to save weekly plan. Please try again.');
    }
  };

  const handleEditPlan = async () => {
    if (!user) return;

    try {
      // Update the plan in Firestore to mark as not validated
      const weeklyPlanRef = doc(db, 'weekly_plans', `${user.uid}_${currentWeek}`);
      await setDoc(weeklyPlanRef, {
        userId: user.uid,
        week: currentWeek,
        recipes: weeklyRecipes,
        isValidated: false,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setIsValidated(false);
      toast.success('Weekly plan is now editable.');
    } catch (error) {
      console.error('Error updating weekly plan:', error);
      toast.error('Failed to update weekly plan. Please try again.');
    }
  };

  const navigateWeek = async (direction: 'prev' | 'next') => {
    if (!user) return;

    const newWeek = direction === 'prev' ? currentWeek - 1 : currentWeek + 1;
    setCurrentWeek(newWeek);
    
    try {
      // Try to load the plan for the new week from Firestore
      const weeklyPlanRef = doc(db, 'weekly_plans', `${user.uid}_${newWeek}`);
      const weeklyPlanDoc = await getDoc(weeklyPlanRef);
      
      if (weeklyPlanDoc.exists()) {
        const planData = weeklyPlanDoc.data();
        setWeeklyRecipes(planData.recipes);
        setWeeklyPlans(prev => ({
          ...prev,
          [newWeek]: planData.recipes
        }));
        setIsValidated(planData.isValidated || false);
      } else {
        // If no existing plan, generate a new one
        const numRecipes = Math.min(7, availableRecipes.length);
        const shuffled = [...availableRecipes].sort(() => 0.5 - Math.random());
        const newPlan = shuffled.slice(0, numRecipes);
        setWeeklyPlans(prev => ({
          ...prev,
          [newWeek]: newPlan
        }));
        setWeeklyRecipes(newPlan);
        setIsValidated(false);
      }
    } catch (error) {
      console.error('Error navigating to new week:', error);
      toast.error('Failed to load weekly plan. Please try again.');
    }
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
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Weekly Meal Plan</h1>
        </div>
        
        <div className="flex justify-between items-center py-2">
          <Button
            onClick={() => navigateWeek('prev')}
            variant="outline"
            className="w-[100px]"
          >
            ← Previous
          </Button>
          <div className="text-center">
            <span className="font-medium">
              {currentWeek === 0 ? 'Current Week' : 
               currentWeek < 0 ? `${Math.abs(currentWeek)} ${Math.abs(currentWeek) === 1 ? 'Week' : 'Weeks'} Ago` :
               `${currentWeek} ${currentWeek === 1 ? 'Week' : 'Weeks'} Ahead`}
            </span>
          </div>
          <Button
            onClick={() => navigateWeek('next')}
            variant="outline"
            className="w-[100px]"
          >
            Next →
          </Button>
        </div>
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
                    {!isValidated && (
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
                    )}
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

      <div className="mt-8 flex flex-col items-center gap-4">
        {isValidated ? (
          <>
            <div className="text-green-600 font-medium">
              Your weekly plan is verified! ✓
            </div>
            <div className="flex gap-4">
              <Button onClick={handleEditPlan}>
                Edit Plan
              </Button>
              <Button 
                onClick={downloadIngredientsList}
                variant="outline"
              >
                Download Shopping List
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={handleValidateWeeklyPlan}>
            Validate Weekly Plan
          </Button>
        )}
      </div>
    </main>
  );
}