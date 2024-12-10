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

export async function generateRecipeWithAI({
  recipeName,
  dietaryPreferences = [],
  cuisineType,
  shouldSave = false,
}: GenerateRecipeParams) {
  // Format recipe title with preferences
  const formatTitle = (name: string) => {
    const parts = [name.trim()];
    
    if (cuisineType) {
      parts.push(`(${cuisineType} Style)`);
    }
    
    if (dietaryPreferences?.length) {
      parts.push(`[${dietaryPreferences.join(', ')}]`);
    }
    
    // Capitalize first letter of each word in the base name
    const formattedName = parts[0].split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    parts[0] = formattedName;
    return parts.join(' ');
  };

  // Correct common recipe name misspellings
  const correctRecipeName = (name: string) => {
    const corrections: { [key: string]: string } = {
      'futtucini': 'fettuccine',
      'fetuccini': 'fettuccine',
      'fettucini': 'fettuccine',
      'spagetti': 'spaghetti',
      'linguini': 'linguine',
      'penne arabiata': 'penne all\'arrabbiata',
      // Add more corrections as needed
    };

    const nameLower = name.toLowerCase();
    for (const [incorrect, correct] of Object.entries(corrections)) {
      if (nameLower.includes(incorrect)) {
        return nameLower.replace(incorrect, correct);
      }
    }
    return name;
  };

  const correctedName = correctRecipeName(recipeName);
  const formattedName = formatTitle(correctedName);

  const prompt = `Generate a detailed recipe for "${formattedName}"${
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
      strMeal: formattedName,
      strCategory: recipeData.strCategory,
      strArea: recipeData.strArea || (cuisineType || 'Unknown'),
      strInstructions: recipeData.strInstructions,
      ingredients: recipeData.ingredients,
      measures: recipeData.measures,
      strMealThumb: isValidImageUrl ? imageUrl : 'https://www.themealdb.com/images/media/meals/default.jpg',
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