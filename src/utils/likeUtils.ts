import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import type { Recipe } from '@/types/recipe';

export async function toggleLike(recipe: Recipe & { id: string }) {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  if (!userId) {
    throw new Error('User must be logged in to like recipes');
  }

  const docRef = doc(db, 'liked_recipes', recipe.id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    await deleteDoc(docRef);
  } else {
    await setDoc(docRef, {
      ...recipe,
      userId,
      likedAt: new Date().toISOString(),
    });
  }
} 