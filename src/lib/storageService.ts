import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadRecipeImage(file: File, recipeId: string): Promise<string> {
  const storageRef = ref(storage, `recipes/${recipeId}/image`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteRecipeImage(recipeId: string): Promise<void> {
  const storageRef = ref(storage, `recipes/${recipeId}/image`);
  try {
    await deleteObject(storageRef);
  } catch {
    // Image may not exist, ignore
  }
}
