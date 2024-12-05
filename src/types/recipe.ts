export interface Recipe {
  id: string;
  strMeal: string;
  strCategory: string;
  strInstructions: string;
  strMealThumb: string;
  strArea: string;
  ingredients: string[];
  measures: string[];
  lastUsedDate?: Date;
}