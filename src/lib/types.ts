import { z } from 'zod';

export interface Ingredient {
    name: string;
    measure: string;
}

export type RecipeSource = 'TheMealDB' | 'Gemini' | 'User';

export interface RecipeSummary {
    id: string;
    name: string;
    imageUrl: string;
    source: RecipeSource;
    category?: string;
    youtubeUrl?: string; 
}

export interface Recipe extends RecipeSummary {
  instructions: string;
  area?: string;
  tags?: string[];
  ingredients: Ingredient[];
  description?: string;
}

export interface UserRecipe extends Omit<Recipe, 'source'> {
    source: 'User';
    authorName: string;
    authorId: string;
}


export interface MealDBRecipeResponse {
    meals: MealDBRecipe[] | null;
}

export interface MealDBRecipe {
    idMeal: string;
    strMeal: string;
    strDrinkAlternate: null | string;
    strCategory: string;
    strArea: string;
    strInstructions: string;
    strMealThumb: string;
    strTags: string | null;
    strYoutube: string;
    strIngredient1: string;
    strIngredient2: string;
    strIngredient3: string;
    strIngredient4: string;
    strIngredient5: string;
    strIngredient6: string;
    strIngredient7: string;
    strIngredient8: string;
    strIngredient9: string;
    strIngredient10: string;
    strIngredient11: string;
    strIngredient12: string;
    strIngredient13: string;
    strIngredient14: string;
    strIngredient15: string;
    strIngredient16: string | null;
    strIngredient17: string | null;
    strIngredient18: string | null;
    strIngredient19: string | null;
    strIngredient20: string | null;
    strMeasure1: string;
    strMeasure2: string;
    strMeasure3: string;
    strMeasure4: string;
    strMeasure5: string;
    strMeasure6: string;
    strMeasure7: string;
    strMeasure8: string;
    strMeasure9: string;
    strMeasure10: string;
    strMeasure11: string;
    strMeasure12: string;
    strMeasure13: string;
    strMeasure14: string;
    strMeasure15: string;
    strMeasure16: string | null;
    strMeasure17: string | null;
    strMeasure18: string | null;
    strMeasure19: string | null;
    strMeasure20: string | null;
    strSource: string | null;
    strImageSource: string | null;
    strCreativeCommonsConfirmed: string | null;
    dateModified: string | null;
}

// --- Zod Schemas for Genkit Flow ---

export const GeminiRecipeInputSchema = z.object({
  query: z.string().describe('The user\'s search query, which could be a dish name or a comma-separated list of ingredients.'),
  mode: z.enum(['dish', 'ingredient']).describe('The search mode selected by the user.'),
});
export type GeminiRecipeInput = z.infer<typeof GeminiRecipeInputSchema>;

export const GeminiRecipeOutputSchema = z.object({
  strMeal: z.string().min(1).describe('The name of the recipe.'),
  strInstructions: z.string().min(1).describe('The cooking steps as a single string with steps separated by newline characters (\\n).'),
  ingredients: z.array(
    z.object({
      name: z.string().min(1).describe('The name of the ingredient.'),
      measure: z.string().describe('The measurement of the ingredient.'),
    })
  ).min(1).describe('An array of ingredients with their measurements.'),
  strCategory: z.string().optional().describe('The general category of the dish (e.g., "Seafood", "Dessert").'),
  strArea: z.string().optional().describe('The geographical origin of the dish (e.g., "Italian", "Mexican").'),
  strTags: z.string().optional().describe('A comma-separated string of relevant tags (e.g., "Spicy,Pasta,QuickMeal").'),
});
export type GeminiRecipeOutput = z.infer<typeof GeminiRecipeOutputSchema>;

export const GeminiRecipeListOutputSchema = z.object({
    recipes: z.array(GeminiRecipeOutputSchema).describe('An array of recipes, including variations.'),
});
export type GeminiRecipeListOutput = z.infer<typeof GeminiRecipeListOutputSchema>;

export interface AiChatMessage {
  sender: 'user' | 'ai';
  text: string;
  recipeName?: string;
}
