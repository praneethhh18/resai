
'use server';
/**
 * @fileOverview A Genkit flow that acts as a recipe expert, answering user questions about a specific recipe.
 */
import { ai } from '@/ai/genkit';
import { Recipe } from '@/lib/types';
import { z } from 'zod';

const RecipeExpertInputSchema = z.object({
  recipe: z.object({
    name: z.string(),
    ingredients: z.array(z.object({ name: z.string(), measure: z.string() })),
    instructions: z.string(),
  }),
  question: z.string(),
});

export async function askRecipeExpert(recipe: Recipe, question: string): Promise<string> {
    const result = await recipeExpertFlow({ recipe, question });
    return result;
}

const recipeExpertPrompt = ai.definePrompt({
  name: 'recipeExpertPrompt',
  model: 'googleai/gemini-pro-latest',
  input: { schema: RecipeExpertInputSchema },
  prompt: `You are a friendly and knowledgeable culinary expert. A user is asking a question about a specific recipe.

  **The Recipe:**
  - **Name:** {{recipe.name}}
  - **Ingredients:**
  {{#each recipe.ingredients}}- {{this.measure}} {{this.name}}
  {{/each}}
  - **Instructions:**
  {{recipe.instructions}}

  **The User's Question:**
  "{{question}}"

  Your task is to answer the user's question based on the provided recipe details. Be helpful, concise, and friendly. If the question is about substitutions, suggest common and sensible alternatives. If it's about technique, provide clear guidance. If you cannot answer the question based on the provided information, say so politely.

  **IMPORTANT**: Your response must be plain text. Do NOT use any markdown, bolding (**), asterisks, or any other special formatting.
  `,
});

const recipeExpertFlow = ai.defineFlow(
  {
    name: 'recipeExpertFlow',
    inputSchema: RecipeExpertInputSchema,
    outputSchema: z.string(),
  },
  async (input: z.infer<typeof RecipeExpertInputSchema>) => {
    const { text } = await recipeExpertPrompt(input);
    return text;
  }
);
