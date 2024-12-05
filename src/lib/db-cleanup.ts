import { db } from '@/lib/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { validateAndSanitizeRecipe } from './recipe-validator';

const INVALID_DOCS = [
  '9z17q6NbpVCkTKmxA1Ib',
  '3LqtARWJoMXyfMLNoE4k',
  'IYtvudn4C2QAnnNkgnsF',
  'h09qY4vnX3knMKxI9eON',
  'OXZwnEahWj7t1qzUSedQ',
  'OX8FzBTZOyboinyaEJtM'
];

export async function cleanupInvalidRecipes() {
  console.log('Starting cleanup of invalid recipes...');
  const results = {
    success: [] as string[],
    failed: [] as string[]
  };

  for (const docId of INVALID_DOCS) {
    try {
      await deleteDoc(doc(db, 'liked_recipes', docId));
      console.log(`Successfully deleted invalid recipe: ${docId}`);
      results.success.push(docId);
    } catch (error) {
      console.error(`Failed to delete recipe ${docId}:`, error);
      results.failed.push(docId);
    }
  }

  console.log('Cleanup completed:', {
    successful: results.success.length,
    failed: results.failed.length
  });

  return results;
}
