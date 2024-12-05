export interface Recipe {
  id: string;
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strSocialMediaLink?: string;
  ingredients: string[];
  measures: string[];
  dietaryRestrictions?: string[];
  likedAt?: string;
  lastUsedDate?: Date;
}