
'use server';
/**
 * @fileOverview A Genkit flow that generates a search suggestion for a recipe app.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DEFAULT_COOLDOWN_MS = 60_000;
let suggestionCooldownUntil = 0;

const parseRetryAfter = (message: string): number | null => {
  const match = message.match(/retry in\s+([\d.]+)s/i);
  if (!match) {
    return null;
  }
  const seconds = Number.parseFloat(match[1]);
  return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) : null;
};

const SearchSuggestionInputSchema = z.object({
  query: z.string().describe('The partial search query from the user.'),
});

const SearchSuggestionOutputSchema = z.object({
  suggestion: z.string().describe("A single, relevant search query suggestion. It should complete the user's thought. The suggestion should NOT be the same as the input query."),
});

export async function generateSearchSuggestion(query: string): Promise<string> {
    const result = await searchSuggestionFlow({ query });
    return result.suggestion;
}

const searchSuggestionPrompt = ai.definePrompt({
  name: 'searchSuggestionPrompt',
  model: 'googleai/gemini-flash-latest',
  input: { schema: SearchSuggestionInputSchema },
  prompt: `You are a search suggestion AI for a recipe app. A user is typing a search query. Your goal is to predict and complete their query.

  User's current input: "{{query}}"

  Based on this input, provide a single, likely search suggestion.
  - The suggestion should be a natural completion of what the user is typing.
  - For example, if the input is "chicken", a good suggestion is "chicken noodle soup".
  - If the input is "spicy", a good suggestion is "spicy thai green curry".
  - Do not just repeat the input. Provide a full, sensible query.
  - Return only the most likely suggestion.
  `,
});

const searchSuggestionFlow = ai.defineFlow(
  {
    name: 'searchSuggestionFlow',
    inputSchema: SearchSuggestionInputSchema,
    outputSchema: SearchSuggestionOutputSchema,
  },
  async (input: z.infer<typeof SearchSuggestionInputSchema>) => {
    // If the query is very short, don't bother the AI.
    if (input.query.length < 3) {
      return { suggestion: '' };
    }
    if (Date.now() < suggestionCooldownUntil) {
      return { suggestion: '' };
    }
    try {
      const { text } = await searchSuggestionPrompt(input);
      const suggestion = text?.trim() ?? '';
      if (!suggestion || suggestion.length < input.query.length) {
        return { suggestion: '' };
      }
      return { suggestion };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('429') || message.toLowerCase().includes('quota exceeded')) {
        const retryMs = parseRetryAfter(message) ?? DEFAULT_COOLDOWN_MS;
        suggestionCooldownUntil = Date.now() + retryMs;
        console.warn('Skipping search suggestion: Gemini quota exceeded.');
        return { suggestion: '' };
      }

      console.error('Failed to generate search suggestion with Gemini:', error);
      return { suggestion: '' };
    }
  }
);
