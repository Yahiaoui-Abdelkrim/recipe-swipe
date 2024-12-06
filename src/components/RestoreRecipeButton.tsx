'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { getRecipeById } from '@/lib/mealdb';
import type { Recipe } from '@/types/recipe';

interface RestoreRecipeButtonProps {
  recipe: Recipe & { id: string };
  onRestore: (originalRecipe: Recipe & { id: string }) => void;
}

export function RestoreRecipeButton({ recipe, onRestore }: RestoreRecipeButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRestore = async () => {
    setLoading(true);
    try {
      // Delete the customized version from user_recipes
      await deleteDoc(doc(db, 'user_recipes', recipe.id));
      
      // Get the original recipe from liked_recipes or MealDB
      const likedRef = doc(db, 'liked_recipes', recipe.id);
      const likedSnap = await getDoc(likedRef);
      
      let originalRecipe: Recipe & { id: string };
      
      if (likedSnap.exists()) {
        const docData = likedSnap.data() as Recipe;
        originalRecipe = { ...docData, id: recipe.id };
      } else {
        // Fetch from MealDB if not in liked_recipes
        const mealDbRecipe = await getRecipeById(recipe.id);
        if (!mealDbRecipe) {
          throw new Error('Failed to fetch original recipe');
        }
        originalRecipe = mealDbRecipe;
      }

      onRestore(originalRecipe);
      
      toast({
        title: "Success",
        description: "Recipe restored to original version",
      });
    } catch (error) {
      console.error('Error restoring recipe:', error);
      toast({
        title: "Error",
        description: "Failed to restore recipe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        disabled={loading}
        onClick={() => setOpen(true)}
        className="hover:bg-yellow-50"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore Original Recipe?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove your customized version and restore the original recipe. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            disabled={loading} 
            onClick={handleRestore}
            className="bg-yellow-500 hover:bg-yellow-600"
          >
            {loading ? "Restoring..." : "Restore Original"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
