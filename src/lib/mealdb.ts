import { Recipe } from '../types/recipe';

const MEALDB_API_URL = 'https://www.themealdb.com/api/json/v1/1';

export async function getRandomRecipe(): Promise<Recipe> {
  const response = await fetch(`${MEALDB_API_URL}/random.php`);
  const data = await response.json();
  return transformMealDBResponse(data.meals[0]);
}

function transformMealDBResponse(meal: any): Recipe {
  const ingredients: string[] = [];
  const measures: string[] = [];

  // Extract ingredients and measures
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    
    if (ingredient && ingredient.trim()) {
      ingredients.push(ingredient.trim());
      measures.push(measure?.trim() || '');
    }
  }

  return {
    id: meal.idMeal,
    strMeal: meal.strMeal,
    strCategory: meal.strCategory,
    strInstructions: meal.strInstructions,
    strMealThumb: meal.strMealThumb,
    strArea: meal.strArea,
    ingredients,
    measures,
  };
}