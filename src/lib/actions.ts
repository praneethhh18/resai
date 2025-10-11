
'use server';

import { generateRecipesWithGemini } from '@/ai/flows/generate-recipes-with-gemini';
import { generateSearchSuggestion } from '@/ai/flows/generate-search-suggestion-flow';
import { MealDBRecipe, MealDBRecipeResponse, Recipe, RecipeSummary, Ingredient, GeminiRecipeOutput, GeminiRecipeListOutput, UserRecipe } from "./types";
import { collection, getDocs, query, where, addDoc, serverTimestamp, type CollectionReference } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { getAdminFirestore } from '@/firebase/admin';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';

const MEALDB_API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
const GEMINI_TIMEOUT_MS = 4500;
const GEMINI_FALLBACK_TIMEOUT_MS = 12000;
const GEMINI_FAILURE_COOLDOWN_MS = 60_000;
const GEMINI_THROTTLE_INTERVAL_MS = 10_000;
const GEMINI_CACHE_TTL_MS = 5 * 60_000;

let geminiRecipeCooldownUntil = 0;
let lastGeminiInvocationAt = 0;
const geminiSearchCache = new Map<string, { timestamp: number; response: GeminiRecipeListOutput }>();

// --- Normalization Functions ---

function normalizeMealDBRecipe(meal: MealDBRecipe): Recipe {
    const ingredients: Ingredient[] = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}` as keyof MealDBRecipe] as string;
        const measure = meal[`strMeasure${i}` as keyof MealDBRecipe] as string;
        if (ingredient && ingredient.trim() !== '') {
            ingredients.push({ name: ingredient, measure: measure || '' });
        }
    }

    const tags = meal.strTags ? meal.strTags.split(',').map(tag => tag.trim()) : [];

    return {
        id: meal.idMeal,
        name: meal.strMeal,
        category: meal.strCategory,
        area: meal.strArea,
        instructions: meal.strInstructions,
        imageUrl: meal.strMealThumb,
        tags: tags,
        youtubeUrl: meal.strYoutube,
        ingredients: ingredients,
        source: 'TheMealDB'
    };
}

function normalizeGeminiRecipe(geminiRecipe: GeminiRecipeOutput): Recipe {
    const id = `gemini-${geminiRecipe.strMeal.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const tags = geminiRecipe.strTags
        ? geminiRecipe.strTags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [];

    return {
        id: id,
        name: geminiRecipe.strMeal,
        instructions: geminiRecipe.strInstructions,
        ingredients: geminiRecipe.ingredients,
        source: 'Gemini',
        imageUrl: '/food.png', // Default image for AI recipes
        category: geminiRecipe.strCategory ?? 'AI Creation',
        area: geminiRecipe.strArea ?? 'Unknown',
        tags: tags,
    };
}

function toStringOrUndefined(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function toStringOrEmpty(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function normalizeIngredients(value: unknown): Ingredient[] {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => {
            if (!item || typeof item !== 'object') {
                return null;
            }
            const record = item as Record<string, unknown>;
            const name = toStringOrEmpty(record.name);
            if (!name) {
                return null;
            }
            return {
                name,
                measure: toStringOrEmpty(record.measure),
            };
        })
        .filter((ingredient): ingredient is Ingredient => Boolean(ingredient));
}

function normalizeTags(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);
    }
    return [];
}

function normalizeUserRecipeData(record: Record<string, unknown>, id: string): UserRecipe {
    return {
        id,
        name: toStringOrEmpty(record.name),
        description: toStringOrUndefined(record.description),
        imageUrl: toStringOrEmpty(record.imageUrl),
        ingredients: normalizeIngredients(record.ingredients),
        instructions: toStringOrEmpty(record.instructions),
        category: toStringOrUndefined(record.category),
        area: toStringOrUndefined(record.area),
        tags: normalizeTags(record.tags),
        authorName: toStringOrEmpty(record.authorName),
        authorId: toStringOrEmpty(record.authorId),
        source: 'User',
    };
}

function normalizeUserRecipe(doc: { id: string; data(): unknown }): UserRecipe {
    const raw = doc.data();
    const record = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
    return normalizeUserRecipeData(record, doc.id);
}


// --- API Fetching Functions ---

async function fetchFromMealDB(endpoint: string): Promise<MealDBRecipe[]> {
    try {
        const response = await fetch(`${MEALDB_API_BASE_URL}/${endpoint}`);
        if (!response.ok) {
            console.error(`MealDB API request failed with status ${response.status}`);
            return [];
        }
        const data: MealDBRecipeResponse = await response.json();
        return data.meals || [];
    } catch (error) {
        console.error('Error fetching from MealDB:', error);
        return []; // Return empty on fetch error, allowing fallback
    }
}

// --- Main Exposed Functions ---

export async function getTrendingRecipes(): Promise<Recipe[]> {
    try {
        // Fetch 8 random recipes from the API as trending
        const recipePromises = Array.from({ length: 8 }).map(() => fetchFromMealDB('random.php'));
        const recipeArrays = await Promise.all(recipePromises);
        const uniqueRecipes = new Map<string, Recipe>();

        recipeArrays.flat().forEach(meal => {
            if (meal && !uniqueRecipes.has(meal.idMeal)) {
                uniqueRecipes.set(meal.idMeal, normalizeMealDBRecipe(meal));
            }
        });
        
        return Array.from(uniqueRecipes.values());

    } catch (error) {
        console.error('Failed to fetch trending recipes:', error);
        throw new Error('Could not load trending recipes. Please try again later.');
    }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<null>((resolve) => {
        timeoutHandle = setTimeout(() => resolve(null), timeoutMs);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        if (result === null) {
            return null;
        }
        return result as T;
    } finally {
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
    }
}


export async function searchRecipes({ query: searchQuery, mode }: { query: string, mode: 'dish' | 'ingredient' }): Promise<{recipes: (RecipeSummary | Recipe)[], source: 'MealDB' | 'Gemini' | 'Combined' | 'User'}> {
    const dedupeByName = (recipes: (RecipeSummary | Recipe)[]) => {
        const map = new Map<string, RecipeSummary | Recipe>();
        for (const recipe of recipes) {
            const key = recipe.name.toLowerCase();
            if (!map.has(key)) {
                map.set(key, recipe);
            }
        }
        return Array.from(map.values());
    };

    const sourcesUsed = new Set<'MealDB' | 'Gemini' | 'User'>();
    let userRecipes: (RecipeSummary | Recipe)[] = [];
    let mealDbRecipes: (RecipeSummary | Recipe)[] = [];
    let geminiRecipes: (RecipeSummary | Recipe)[] = [];

    let now = Date.now();
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const geminiCacheKey = `${mode}:${normalizedQuery}`;
    const cachedGeminiEntry = geminiSearchCache.get(geminiCacheKey);
    const hasFreshCache = Boolean(cachedGeminiEntry && now - cachedGeminiEntry.timestamp <= GEMINI_CACHE_TTL_MS);

    let geminiInvocationStartedAt: number | null = null;
    let geminiPromise: Promise<GeminiRecipeListOutput> | null = null;

    if (!hasFreshCache) {
        if (now < geminiRecipeCooldownUntil) {
            console.warn(`Skipping Gemini recipe call due to cooldown. Ready after ${new Date(geminiRecipeCooldownUntil).toISOString()}`);
        } else {
            const elapsedSinceLastCall = now - lastGeminiInvocationAt;
            if (elapsedSinceLastCall < GEMINI_THROTTLE_INTERVAL_MS) {
                const waitMs = GEMINI_THROTTLE_INTERVAL_MS - elapsedSinceLastCall;
                if (waitMs > 0) {
                    console.info(`Throttling Gemini recipe call by ${waitMs}ms to respect quota.`);
                    await new Promise((resolve) => setTimeout(resolve, waitMs));
                    now = Date.now();
                }
            }

            if (now < geminiRecipeCooldownUntil) {
                console.warn(`Skipping Gemini recipe call due to cooldown. Ready after ${new Date(geminiRecipeCooldownUntil).toISOString()}`);
            } else {
                geminiInvocationStartedAt = Date.now();
                lastGeminiInvocationAt = geminiInvocationStartedAt;
                geminiPromise = generateRecipesWithGemini({ query: searchQuery, mode });
            }
        }
    }

    try {
        const userRecipesPromise = (async (): Promise<UserRecipe[]> => {
            if (typeof window === 'undefined') {
                const adminFirestore = await getAdminFirestore();
                if (!adminFirestore) {
                    return [];
                }
                try {
                    const snapshot = await adminFirestore
                        .collection('userRecipes')
                        .where('name', '>=', searchQuery)
                        .where('name', '<=', searchQuery + '\uf8ff')
                        .get();
                    return snapshot.docs.map((doc) =>
                        normalizeUserRecipe({
                            id: doc.id,
                            data: () => doc.data(),
                        })
                    );
                } catch (error) {
                    console.error('Failed to query user recipes with Admin SDK:', error);
                    return [];
                }
            }

            const userRecipesRef = collection(firestore, "userRecipes") as CollectionReference<UserRecipe>;
            const q = query(userRecipesRef, where("name", ">=", searchQuery), where("name", "<=", searchQuery + '\uf8ff'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) =>
                normalizeUserRecipe({
                    id: doc.id,
                    data: () => doc.data(),
                })
            );
        })();

        const mealDbPromise = (async () => {
            if (mode === 'dish') {
                const mealDBResults = await fetchFromMealDB(`search.php?s=${searchQuery}`);
                return mealDBResults.map(normalizeMealDBRecipe);
            }
            const mealDBResults = await fetchFromMealDB(`filter.php?i=${searchQuery}`);
            return mealDBResults.map(r => ({ id: r.idMeal, name: r.strMeal, imageUrl: r.strMealThumb, source: 'TheMealDB' as const }));
        })();

        const [userRecipeResults, mealDbResults] = await Promise.all([userRecipesPromise, mealDbPromise]);

        if (userRecipeResults.length > 0) {
            sourcesUsed.add('User');
            userRecipes = userRecipeResults;
        }

        if (mealDbResults.length > 0) {
            sourcesUsed.add('MealDB');
            mealDbRecipes = mealDbResults;
        }
    } catch (error) {
        console.error("Error during initial search (User/MealDB):", error);
        // Don't throw, allow Gemini fallback/augmentation.
    }

    let geminiResponse: GeminiRecipeListOutput | null = hasFreshCache && cachedGeminiEntry ? cachedGeminiEntry.response : null;
    let geminiTimedOut = false;
    if (geminiPromise) {
        try {
            geminiResponse = await withTimeout(geminiPromise, GEMINI_TIMEOUT_MS);
            if (geminiResponse === null) {
                geminiTimedOut = true;
                console.warn(`Gemini recipe generation timed out after ${GEMINI_TIMEOUT_MS}ms.`);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (message.toLowerCase().includes('quota') || message.includes('429')) {
                const retryMs = extractRetryAfterMs(message) ?? GEMINI_FAILURE_COOLDOWN_MS;
                geminiRecipeCooldownUntil = Date.now() + retryMs;
                console.warn(`Gemini quota exceeded. Cooling down for ${retryMs}ms.`);
            }
            console.error("Failed to generate recipes with Gemini:", error);
            if (userRecipes.length === 0 && mealDbRecipes.length === 0) {
                return { recipes: [], source: 'MealDB' };
            }
        }
    }

    if (geminiTimedOut && geminiPromise && !hasFreshCache && userRecipes.length === 0 && mealDbRecipes.length === 0) {
        try {
            const extendedResponse = await withTimeout(geminiPromise, GEMINI_FALLBACK_TIMEOUT_MS);
            if (extendedResponse === null) {
                console.warn(`Gemini fallback attempt also timed out after additional ${GEMINI_FALLBACK_TIMEOUT_MS}ms.`);
            } else {
                geminiResponse = extendedResponse;
                geminiTimedOut = false;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (message.toLowerCase().includes('quota') || message.includes('429')) {
                const retryMs = extractRetryAfterMs(message) ?? GEMINI_FAILURE_COOLDOWN_MS;
                geminiRecipeCooldownUntil = Date.now() + retryMs;
                console.warn(`Gemini quota exceeded during fallback. Cooling down for ${retryMs}ms.`);
            }
            console.error("Failed to generate recipes with Gemini during fallback:", error);
        }
    }

    if (!hasFreshCache && geminiPromise && geminiResponse) {
        const timestamp = geminiInvocationStartedAt ?? Date.now();
        lastGeminiInvocationAt = timestamp;
        geminiSearchCache.set(geminiCacheKey, { timestamp, response: geminiResponse });
    }

    if (geminiResponse && geminiResponse.recipes && geminiResponse.recipes.length > 0) {
        const mappedGeminiRecipes = geminiResponse.recipes.map(normalizeGeminiRecipe);
        if (mappedGeminiRecipes.length > 0) {
            sourcesUsed.add('Gemini');
            geminiRecipes = mappedGeminiRecipes;
        }
    }

    const aggregated = dedupeByName([
        ...geminiRecipes,
        ...userRecipes,
        ...mealDbRecipes,
    ]);

    if (aggregated.length === 0) {
        return { recipes: [], source: 'MealDB' };
    }

    let source: 'MealDB' | 'Gemini' | 'Combined' | 'User';
    if (sourcesUsed.size === 0) {
        source = 'MealDB';
    } else if (sourcesUsed.size === 1) {
        source = Array.from(sourcesUsed)[0];
    } else {
        source = 'Combined';
    }

    return { recipes: aggregated, source };
}

function extractRetryAfterMs(message: string): number | null {
    const match = message.match(/retry in\s+([\d.]+)s/i);
    if (!match) {
        return null;
    }
    const seconds = Number.parseFloat(match[1]);
    return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) : null;
}

export async function getRecipeDetails(id: string, source: 'TheMealDB' | 'Gemini' | 'User'): Promise<Recipe | null> {
    if (source === 'Gemini' || source === 'User') {
        console.warn(`getRecipeDetails called for ${source} recipe. This should not be necessary as full data should be client-side.`);
        return null;
    }
    
    try {
        const meals = await fetchFromMealDB(`lookup.php?i=${id}`);
        if (meals.length > 0) {
            return normalizeMealDBRecipe(meals[0]);
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch recipe details for id ${id}:`, error);
        throw new Error('Could not load recipe details.');
    }
}

export async function getSearchSuggestion(query: string): Promise<string> {
    try {
        const suggestion = await generateSearchSuggestion(query);
        return suggestion;
    } catch (error) {
        console.error('Failed to get search suggestion:', error);
        return '';
    }
}

export async function submitUserRecipe(
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    const storage = getStorage();
        const recipePayload = {
            authorId: formData.get('authorId') as string,
            authorName: formData.get('authorName') as string,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            instructions: formData.get('instructions') as string,
            ingredients: JSON.parse(formData.get('ingredients') as string) as Ingredient[],
        };

    const imageFile = formData.get('image') as File;
    
    if (!imageFile || imageFile.size === 0) {
      throw new Error("Image is required.");
    }
    
    const imagePath = `user-recipes/${recipePayload.authorId}/${uuidv4()}-${imageFile.name}`;
    const storageRef = ref(storage, imagePath);

    const uploadResult = await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(uploadResult.ref);

    await addDoc(collection(firestore, "userRecipes"), {
      ...recipePayload,
      imageUrl,
      createdAt: serverTimestamp(),
    });

        return { success: true, message: "Recipe submitted successfully!" };
    } catch (error: unknown) {
        console.error("Error submitting recipe:", error);
        const message = error instanceof Error ? error.message : "Failed to submit recipe. Please try again.";
        return { success: false, message };
  }
}

export async function submitContactForm(
  email: string,
  message: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!email || !message) {
      throw new Error("Email and message are required.");
    }
    
    await addDoc(collection(firestore, "contactMessages"), {
      email,
      message,
      createdAt: serverTimestamp(),
      status: "new",
    });

        return { success: true, message: "Message sent successfully!" };
    } catch (error: unknown) {
        console.error("Error submitting contact form:", error);
        const message = error instanceof Error ? error.message : "Failed to send message. Please try again.";
        return { success: false, message };
  }
}
