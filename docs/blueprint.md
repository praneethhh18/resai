# **App Name**: Dish Directory

## Core Features:

- Dual Search Modes: Enable users to switch between searching by dish name and by ingredients.
- TheMealDB Integration: Fetch recipes from TheMealDB API based on user queries.
- Gemini API Fallback: When TheMealDB returns no results for a dish name search, use the Gemini API to generate a recipe. Use the LLM as a tool to return recipe data.
- Trending Recipes: Display a random selection of trending recipes on the homepage, fetched from TheMealDB.
- Recipe Detail Modal: Show detailed recipe information in a full-screen modal, including image, ingredients, instructions, and a YouTube tutorial link.
- Ingredient Parsing: Parse the comma separated list of ingredients, passed by the user.
- YouTube Tutorial Button: Make a YouTube Tutorial button and navigate to that tutorial if one exists

## Style Guidelines:

- Primary color: Earthy orange (#E67E22) to evoke warmth and appetite.
- Background color: Light beige (#F5F5DC) for a clean and inviting feel.
- Accent color: Mustard yellow (#FFDB58) for highlights and interactive elements.
- Font: 'Inter', a sans-serif font, should be used for headings and body text, giving the app a clean and modern look. Note: currently only Google Fonts are supported.
- Use clear, minimalist icons for categories, search modes, and actions.
- Mobile-first responsive layout with a grid system for displaying recipes.
- Smooth transitions for modal appearance and interactive elements.