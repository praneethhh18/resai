'use server';
/**
 * @fileOverview Generates one or more recipes using the Gemini API when other APIs return no results.
 *
 * - generateRecipesWithGemini - A function that generates a recipe and its variations using Gemini.
 */

import { ai } from '@/ai/genkit';
import {
  GeminiRecipeInputSchema,
  GeminiRecipeListOutputSchema,
  type GeminiRecipeInput,
  type GeminiRecipeListOutput,
} from '@/lib/types';

export async function generateRecipesWithGemini(input: GeminiRecipeInput): Promise<GeminiRecipeListOutput> {
  // This function simply calls the Genkit flow.
  return await generateRecipeWithGeminiFlow(input);
}

// Defines the AI prompt that requests structured recipe output.
const generateRecipePrompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  model: 'googleai/gemini-flash-latest',
  input: { schema: GeminiRecipeInputSchema },
  prompt: `You are an expert chef. A user is looking for recipes based on a search query.

Their search query is '{{query}}' and they are searching by '{{mode}}'.

- If the mode is 'ingredient', create up to 3 distinct recipes that feature the specified ingredients.
- If the mode is 'dish', create the classic recipe for that dish, and include 1-2 popular variations if they exist.

Respond with a JSON object that matches this TypeScript type exactly:
{
  "recipes": Array<{
    "strMeal": string;
    "strInstructions": string;
    "ingredients": Array<{ "name": string; "measure": string }>;
    "strCategory"?: string;
    "strArea"?: string;
    "strTags"?: string;
  }>;
}

Do not include any text before or after the JSON. Never wrap the JSON in backticks or markdown code fences.`,
});

// Defines the flow that orchestrates the AI call.
const generateRecipeWithGeminiFlow = ai.defineFlow(
  {
    name: 'generateRecipeWithGeminiFlow',
    inputSchema: GeminiRecipeInputSchema,
    outputSchema: GeminiRecipeListOutputSchema,
  },
  async (input: GeminiRecipeInput) => {
  const { text } = await generateRecipePrompt(input);

    let rawText = (text ?? '').trim();
    if (!rawText) {
      console.error('AI returned empty recipe payload');
      throw new Error('The AI returned an empty recipe payload.');
    }

    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```[a-zA-Z0-9_-]*\s*/, '').replace(/```$/, '').trim();
    }

    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      rawText = rawText.slice(firstBrace, lastBrace + 1);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch (error) {
      console.error('AI returned non-JSON recipe payload', rawText, error);
      throw new Error('The AI returned an invalid recipe payload.');
    }

    const validation = GeminiRecipeListOutputSchema.safeParse(parsed);
    if (!validation.success) {
      console.error('AI recipe payload failed schema validation', validation.error.flatten(), parsed);
      throw new Error('The AI failed to generate a valid recipe structure.');
    }

    const structuredOutput = validation.data;

    // It's valid for the AI to return no recipes, but the structure must be correct.
    // We check that the output is an object and contains a `recipes` array.
    if (!structuredOutput || !Array.isArray(structuredOutput.recipes)) {
      console.error('AI failed to return valid recipe data', structuredOutput);
      throw new Error('The AI failed to generate a valid recipe structure.');
    }

    return structuredOutput;
  }
);
