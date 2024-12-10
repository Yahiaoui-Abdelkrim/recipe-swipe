import { Recipe } from '../types/recipe';

interface MealDBResponse {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  [key: `strIngredient${number}`]: string | null;
  [key: `strMeasure${number}`]: string | null;
}

const MEALDB_API_URL = 'https://www.themealdb.com/api/json/v1/1';

export async function getRandomRecipe(): Promise<Recipe> {
  const response = await fetch(`${MEALDB_API_URL}/random.php`);
  const data = await response.json();
  return transformMealDBResponse(data.meals[0]);
}

export async function searchRecipes(searchTerm: string): Promise<Recipe[]> {
  const response = await fetch(`${MEALDB_API_URL}/search.php?s=${encodeURIComponent(searchTerm)}`);
  const data = await response.json();
  return data.meals ? data.meals.map(transformMealDBResponse) : [];
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
    const response = await fetch(`${MEALDB_API_URL}/lookup.php?i=${encodeURIComponent(id)}`);
    const data = await response.json();
    return data.meals ? transformMealDBResponse(data.meals[0]) : null;
  } catch (error) {
    console.error('Error fetching recipe by ID:', error);
    return null;
  }
}

function transformMealDBResponse(meal: MealDBResponse): Recipe {
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
    idMeal: meal.idMeal,
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