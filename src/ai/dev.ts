import { config } from 'dotenv';
config();

import '@/ai/flows/generate-recipes-with-gemini.ts';
import '@/ai/flows/ask-recipe-expert-flow.ts';
import '@/ai/flows/generate-image-flow.ts';
import '@/ai/flows/generate-search-suggestion-flow.ts';
