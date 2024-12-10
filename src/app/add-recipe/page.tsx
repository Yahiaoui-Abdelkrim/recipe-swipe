'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { validateAndSanitizeRecipe } from '@/lib/recipe-validator';
import { generateRecipeWithAI, correctRecipeName } from '@/lib/gemini';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';

const CUISINE_TYPES = [
  'American', 'British', 'Chinese', 'French', 'Indian', 'Italian', 'Japanese', 'Mexican', 'Thai', 'Mediterranean'
];

const DIETARY_PREFERENCES = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low-Carb', 'Paleo'
];

// Add type for the select value
type SelectValue = string;

export default function AddRecipe() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  
  const [recipe, setRecipe] = useState({
    strMeal: '',
    strCategory: '',
    strArea: 'Custom',
    strInstructions: '',
    strMealThumb: '/recipe-placeholder.jpg',
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

  const handleGenerateRecipe = async () => {
    if (!recipe.strMeal.trim()) {
      setError('Please enter a recipe name first');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      // First correct the recipe name
      const correctedName = await correctRecipeName(recipe.strMeal);
      
      // Update the recipe name in the form
      setRecipe(prev => ({
        ...prev,
        strMeal: correctedName
      }));

      // Generate the recipe with corrected name
      const generatedRecipe = await generateRecipeWithAI({
        recipeName: correctedName,
        dietaryPreferences: selectedDiets,
        cuisineType: selectedCuisine,
        shouldSave: false,
      });

      setRecipe(prev => ({
        ...prev,
        ...generatedRecipe,
      }));
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to generate recipe. Please try again or fill in the details manually.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/sign-in');
      return;
    }

    setLoading(true);
    try {
      const recipeId = crypto.randomUUID();
      const validationResult = validateAndSanitizeRecipe(recipeId, {
        ...recipe,
        userId: user.uid,
      });

      if (!validationResult.isValid) {
        toast({
          title: "Validation Error",
          description: `Missing required fields: ${validationResult.missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      if (validationResult.sanitizedRecipe) {
        const docRef = doc(db, 'user_recipes', recipeId);
        await setDoc(docRef, validationResult.sanitizedRecipe);
        
        toast({
          title: "Success",
          description: "Recipe added successfully",
        });
        
        router.push(`/recipe/${recipeId}`);
      }
    } catch (error) {
      console.error('Error adding recipe:', error);
      toast({
        title: "Error",
        description: "Failed to add recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update the onValueChange handler with proper typing
  const handleDietaryChange = (value: SelectValue) => {
    setSelectedDiets(value ? [value] : []);
  };

  return (
    <main className="max-w-2xl mx-auto p-4 mb-20">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Recipe</CardTitle>
          <CardDescription>
            You can use AI to automatically generate recipe details by entering a recipe name and optionally selecting dietary preferences and cuisine type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="strMeal">Recipe Name *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="strMeal"
                    name="strMeal"
                    value={recipe.strMeal}
                    onChange={handleInputChange}
                    required
                    className="pr-8"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleGenerateRecipe}
                  disabled={generating || !recipe.strMeal.trim()}
                  className="flex items-center gap-2"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate with AI
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cuisine Type (Optional)</Label>
                <Select
                  value={selectedCuisine}
                  onValueChange={setSelectedCuisine}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    {CUISINE_TYPES.map(cuisine => (
                      <SelectItem key={cuisine} value={cuisine}>
                        {cuisine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dietary Preferences (Optional)</Label>
                <Select
                  value={selectedDiets[0] || ''}
                  onValueChange={handleDietaryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select diet" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIETARY_PREFERENCES.map(diet => (
                      <SelectItem key={diet} value={diet}>
                        {diet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                disabled={loading || generating}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || generating}
                className="min-w-[120px]"
              >
                {loading ? 'Saving...' : 'Save Recipe'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
