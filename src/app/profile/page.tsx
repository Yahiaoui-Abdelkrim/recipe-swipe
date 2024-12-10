'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Recipe } from '@/types/recipe';
import { validateAndSanitizeRecipe } from '@/lib/recipe-validator';
import { User } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<(Recipe & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecipes: 0,
    favoriteCategory: '',
    lastAdded: '',
  });

  useEffect(() => {
    const fetchUserRecipes = async () => {
      if (!user) return;

      try {
        const recipesQuery = query(
          collection(db, 'liked_recipes'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(recipesQuery);
        const recipesMap = new Map();
        const categories: { [key: string]: number } = {};
        let lastAddedDate = '';

        querySnapshot.docs.forEach(doc => {
          const validationResult = validateAndSanitizeRecipe(doc.id, doc.data());
          
          if (validationResult.isValid && validationResult.sanitizedRecipe) {
            const recipe = validationResult.sanitizedRecipe;
            recipesMap.set(recipe.id, recipe);
            
            // Track categories for stats
            categories[recipe.strCategory] = (categories[recipe.strCategory] || 0) + 1;
            
            // Track last added date
            const recipeDate = recipe.likedAt || '';
            if (!lastAddedDate || (recipeDate && recipeDate > lastAddedDate)) {
              lastAddedDate = recipeDate;
            }
          }
        });

        const recipesList = Array.from(recipesMap.values());
        setRecipes(recipesList);

        // Calculate favorite category
        const favoriteCategory = Object.entries(categories).reduce(
          (max, [category, count]) => 
            count > (max.count || 0) ? { category, count } : max,
          { category: '', count: 0 }
        ).category;

        setStats({
          totalRecipes: recipesList.length,
          favoriteCategory,
          lastAdded: lastAddedDate ? new Date(lastAddedDate).toLocaleDateString() : 'N/A',
        });
      } catch (error) {
        console.error('Error fetching user recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRecipes();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="mb-4">Please sign in to view your profile</p>
              <Link href="/auth/sign-in">
                <Button>Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <main className="max-w-4xl mx-auto p-4 mb-20">
      <div className="grid gap-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    width={96}
                    height={96}
                    className="object-cover"
                    priority
                  />
                ) : (
                  <User className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.displayName || 'User'}</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Total Recipes</h3>
              <p className="text-3xl font-bold">{stats.totalRecipes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Favorite Category</h3>
              <p className="text-3xl font-bold">{stats.favoriteCategory || 'N/A'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Last Recipe Added</h3>
              <p className="text-lg">{stats.lastAdded}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Recipes */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Recipes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {recipes.slice(0, 3).map((recipe) => (
                <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-4">
                      <div className="aspect-video relative overflow-hidden rounded-md mb-2">
                        <img
                          src={recipe.strMealThumb}
                          alt={recipe.strMeal}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <h3 className="font-semibold line-clamp-2">{recipe.strMeal}</h3>
                      <p className="text-sm text-muted-foreground">
                        {recipe.strCategory}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
