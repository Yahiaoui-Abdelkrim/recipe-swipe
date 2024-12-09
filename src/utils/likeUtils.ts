import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Recipe } from '@/types/recipe';
import toast from 'react-hot-toast';
import { getAuth } from 'firebase/auth';

export const checkIfLiked = async (recipeId: string): Promise<boolean> => {
  console.log('🔍 checkIfLiked called for recipe:', recipeId);
  const docRef = doc(db, 'liked_recipes', recipeId);
  const docSnap = await getDoc(docRef);
  const exists = docSnap.exists();
  console.log('📊 checkIfLiked result:', exists);
  return exists;
};

export const removeLike = async (recipeId: string): Promise<void> => {
  console.log('❌ Removing like for recipe:', recipeId);
  const docRef = doc(db, 'liked_recipes', recipeId);
  await deleteDoc(docRef);
  console.log('✅ Like removed successfully');
};

export const addLike = async (recipe: Recipe): Promise<void> => {
  console.log('❤️ Adding like for recipe:', recipe.id);
  console.log('Recipe data being saved:', recipe);
  const docRef = doc(db, 'liked_recipes', recipe.id);
  const { id, ...recipeData } = recipe;
  
  // Get the current user
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    console.error('❌ No user ID found when trying to add like');
    throw new Error('User must be logged in to like recipes');
  }

  const dataToSave = {
    ...recipeData,
    userId,
    likedAt: new Date().toISOString()
  };
  console.log('Data being saved to Firestore:', dataToSave);
  
  await setDoc(docRef, dataToSave);
  console.log('✅ Like added successfully');
};

export const toggleLike = async (recipe: Recipe) => {
  console.log('🔄 Toggling like for recipe:', recipe.id, recipe.strMeal);
  try {
    const isLiked = await checkIfLiked(recipe.id);
    console.log('📊 Current like status:', isLiked ? 'Liked' : 'Not liked');
    
    if (isLiked) {
      await removeLike(recipe.id);
      console.log('❌ Removed like for recipe:', recipe.id);
      toast.success(`Removed "${recipe.strMeal}" from favorites`, {
        style: {
          fontWeight: 500,
        },
      });
    } else {
      await addLike(recipe);
      console.log('❤️ Added like for recipe:', recipe.id);
      toast.success(`Added "${recipe.strMeal}" to favorites`, {
        style: {
          fontWeight: 500,
        },
      });
    }
  } catch (error) {
    console.error('❌ Error in toggleLike:', error);
    toast.error('Failed to update favorites', {
      style: {
        fontWeight: 500,
      },
    });
  }
}; 