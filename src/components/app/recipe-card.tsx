
'use client';

import Image from 'next/image';
import { Recipe, RecipeSummary } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '../ui/button';
import { Sparkles } from 'lucide-react';

interface RecipeCardProps {
    recipe: RecipeSummary | Recipe;
    onClick: () => void;
    onAiChatClick: (e: React.MouseEvent) => void;
    style?: React.CSSProperties;
}

export function RecipeCard({ recipe, onClick, onAiChatClick, style }: RecipeCardProps) {
    
    return (
        <Card 
            className="group transition-all duration-300 hover:shadow-xl w-full flex flex-col text-center rounded-2xl shadow-md border-none"
            style={style}
        >
            <div className="relative h-32 w-32 mx-auto -mt-16">
                 <div onClick={onClick} style={{ cursor: 'pointer' }} className="w-full h-full">
                    <Image
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        fill
                        sizes="128px"
                        className="object-cover rounded-full border-4 border-card"
                        data-ai-hint="recipe food"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== '/food.png') {
                                target.src = '/food.png';
                            }
                        }}
                    />
                 </div>
            </div>
            <CardContent className="p-6 flex-grow flex flex-col justify-between">
                <div onClick={onClick} style={{ cursor: 'pointer' }}>
                    <h3 className="text-xl font-semibold leading-tight mb-1">{recipe.name}</h3>
                    <p className="text-sm font-medium text-primary mb-4">{recipe.category || 'Intermediate'}</p>
                </div>

                <div className="flex items-center gap-2 mt-auto pt-4">
                    <Button 
                        onClick={onClick}
                        className="w-full rounded-lg h-12 bg-transparent border border-primary text-primary hover:bg-primary/10"
                    >
                        Start cooking
                    </Button>
                    <Button 
                        size="icon" 
                        variant="outline"
                        onClick={onAiChatClick}
                        className="h-12 w-12 flex-shrink-0 border-primary text-primary hover:bg-primary/10"
                        aria-label="Ask AI about this recipe"
                    >
                        <Sparkles className="w-5 h-5"/>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

    
