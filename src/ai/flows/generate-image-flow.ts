
'use server';
/**
 * @fileOverview A Genkit flow that generates an image for a given recipe name.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateImageInputSchema = z.object({
  dishName: z.string().describe('The name of the dish to generate an image for.'),
});

export async function generateImage(dishName: string): Promise<string | undefined> {
  const result = await generateImageFlow({ dishName });
  return result;
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: z.string().optional(),
  },
  async ({ dishName }) => {
    const prompt = `A delicious, professionally photographed ${dishName}, centered on a plate, ready to eat.`;

    try {
      const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt,
      });
      return media?.url;
    } catch (error) {
      console.error('Image generation failed:', error);
      return undefined;
    }
  }
);
