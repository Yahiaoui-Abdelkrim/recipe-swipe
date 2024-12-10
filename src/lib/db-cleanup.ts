import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc, query, where } from 'firebase/firestore';
import { validateAndSanitizeRecipe } from './recipe-validator';
import { getAuth } from 'firebase/auth';

export async function cleanupInvalidRecipes() {
  console.log('Starting cleanup of invalid recipes...');
  const results = {
    deleted: [] as string[],
    fixed: [] as string[],
    failed: [] as string[]
  };

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      console.error('No user logged in');
      return results;
    }

    // Get all recipes for the current user
    const q = query(
      collection(db, 'liked_recipes'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} recipes to check`);

    for (const docSnap of querySnapshot.docs) {
      const docId = docSnap.id;
      const data = docSnap.data();

      try {
        // Validate and attempt to sanitize the recipe
        const validationResult = validateAndSanitizeRecipe(docId, data);

        if (!validationResult.isValid) {
          if (validationResult.sanitizedRecipe) {
            // Recipe has issues but can be fixed with default values
            await setDoc(doc(db, 'liked_recipes', docId), {
              ...validationResult.sanitizedRecipe,
              userId,
              fixedAt: new Date().toISOString()
            });
            console.log(`Fixed recipe ${docId} with default values`);
            results.fixed.push(docId);
          } else {
            // Recipe is completely invalid and should be deleted
            await deleteDoc(doc(db, 'liked_recipes', docId));
            console.log(`Deleted invalid recipe ${docId}`);
            results.deleted.push(docId);
          }
        }
      } catch (error) {
        console.error(`Failed to process recipe ${docId}:`, error);
        results.failed.push(docId);
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }

  console.log('Cleanup completed:', {
    deleted: results.deleted.length,
    fixed: results.fixed.length,
    failed: results.failed.length
  });

  return results;
}
