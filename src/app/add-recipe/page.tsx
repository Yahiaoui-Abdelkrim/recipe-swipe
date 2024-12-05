'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { validateAndSanitizeRecipe } from '@/lib/recipe-validator';
import { nanoid } from 'nanoid';

export default function AddRecipe() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [recipe, setRecipe] = useState({
    strMeal: '',
    strCategory: '',
    strArea: 'Custom',
    strInstructions: '',
    strMealThumb: '',
    strSocialMediaLink: '',
    ingredients: [''],
    measures: [''],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRecipe(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIngredientChange = (index: number, value: string, type: 'ingredient' | 'measure') => {
    setRecipe(prev => {
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
    setRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, ''],
      measures: [...prev.measures, ''],
    }));
  };

  const removeIngredient = (index: number) => {
    setRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
      measures: prev.measures.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const recipeId = nanoid();
      const validationResult = validateAndSanitizeRecipe(recipeId, recipe);

      if (!validationResult.isValid) {
        setError(`Missing required fields: ${validationResult.missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      // If no image URL is provided, use a default recipe image
      if (!recipe.strMealThumb) {
        recipe.strMealThumb = 'https://www.themealdb.com/images/media/meals/default.jpg';
      }

      await setDoc(doc(db, 'liked_recipes', recipeId), recipe);
      router.push('/liked');
    } catch (err) {
      setError('Failed to save recipe. Please try again.');
      console.error('Error saving recipe:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-4 mb-20">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Recipe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="strMeal">Recipe Name *</Label>
              <Input
                id="strMeal"
                name="strMeal"
                value={recipe.strMeal}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strCategory">Category *</Label>
              <Input
                id="strCategory"
                name="strCategory"
                value={recipe.strCategory}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strMealThumb">Image URL</Label>
              <Input
                id="strMealThumb"
                name="strMealThumb"
                value={recipe.strMealThumb}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strSocialMediaLink">Social Media Link (Optional)</Label>
              <Input
                id="strSocialMediaLink"
                name="strSocialMediaLink"
                value={recipe.strSocialMediaLink}
                onChange={handleInputChange}
                placeholder="YouTube or Instagram link"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strInstructions">Instructions *</Label>
              <Textarea
                id="strInstructions"
                name="strInstructions"
                value={recipe.strInstructions}
                onChange={handleInputChange}
                required
                className="min-h-[150px]"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ingredients</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                >
                  Add Ingredient
                </Button>
              </div>
              
              {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      value={ingredient}
                      onChange={(e) => handleIngredientChange(index, e.target.value, 'ingredient')}
                      placeholder="Ingredient"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      value={recipe.measures[index]}
                      onChange={(e) => handleIngredientChange(index, e.target.value, 'measure')}
                      placeholder="Amount"
                    />
                  </div>
                  {recipe.ingredients.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Recipe'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
