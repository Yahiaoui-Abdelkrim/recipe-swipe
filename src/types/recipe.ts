export interface Recipe {
  id: string;
  strMeal: string;
  strCategory: string;
  strInstructions: string;
  strMealThumb: string;
  strArea: string;
  strSocialMediaLink?: string;
  ingredients: string[];
  measures: string[];
  lastUsedDate?: Date;
}