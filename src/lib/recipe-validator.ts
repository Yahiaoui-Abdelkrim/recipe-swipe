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
    const sanitizedRecipe = {
      id: docId,
      strMeal: data.strMeal.trim(),
      strCategory: data.strCategory.trim(),
      strInstructions: data.strInstructions.trim(),
      strMealThumb: data.strMealThumb,
      strArea: (data.strArea || '').trim(),
      ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
      measures: Array.isArray(data.measures) ? data.measures : [],
      lastUsedDate: data.lastUsedDate ? new Date(data.lastUsedDate) : undefined,
      likedAt: data.likedAt ? new Date(data.likedAt) : new Date()
    } as Recipe & { id: string };

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
