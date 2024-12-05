'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateAndSanitizeRecipe } from '@/lib/recipe-validator';
import { cleanupInvalidRecipes } from '@/lib/db-cleanup';
import type { Recipe } from '@/types/recipe';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

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
    try {
      const querySnapshot = await getDocs(collection(db, 'liked_recipes'));
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

      setRecipes(Array.from(recipesMap.values()));
    } catch (error) {
      console.error('Error fetching liked recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedRecipes();
  }, []);

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
                <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col">
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