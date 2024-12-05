import type { Recipe } from '@/types/recipe';

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  sanitizedRecipe?: Recipe & { id: string };
}

export function validateAndSanitizeRecipe(
  docId: string,
  data: any
): ValidationResult {
  const requiredFields = ['strMeal', 'strCategory', 'strInstructions', 'strMealThumb'];
  const missingFields = requiredFields.filter(field => !data[field]);

  if (missingFields.length > 0) {
    return {
      isValid: false,
      missingFields,
    };
  }

  try {
    // Helper function to safely parse dates
    const parseDateString = (dateStr: any): string => {
      if (!dateStr) return new Date().toISOString();
      try {
        const date = new Date(dateStr);
        // Check if the date is valid
        if (isNaN(date.getTime())) return new Date().toISOString();
        return date.toISOString();
      } catch {
        return new Date().toISOString();
      }
    };

    const sanitizedRecipe = {
      idMeal: docId,
      id: docId,
      strMeal: data.strMeal?.trim() || '',
      strCategory: data.strCategory?.trim() || '',
      strInstructions: data.strInstructions?.trim() || '',
      strMealThumb: data.strMealThumb || '',
      strArea: (data.strArea || '').trim(),
      ingredients: Array.isArray(data.ingredients) ? data.ingredients.filter(Boolean).map((i: string) => i.trim()) : [],
      measures: Array.isArray(data.measures) ? data.measures.filter(Boolean).map((m: string) => m.trim()) : [],
      lastUsedDate: new Date(),
      likedAt: parseDateString(data.likedAt)
    } as Recipe & { id: string };

    // Additional validation after sanitization
    if (!sanitizedRecipe.strMeal || !sanitizedRecipe.strCategory || 
        !sanitizedRecipe.strInstructions || !sanitizedRecipe.strMealThumb) {
      return {
        isValid: false,
        missingFields: requiredFields.filter(field => !sanitizedRecipe[field as keyof typeof sanitizedRecipe]),
      };
    }

    return {
      isValid: true,
      missingFields: [],
      sanitizedRecipe
    };
  } catch (error) {
    return {
      isValid: false,
      missingFields: ['Data parsing error'],
    };
  }
}
