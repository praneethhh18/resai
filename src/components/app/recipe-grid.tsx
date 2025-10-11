
'use client';

import { Recipe, RecipeSummary } from "@/lib/types";
import { RecipeCard } from "./recipe-card";

interface RecipeGridProps {
    recipes: (RecipeSummary | Recipe)[];
    onRecipeClick: (recipe: RecipeSummary | Recipe) => void;
    onAiChatClick: (recipe: RecipeSummary | Recipe) => void;
    message?: string;
}

export function RecipeGrid({ recipes, onRecipeClick, onAiChatClick, message }: RecipeGridProps) {
    if (recipes.length === 0 && message) {
        return (
            <div className="text-center py-16 text-muted-foreground">
                <p>{message}</p>
            </div>
        )
    }

    return (
        <>
            {message && (
                 <div className="text-center py-4 text-muted-foreground flex items-center justify-center gap-2">
                    <p>{message}</p>
                 </div>
             )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-20 pt-16 animate-fade-in">
                {recipes.map((recipe, index) => (
                    <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe} 
                        onClick={() => onRecipeClick(recipe)}
                        onAiChatClick={(e) => {
                            e.stopPropagation();
                            onAiChatClick(recipe);
                        }}
                        style={{ animation: `fade-in 0.5s ease-out forwards`, animationDelay: `${index * 70}ms`, opacity: 0 }}
                    />
                ))}
            </div>
        </>
    );
}
