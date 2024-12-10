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

  // If data is completely invalid, return early
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      missingFields: ['Invalid data format'],
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

    // Provide default values for missing fields
    const sanitizedRecipe = {
      idMeal: docId,
      id: docId,
      strMeal: data.strMeal?.trim() || 'Untitled Recipe',
      strCategory: data.strCategory?.trim() || 'Uncategorized',
      strInstructions: data.strInstructions?.trim() || 'No instructions available',
      strMealThumb: data.strMealThumb || 'https://www.themealdb.com/images/media/meals/default.jpg',
      strArea: (data.strArea || 'Unknown').trim(),
      ingredients: Array.isArray(data.ingredients) ? data.ingredients.filter(Boolean).map((i: string) => i.trim()) : [],
      measures: Array.isArray(data.measures) ? data.measures.filter(Boolean).map((m: string) => m.trim()) : [],
      lastUsedDate: new Date(),
      likedAt: parseDateString(data.likedAt)
    } as Recipe & { id: string };

    // If any of the required fields are using default values, mark as invalid
    if (missingFields.length > 0) {
      return {
        isValid: false,
        missingFields,
        sanitizedRecipe // Still return the sanitized recipe with default values
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
