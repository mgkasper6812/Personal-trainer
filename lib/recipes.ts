import { generateRecipes } from "./coach";
import { getHealthBio, getProfile, getRecipe, listRecipes, putRecipes } from "./data";
import { mondayOf } from "./dates";
import type { Recipe } from "./types";

export const BATCH_SIZE = 8;

/** Add a batch of new dinners to the family library, tuned to this parent's health bio and the family's ratings. */
export async function addRecipeBatch(parentId: string, today = new Date().toISOString().slice(0, 10)) {
  const [bio, profile, index] = await Promise.all([getHealthBio(parentId), getProfile(parentId), listRecipes()]);
  const liked = index.filter((r) => r.rating === 1 || r.favorite).map((r) => r.title).slice(0, 15);
  const disliked = index.filter((r) => r.rating === -1).map((r) => r.title).slice(0, 15);
  const fresh = await generateRecipes({ count: BATCH_SIZE, bio, profile, existing: index.map((r) => r.title), liked, disliked });
  const batch = mondayOf(today);
  const recipes: Recipe[] = fresh.map((r) => ({
    ...r, id: crypto.randomUUID().slice(0, 12), servings: 4, addedAt: new Date().toISOString(), batch, rating: null, favorite: false,
  }));
  await putRecipes(recipes);
  return recipes;
}

export async function setRecipeFeedback(id: string, patch: { rating?: 1 | -1 | null; favorite?: boolean }) {
  const r = await getRecipe(id);
  if (!r) return null;
  const next = { ...r, ...patch };
  await putRecipes([next]);
  return next;
}
