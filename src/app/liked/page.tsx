'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateAndSanitizeRecipe } from '@/lib/recipe-validator';
import { cleanupInvalidRecipes } from '@/lib/db-cleanup';
import type { Recipe } from '@/types/recipe';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';

export default function LikedPage() {
  return (
    <ProtectedRoute>
      <LikedRecipes />
    </ProtectedRoute>
  );
}

function LikedRecipes() {
  const [recipes, setRecipes] = useState<(Recipe & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const { user } = useAuth();

  // Calculate pagination values
  const totalPages = Math.ceil(recipes.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRecipes = recipes.slice(startIndex, endIndex);

  // Reset to first page when pageSize changes
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    // If current page is greater than total pages, set it to last page
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const fetchLikedRecipes = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 Fetching liked recipes for user:', user.uid);
      const q = query(
        collection(db, 'liked_recipes'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('📊 Found liked recipes:', querySnapshot.size);
      const recipesMap = new Map();

      querySnapshot.docs.forEach(doc => {
        const validationResult = validateAndSanitizeRecipe(doc.id, doc.data());
        
        // Always use the sanitized recipe if available, even if it's invalid
        if (validationResult.sanitizedRecipe) {
          recipesMap.set(validationResult.sanitizedRecipe.id, validationResult.sanitizedRecipe);
        }

        // Log validation issues for debugging
        if (!validationResult.isValid) {
          console.warn(
            `Recipe document ${doc.id} has validation issues:`,
            validationResult.missingFields.join(', ')
          );
        }
      });

      // Sort recipes by likedAt date after fetching
      const recipesList = Array.from(recipesMap.values());
      recipesList.sort((a, b) => {
        return new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime();
      });

      setRecipes(recipesList);
    } catch (error) {
      console.error('❌ Error fetching liked recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedRecipes();
  }, [user]);

  const handleCleanup = async () => {
    if (cleaning) return;
    
    setCleaning(true);
    try {
      const results = await cleanupInvalidRecipes();
      console.log('Cleanup completed:', results);
      // Refresh the recipes list after cleanup
      await fetchLikedRecipes();
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      setCleaning(false);
    }
  };

  const handleDelete = async (recipeId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (window.confirm('Are you sure you want to remove this recipe?')) {
      try {
        await deleteDoc(doc(db, 'liked_recipes', recipeId));
        setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
      } catch (error) {
        console.error('Error deleting recipe:', error);
      }
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <main className="max-w-4xl mx-auto p-4 mb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Liked Recipes</h1>
        <div className="flex gap-2 items-center">
          <select
            className="px-3 py-2 border rounded-md bg-background"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            <option value="6">6 per page</option>
            <option value="9">9 per page</option>
            <option value="12">12 per page</option>
            <option value="15">15 per page</option>
          </select>
          <Button 
            onClick={handleCleanup} 
            disabled={cleaning}
            variant="outline"
          >
            {cleaning ? 'Cleaning...' : 'Clean Invalid Recipes'}
          </Button>
          <Button onClick={() => window.location.href = '/add-recipe'}>
            Add Recipe
          </Button>
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center mt-8">No liked recipes yet</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentRecipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col group relative">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => handleDelete(recipe.id, e)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </Button>
                  <CardHeader className="flex-none">
                    <CardTitle className="text-xl leading-tight min-h-[3rem] line-clamp-2">
                      {recipe.strMeal}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="aspect-video relative overflow-hidden rounded-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={recipe.strMealThumb}
                        alt={recipe.strMeal}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {recipe.strCategory} • {recipe.strArea}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, recipes.length)} of {recipes.length} recipes
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                size="sm"
              >
                First
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                size="sm"
              >
                Previous
              </Button>
              <div className="flex items-center gap-2 px-4">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                size="sm"
              >
                Next
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                size="sm"
              >
                Last
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}