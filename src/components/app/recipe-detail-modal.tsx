
'use client';

import Image from 'next/image';
import { Recipe } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Youtube, MessageSquare } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface RecipeDetailModalProps {
    recipe: Recipe | null;
    isOpen: boolean;
    onClose: () => void;
    onAiChatClick: () => void;
    loading?: boolean;
}

export function RecipeDetailModal({ recipe, isOpen, onClose, onAiChatClick, loading }: RecipeDetailModalProps) {

    const renderContent = () => {
        if (loading || !recipe) {
            return (
                <div className="p-6 sm:p-8">
                    <Skeleton className="h-72 sm:h-96 w-full mb-6" />
                    <DialogHeader>
                        <DialogTitle>
                           <span className="sr-only">Loading Recipe</span>
                        </DialogTitle>
                         <DialogDescription className="sr-only">The recipe details are currently loading.</DialogDescription>
                    </DialogHeader>
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-1/2 mb-6" />
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-1">
                            <Skeleton className="h-6 w-1/2 mb-4" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <Skeleton className="h-6 w-1/3 mb-4" />
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/5" />
                            </div>

                        </div>
                    </div>
                </div>
            );
        }

        return (
            <>
                <div className="relative h-72 sm:h-96 w-full">
                     {recipe.imageUrl && (
                        <Image
                            src={recipe.imageUrl}
                            alt={recipe.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            data-ai-hint="recipe dish"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== '/food.png') {
                                    target.src = '/food.png';
                                }
                            }}
                        />
                    )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                     <div className="absolute bottom-0 left-0 p-6 sm:p-8">
                        <DialogTitle className="text-3xl md:text-4xl font-bold font-headline text-white">{recipe.name}</DialogTitle>
                        <DialogDescription className="sr-only">Detailed recipe for {recipe.name}</DialogDescription>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
                        <Badge variant="secondary">{recipe.source}</Badge>
                        {recipe.category && <Badge variant="outline">{recipe.category}</Badge>}
                        {recipe.area && <Badge variant="outline">{recipe.area}</Badge>}
                        {recipe.tags && recipe.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                    </div>
                    
                     <div className="flex gap-4 mb-8">
                        {recipe.youtubeUrl && (
                            <Button 
                                variant="destructive" 
                                asChild
                                className="transition-transform duration-300 ease-in-out hover:scale-105"
                            >
                                <a href={recipe.youtubeUrl} target="_blank" rel="noopener noreferrer">
                                    <Youtube className="w-5 h-5 mr-2" />
                                    Watch Tutorial
                                </a>
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="transition-transform duration-300 ease-in-out hover:scale-105"
                            onClick={onAiChatClick}
                        >
                            <MessageSquare className="w-5 h-5 mr-2" />
                            Ask AI
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-x-8 gap-y-6">
                        <div className="md:col-span-1">
                            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Ingredients</h3>
                            <ul className="space-y-2">
                                {recipe.ingredients.map((ing, index) => (
                                    <li key={index} className="flex items-start text-muted-foreground">
                                        <span className="font-semibold text-foreground mr-2">&bull;</span>
                                        <div><span className="font-medium text-foreground">{ing.measure}</span> {ing.name}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="md:col-span-2">
                            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Instructions</h3>
                            <ol className="space-y-4">
                                {recipe.instructions.split('\n').filter(step => step.trim()).map((step, index) => (
                                   <li key={index} className="flex items-start">
                                    <span className="flex items-center justify-center font-bold text-primary bg-primary/10 rounded-full w-6 h-6 mr-4 shrink-0">{index + 1}</span>
                                    <span className="pt-0.5 text-muted-foreground">{step.trim().replace(/^[\d-.]+\s*/, '')}</span>
                                   </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            </>
        );
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
                <ScrollArea className="flex-1">
                    {renderContent()}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
