import type { Recipe } from '@/types/recipe';

const ALLOWED_IMAGE_DOMAINS = [
  'www.themealdb.com',
  'images.unsplash.com',
  'placehold.co',
  'lh3.googleusercontent.com',
  'downshiftology.com'
];

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  sanitizedRecipe?: Recipe & { id: string };
}

interface RecipeData {
  strMeal?: string;
  strCategory?: string;
  strInstructions?: string;
  strMealThumb?: string;
  strArea?: string;
  ingredients?: string[];
  measures?: string[];
  likedAt?: string;
  isCustomized?: boolean;
  [key: string]: unknown;
}

export function validateAndSanitizeRecipe(
  docId: string,
  data: RecipeData
): ValidationResult {
  const requiredFields = ['strMeal', 'strCategory', 'strInstructions'];
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
    const parseDateString = (dateStr: string | undefined): string => {
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

    // Helper function to validate and sanitize image URL
    const sanitizeImageUrl = (url: string | undefined): string => {
      const PLACEHOLDER_IMAGE = '/recipe-placeholder.jpg';
      
      // If URL is undefined or empty string, return placeholder
      if (!url || url.trim() === '') {
        return PLACEHOLDER_IMAGE;
      }

      // If URL doesn't start with http/https, return placeholder
      if (!url.toLowerCase().startsWith('http')) {
        return PLACEHOLDER_IMAGE;
      }

      try {
        const urlObj = new URL(url);
        
        // Check if the domain is allowed
        const isAllowedDomain = ALLOWED_IMAGE_DOMAINS.some(domain => 
          urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
        );

        if (!isAllowedDomain) {
          return PLACEHOLDER_IMAGE;
        }

        // Validate if URL ends with common image extensions
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const hasValidExtension = validExtensions.some(ext => 
          urlObj.pathname.toLowerCase().endsWith(ext)
        );

        // Additional validation for query parameters
        if (urlObj.search && !hasValidExtension) {
          // Check if any query parameter ends with valid extension
          const queryParams = Array.from(urlObj.searchParams.values());
          const hasValidQueryExtension = queryParams.some(param => 
            validExtensions.some(ext => param.toLowerCase().endsWith(ext))
          );
          if (hasValidQueryExtension) {
            return url;
          }
        }

        return hasValidExtension ? url : PLACEHOLDER_IMAGE;
      } catch {
        // If URL parsing fails, return placeholder
        return PLACEHOLDER_IMAGE;
      }
    };

    // Provide default values for missing fields
    const sanitizedRecipe = {
      idMeal: docId,
      id: docId,
      strMeal: data.strMeal?.trim() || 'Untitled Recipe',
      strCategory: data.strCategory?.trim() || 'Uncategorized',
      strInstructions: data.strInstructions?.trim() || 'No instructions available',
      strMealThumb: sanitizeImageUrl(data.strMealThumb),
      strArea: (data.strArea || 'Unknown').trim(),
      ingredients: Array.isArray(data.ingredients) ? data.ingredients.filter(Boolean).map((i: string) => i.trim()) : [],
      measures: Array.isArray(data.measures) ? data.measures.filter(Boolean).map((m: string) => m.trim()) : [],
      lastUsedDate: new Date(),
      likedAt: parseDateString(data.likedAt),
      isCustomized: data.isCustomized || false,
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
  } catch {
    return {
      isValid: false,
      missingFields: ['Data parsing error'],
    };
  }
}
