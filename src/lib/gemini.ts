import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import { nanoid } from 'nanoid';

const GEMINI_API_KEY = 'AIzaSyBOjzbNRYygDQojfQOVgNjdc34y2wEdNfI';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

interface GenerateRecipeParams {
  recipeName: string;
  dietaryPreferences?: string[];
  cuisineType?: string;
  shouldSave?: boolean;
}

export async function correctRecipeName(name: string): Promise<string> {
  const prompt = `You are a culinary expert. Please correct the spelling and formatting of this recipe name: "${name}". 
  Consider:
  1. Common recipe name misspellings (e.g., "futtucini" → "fettuccine")
  2. Proper capitalization (e.g., "pad thai" → "Pad Thai")
  3. Traditional spellings (e.g., "curry puff" → "Karipap")
  4. Regional variations (e.g., "expresso" → "Espresso")

  Return ONLY the corrected name, nothing else. If the name is already correct, return it as is.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Failed to correct recipe name');
      return name;
    }

    const data = await response.json();
    const correctedName = data.candidates[0].content.parts[0].text.trim();
    
    // If the AI returns a long explanation instead of just the name, return the original
    if (correctedName.split(' ').length > 10) {
      return name;
    }

    return correctedName;
  } catch (error) {
    console.error('Error correcting recipe name:', error);
    return name;
  }
}

export async function generateRecipeWithAI({
  recipeName,
  dietaryPreferences = [],
  cuisineType,
  shouldSave = false,
}: GenerateRecipeParams) {
  const prompt = `Generate a detailed recipe for "${recipeName}"${
    cuisineType ? ` in ${cuisineType} cuisine style` : ''
  }${
    dietaryPreferences.length > 0
      ? ` that is suitable for ${dietaryPreferences.join(', ')} diets`
      : ''
  }.

Please provide the response in the following JSON format:
{
  "strCategory": "Main category of the dish (e.g., Beef, Chicken, Vegetarian, Dessert)",
  "strArea": "Cuisine origin or area",
  "strInstructions": "Detailed step-by-step cooking instructions",
  "ingredients": ["List of ingredients"],
  "measures": ["List of measurements corresponding to ingredients"],
  "strMealThumb": "A URL to a high-quality, appetizing image of this dish. Please suggest a real, existing image URL from a major recipe website or food blog that shows a similar dish. The image should be in landscape orientation and have good lighting."
}

Make sure:
1. The ingredients and measures arrays have matching lengths and correspond to each other
2. The image URL is from a reputable source and shows a similar dish
3. The image URL ends with a common image extension (e.g., .jpg, .jpeg, .png)
4. The instructions are clear and detailed`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate recipe');
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;

    // Extract the JSON object from the response text
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse generated recipe');
    }

    const recipeData = JSON.parse(jsonMatch[0]);

    // Validate image URL
    const imageUrl = recipeData.strMealThumb;
    const isValidImageUrl = imageUrl && 
      (imageUrl.endsWith('.jpg') || 
       imageUrl.endsWith('.jpeg') || 
       imageUrl.endsWith('.png')) &&
      imageUrl.startsWith('http');

    const generatedRecipe = {
      strMeal: recipeName,
      strCategory: recipeData.strCategory,
      strArea: recipeData.strArea || (cuisineType || 'Unknown'),
      strInstructions: recipeData.strInstructions,
      ingredients: recipeData.ingredients,
      measures: recipeData.measures,
      strMealThumb: isValidImageUrl ? imageUrl : '/recipe-placeholder.jpg',
      dietaryPreferences: dietaryPreferences,
    };

    // Save to liked recipes if requested
    if (shouldSave) {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        throw new Error('User must be logged in to save recipes');
      }

      const recipeId = nanoid();
      await setDoc(doc(db, 'liked_recipes', recipeId), {
        ...generatedRecipe,
        id: recipeId,
        userId,
        likedAt: new Date().toISOString(),
      });
    }

    return generatedRecipe;
  } catch (error) {
    console.error('Error generating recipe:', error);
    throw error;
  }
} 