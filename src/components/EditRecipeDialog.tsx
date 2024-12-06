'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { Recipe } from '@/types/recipe';
import { validateAndSanitizeRecipe } from '@/lib/recipe-validator';
import { useAuth } from '@/lib/auth';

interface EditRecipeDialogProps {
  recipe: Recipe & { id: string };
  onUpdate: (updatedRecipe: Recipe & { id: string }) => void;
}

export function EditRecipeDialog({ recipe, onUpdate }: EditRecipeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState(recipe);
  const { toast } = useToast();
  const { user } = useAuth();

  // Update editedRecipe when recipe prop changes or dialog opens
  useEffect(() => {
    setEditedRecipe(recipe);
  }, [recipe, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedRecipe(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIngredientChange = (index: number, value: string, type: 'ingredient' | 'measure') => {
    setEditedRecipe(prev => {
      const newRecipe = { ...prev };
      if (type === 'ingredient') {
        const newIngredients = [...prev.ingredients];
        newIngredients[index] = value;
        newRecipe.ingredients = newIngredients;
      } else {
        const newMeasures = [...prev.measures];
        newMeasures[index] = value;
        newRecipe.measures = newMeasures;
      }
      return newRecipe;
    });
  };

  const addIngredient = () => {
    setEditedRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, ''],
      measures: [...prev.measures, ''],
    }));
  };

  const removeIngredient = (index: number) => {
    setEditedRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
      measures: prev.measures.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const recipeToSave = {
        ...editedRecipe,
        userId: user.uid,
        isCustomized: true,
        originalRecipeId: recipe.id,
        updatedAt: new Date().toISOString(),
      };

      const validationResult = validateAndSanitizeRecipe(recipe.id, recipeToSave);
      if (!validationResult.isValid || !validationResult.sanitizedRecipe) {
        toast({
          title: "Validation Error",
          description: `Missing required fields: ${validationResult.missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // Save to user_recipes collection
      await setDoc(doc(db, 'user_recipes', recipe.id), validationResult.sanitizedRecipe);
      
      // Make sure we pass isCustomized flag to trigger UI update
      onUpdate({
        ...validationResult.sanitizedRecipe,
        isCustomized: true
      });
      setOpen(false);
      
      toast({
        title: "Success",
        description: "Recipe updated successfully!",
      });
    } catch (error) {
      console.error('Error updating recipe:', error);
      toast({
        title: "Error",
        description: "Failed to update recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Recipe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="strMeal">Recipe Name *</Label>
            <Input
              id="strMeal"
              name="strMeal"
              value={editedRecipe.strMeal}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strCategory">Category *</Label>
            <Input
              id="strCategory"
              name="strCategory"
              value={editedRecipe.strCategory}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strArea">Cuisine</Label>
            <Input
              id="strArea"
              name="strArea"
              value={editedRecipe.strArea}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strMealThumb">Image URL</Label>
            <Input
              id="strMealThumb"
              name="strMealThumb"
              value={editedRecipe.strMealThumb}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label>Ingredients</Label>
            {editedRecipe.ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Amount"
                  value={editedRecipe.measures[index]}
                  onChange={(e) => handleIngredientChange(index, e.target.value, 'measure')}
                  className="w-1/3"
                />
                <Input
                  placeholder="Ingredient"
                  value={ingredient}
                  onChange={(e) => handleIngredientChange(index, e.target.value, 'ingredient')}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeIngredient(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addIngredient}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="strInstructions">Instructions *</Label>
            <textarea
              id="strInstructions"
              name="strInstructions"
              value={editedRecipe.strInstructions}
              onChange={handleInputChange}
              required
              className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strSocialMediaLink">Social Media Link (Optional)</Label>
            <Input
              id="strSocialMediaLink"
              name="strSocialMediaLink"
              value={editedRecipe.strSocialMediaLink || ''}
              onChange={handleInputChange}
              placeholder="YouTube or Instagram link"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
