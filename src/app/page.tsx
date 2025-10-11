
'use client';

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import { searchRecipes, getRecipeDetails, getTrendingRecipes, getSearchSuggestion } from '@/lib/actions';
import { Recipe, RecipeSummary, AiChatMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Search, Home as HomeIcon, BookOpen, Clock, MessageSquare, Moon, Sun, User, Utensils, Sparkles, Share } from 'lucide-react';
import { RecipeGrid } from '@/components/app/recipe-grid';
import { RecipeDetailModal } from '@/components/app/recipe-detail-modal';
import { useToast } from '@/hooks/use-toast';
import { AiChatModal } from '@/components/app/ai-chat-modal';
import { AiChatHistorySheet } from '@/components/app/ai-chat-history-sheet';
import Image from 'next/image';
import { askRecipeExpert } from '@/ai/flows/ask-recipe-expert-flow';
import { useTheme } from 'next-themes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AiSearchInput } from '@/components/app/ai-search-input';
import { useDebounce } from 'use-debounce';
import { ChefHat, Carrot } from 'lucide-react';
import { ProfileSidebar } from '@/components/app/profile-sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import FireLoader from '@/components/app/FireLoader';
import { useUser } from '@/firebase';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { ShareRecipeModal } from '@/components/app/share-recipe-modal';
import { ContactUsModal } from '@/components/app/contact-us-modal';
import { FaqModal } from '@/components/app/faq-modal';

const enableAiSuggestions = process.env.NEXT_PUBLIC_ENABLE_AI_SUGGESTIONS === 'true';

function KitchenBookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      aria-hidden="true"
      {...props}
    >
      <g>
        <g>
          <g>
            <path
              fill="#fdc75b"
              d="M442.55,45.4V401.62c0,9.61-8.21,17.4-18.35,17.4H103.7a35.1,35.1,0,0,0-24.22,9.52,31.562,31.562,0,0,0-10.03,22.97V45.41C69.45,35.79,77.67,28,87.8,28H424.2C434.34,28,442.55,35.79,442.55,45.4Zm-75.71,92.44-1.91-61.99a7.4,7.4,0,0,0-2.45-5.23,8.271,8.271,0,0,0-5.61-2.15,7.884,7.884,0,0,0-8.04,7.18l-3.37,54.19H330.1l-3.36-54.19a7.893,7.893,0,0,0-8.05-7.18h-.2a7.886,7.886,0,0,0-8.05,7.18l-3.37,54.19H291.71l-3.37-54.19a8.1,8.1,0,0,0-16.11.2l-1.91,61.99c0,27.43,15.09,54.07,35.63,62.06h.01l-7.1,144.49c-.01.3-.02.6-.02.9,0,10.3,8.8,18.74,19.74,18.74,11.27,0,20.26-8.94,19.73-19.64l-7.1-144.49C351.75,191.91,366.84,165.27,366.84,137.84ZM240.22,300.52c0-29.31-14.86-53.98-35.06-61.3l.01-.03L212.42,91.6c.01-.3.02-.59.02-.88,0-10.3-8.79-18.76-19.75-18.76-11.27,0-20.25,8.95-19.73,19.64l7.25,147.59.01.03c-20.2,7.32-35.06,31.99-35.06,61.3,0,35.08,21.28,63.51,47.53,63.51S240.22,335.6,240.22,300.52Z"
            />
          </g>
          <g>
            <path
              fill="#ed664c"
              d="M418.09,419.02V466.6c0,9.61-8.22,17.4-18.35,17.4H103.7c-18.92,0-34.25-14.55-34.25-32.49a31.562,31.562,0,0,1,10.03-22.97,35.1,35.1,0,0,1,24.22-9.52Z"
            />
          </g>
          <g>
            <path
              fill="#fdc75b"
              d="M331.21,199.9a34.307,34.307,0,0,1-25.25,0h-.01c-20.54-7.99-35.63-34.63-35.63-62.06l1.91-61.99a8.1,8.1,0,0,1,16.11-.2l3.37,54.19h15.36l3.37-54.19a7.886,7.886,0,0,1,8.05-7.18h.2a7.893,7.893,0,0,1,8.05,7.18l3.36,54.19h15.36l3.37-54.19a7.884,7.884,0,0,1,8.04-7.18,8.271,8.271,0,0,1,5.61,2.15,7.4,7.4,0,0,1,2.45,5.23l1.91,61.99C366.84,165.27,351.75,191.91,331.21,199.9Z"
            />
          </g>
          <g>
            <path
              fill="#fdc75b"
              d="M338.31,344.39c.53,10.7-8.46,19.64-19.73,19.64-10.94,0-19.74-8.44-19.74-18.74,0-.3.01-.6.02-.9l7.1-144.49a34.307,34.307,0,0,0,25.25,0Z"
            />
          </g>
          <g>
            <path
              fill="#fdc75b"
              d="M205.16,239.22c20.2,7.32,35.06,31.99,35.06,61.3,0,35.08-21.28,63.51-47.53,63.51s-47.53-28.43-47.53-63.51c0-29.31,14.86-53.98,35.06-61.3a36.286,36.286,0,0,1,24.94,0Z"
            />
          </g>
          <g>
            <path
              fill="#fdc75b"
              d="M212.44,90.72c0,.29-.01.58-.02.88l-7.25,147.59-.01.03a36.286,36.286,0,0,0-24.94,0l-.01-.03L172.96,91.6c-.52-10.69,8.46-19.64,19.73-19.64C203.65,71.96,212.44,80.42,212.44,90.72Z"
            />
          </g>
        </g>
        <g>
          <path
            d="M424.2,18H87.8C72.168,18,59,30.3,59,45.41v406.1C59,474.938,79.3,494,103.7,494H399.74c15.632,0,28.26-12.292,28.26-27.4V428.763c14-1.838,25-13.31,25-27.143V45.4C453,30.292,439.832,18,424.2,18ZM408,466.6c0,4.081-3.656,7.4-8.26,7.4H103.7c-13.371,0-24.25-10.089-24.25-22.49a21.564,21.564,0,0,1,6.911-15.724A25.043,25.043,0,0,1,103.7,429H408Zm25-64.98c0,4.08-4.2,7.38-8.8,7.38H103.7c-8.738,0-16.7,2.442-24.7,6.954V45.41C79,41.324,83.2,38,87.8,38H424.2c4.6,0,8.8,3.319,8.8,7.4Z"
          />
          <path
            d="M215.487 232.966L222.408 92.09c0-.049.005-.1.006-.149.014-.416.026-.819.026-1.221 0-15.859-13.346-28.76-29.75-28.76a30.309 30.309 0 0 0-21.884 9.279 28.02 28.02 0 0 0-7.834 20.851l6.921 140.877c-20.766 11.422-34.733 37.99-34.733 67.553 0 19.111 5.652 37.189 15.915 50.9C161.986 366 176.766 374.03 192.69 374.03s30.7-8.029 41.615-22.608c10.263-13.713 15.915-31.791 15.915-50.9C250.22 270.957 236.253 244.389 215.487 232.966zm-30.2-147.933a10.224 10.224 0 0 1 7.4-3.073c5.376 0 9.75 3.93 9.75 8.76 0 .151-.006.3-.011.459L195.75 227.135a46.291 46.291 0 0 0-6.12 0L182.948 91.113A8.2 8.2 0 0 1 185.288 85.033zm33 254.4c-7.043 9.41-16.135 14.592-25.6 14.592s-18.56-5.182-25.6-14.592c-7.691-10.277-11.927-24.1-11.927-38.918 0-24.483 11.706-45.825 28.469-51.9a26.3 26.3 0 0 1 9.061-1.422 28.538 28.538 0 0 1 9.061 1.8h0c16.761 6 28.467 27.227 28.467 51.709C230.22 315.529 225.984 329.161 218.293 339.438zM374.924 75.509a17.268 17.268 0 0 0-5.682-12.256A18.232 18.232 0 0 0 356.99 58.47l-.312 0A17.926 17.926 0 0 0 338.87 74.76c-.008.09-.015.179-.02.269l-1.066 17.139-1.063-17.137c-.006-.1-.013-.2-.023-.3a18.157 18.157 0 0 0-17.818-16.5c-.094 0-.191-.233-.285-.233h-.009a18.269 18.269 0 0 0-18.107 16.525c-.007.09-.014.3-.02.387L299.39 92.165 298.32 75c0-.089-.012-.164-.02-.253A17.924 17.924 0 0 0 280.482 58.46c-.1 0-.206.005-.309.006A17.846 17.846 0 0 0 262.235 75.54l-1.91 61.991c0 .1 0 .206 0 .308 0 28.894 14.5 56.25 35.326 68.18L288.872 343.9c0 .056-.006.155-.008.209-.013.4-.024.789-.024 1.183 0 15.848 13.341 28.74 29.74 28.74a30.313 30.313 0 0 0 21.9-9.289A27.99 27.99 0 0 0 348.3 343.9l-6.776-137.884c20.822-11.932 35.318-39.284 35.318-68.174 0-.1 0-.205 0-.308zM325.993 350.954a10.235 10.235 0 0 1-7.413 3.076c-5.371 0-9.74-3.921-9.74-8.74 0-.153.006-.306.012-.487l6.516-132.612c1.078.079 2.156.13 3.236.13s2.134-.051 3.2-.128l6.518 132.691A8.18 8.18 0 0 1 325.993 350.954zM327.53 190.6a24.241 24.241 0 0 1-17.894 0c-.088-.035-.176-.069-.264-.1-16.273-6.48-29-29.466-29.052-52.513l.622-20.187.787 12.74A10.07 10.07 0 0 0 291.71 140h15.36a10.07 10.07 0 0 0 9.981-9.459l1.536-24.75 1.532 24.768A10.051 10.051 0 0 0 330.1 140h15.36a10.07 10.07 0 0 0 9.981-9.459l.78-12.59.619 20.057C356.785 161.151 343.954 184.213 327.53 190.6z"
          />
        </g>
      </g>
    </svg>
  );
}

function DishSpinner(props: { className?: string }) {
  return (
    <div className={cn('dish-spinner', props.className)}>
      <div className="loader" />
      <style jsx>{`
        .dish-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loader {
          width: 2rem;
          height: 2rem;
          border: 0.0625rem currentColor solid;
          border-radius: 0.25rem;
          position: relative;
          background: linear-gradient(
              45deg,
              transparent 49%,
              currentColor 50%,
              currentColor 50%,
              transparent 51%,
              transparent
            ),
            linear-gradient(
              -45deg,
              transparent 49%,
              currentColor 50%,
              currentColor 50%,
              transparent 51%,
              transparent
            );
          background-size: 1rem 1rem;
          background-position: 0% 0%;
          animation: texture-shift 1s infinite linear;
        }

        @keyframes texture-shift {
          from {
            background-position: 0 0;
          }

          to {
            background-position: -1rem 0;
          }
        }
      `}</style>
    </div>
  );
}

type FilterMode = 'all' | 'tutorials' | 'history';

const getLocalStorageKeys = (userId: string | undefined) => {
  if (!userId) return null;
  return {
    CHAT_HISTORY: `recipeApp.chatHistory.${userId}`,
    RECENTLY_VIEWED: `recipeApp.recentlyViewed.${userId}`,
  };
};

export default function HomePage() {
  const { user } = useUser();
  const [allRecipes, setAllRecipes] = useState<(RecipeSummary | Recipe)[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<(RecipeSummary | Recipe)[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'dish' | 'ingredient'>('dish');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageMessage, setPageMessage] = useState('Discover delicious recipes from around the world.');
  const [isAiChatModalOpen, setIsAiChatModalOpen] = useState(false);
  const [currentRecipeForAi, setCurrentRecipeForAi] = useState<Recipe | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [aiChatHistory, setAiChatHistory] = useState<AiChatMessage[][]>([]);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterMode>('all');
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<(RecipeSummary | Recipe)[]>([]);
  
  const [suggestion, setSuggestion] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [isProfileSidebarOpen, setProfileSidebarOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  
  const [measurementSystem, setMeasurementSystem] = useLocalStorage<'metric' | 'imperial'>('measurementSystem', 'metric');

  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect to load/clear state when user changes
  useEffect(() => {
    // Clear state when user logs out
    if (!user) {
      setAiChatHistory([]);
      setRecentlyViewed([]);
      setIsStateLoaded(false); // Reset state loaded flag
      return;
    }
    
    const localStorageKeys = getLocalStorageKeys(user.uid);
    if (!localStorageKeys) return;

    // Load state from localStorage for the new user
    try {
      const storedChatHistory = localStorage.getItem(localStorageKeys.CHAT_HISTORY);
      if (storedChatHistory) {
        setAiChatHistory(JSON.parse(storedChatHistory));
      } else {
        setAiChatHistory([]); // Clear previous user's history
      }
      
      const storedRecentlyViewed = localStorage.getItem(localStorageKeys.RECENTLY_VIEWED);
      if (storedRecentlyViewed) {
        setRecentlyViewed(JSON.parse(storedRecentlyViewed));
      } else {
        setRecentlyViewed([]); // Clear previous user's recently viewed
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setAiChatHistory([]);
      setRecentlyViewed([]);
    } finally {
      setIsStateLoaded(true);
    }
  }, [user]);

  // Save chat history to localStorage
  useEffect(() => {
    if (!isStateLoaded || !user) return;
    const localStorageKeys = getLocalStorageKeys(user.uid);
    if (!localStorageKeys) return;

    try {
      localStorage.setItem(localStorageKeys.CHAT_HISTORY, JSON.stringify(aiChatHistory));
    } catch (error) {
       console.error("Failed to save chat history to localStorage", error);
    }
  }, [aiChatHistory, isStateLoaded, user]);

  // Save recently viewed to localStorage
  useEffect(() => {
    if (!isStateLoaded || !user) return;
    const localStorageKeys = getLocalStorageKeys(user.uid);
    if (!localStorageKeys) return;

    try {
      localStorage.setItem(localStorageKeys.RECENTLY_VIEWED, JSON.stringify(recentlyViewed));
    } catch (error) {
      console.error("Failed to save recently viewed to localStorage", error);
    }
  }, [recentlyViewed, isStateLoaded, user]);

  // Fetch AI suggestion
  useEffect(() => {
    if (!enableAiSuggestions) {
      setSuggestion('');
      return;
    }

    if (debouncedQuery.length > 2) {
      getSearchSuggestion(debouncedQuery).then(newSuggestion => {
        if (newSuggestion && newSuggestion.toLowerCase().startsWith(debouncedQuery.toLowerCase())) {
          setSuggestion(newSuggestion);
        } else {
          setSuggestion('');
        }
      });
    } else {
      setSuggestion('');
    }
  }, [debouncedQuery]);


  const searchPlaceholder = useMemo(() => {
    return searchMode === 'dish' 
      ? 'Search for a dish...' 
      : 'Enter ingredients, separated by commas...';
  }, [searchMode]);

  const applyFilters = useCallback(() => {
    let newFilteredRecipes: (RecipeSummary | Recipe)[] = [];
    let newMessage = '';

    if (activeFilter === 'all') {
      newFilteredRecipes = allRecipes;
      if (!hasSearched) {
        newMessage = 'Trending Recipes';
      } else if (allRecipes.length === 0 && !isPending && !isGenerating) {
        newMessage = `No recipes found for "${query}". Try a different search.`;
      }
    } else if (activeFilter === 'history') {
        newFilteredRecipes = recentlyViewed;
        newMessage = recentlyViewed.length > 0 ? 'Your Recent History' : 'You have no recently viewed recipes.';
    } else if (activeFilter === 'tutorials') {
      newFilteredRecipes = allRecipes.filter(r => 'youtubeUrl' in r && r.youtubeUrl);
      newMessage = newFilteredRecipes.length > 0 ? 'Recipes with Video Tutorials' : 'No video tutorials found in the current list.';
    }
    
    setFilteredRecipes(newFilteredRecipes);
    if (!isPending && !isGenerating) {
      setPageMessage(newMessage);
    }

  }, [allRecipes, activeFilter, hasSearched, recentlyViewed, isPending, isGenerating, query]);


  useEffect(() => {
    if (isStateLoaded) {
      applyFilters();
    }
  }, [isStateLoaded, activeFilter, allRecipes, applyFilters]);



  const loadTrending = useCallback(() => {
    setQuery('');
    setHasSearched(false);
    setAllRecipes([]);
    setActiveFilter('all');
    setPageMessage('');
    startTransition(async () => {
      try {
        setPageMessage('Loading trending recipes...');
        const trendingRecipes = await getTrendingRecipes();
        setAllRecipes(trendingRecipes);
        setPageMessage('Trending Recipes');
      } catch (error) {
        if (error instanceof Error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
        setPageMessage('Could not load trending recipes.');
      }
    });
  }, [toast]);
  
  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query) return;

    if (searchMode === 'ingredient' && !query.includes(',')) {
      toast({
        variant: 'destructive',
        title: 'Invalid Ingredient Format',
        description: 'Please separate multiple ingredients with a comma.',
      });
      return;
    }
    
    setHasSearched(true);
    setAllRecipes([]);
    setIsGenerating(true); // Set generating true immediately
    setActiveFilter('all');
    setSuggestion('');
    
    // Set the initial loading message immediately
    setPageMessage(`Searching for recipes for "${query}"...`);
    
    startTransition(async () => {
      try {
        const results = await searchRecipes({ query: query, mode: searchMode });
        
        if (results.source === 'Gemini' && results.recipes.length > 0) {
            setPageMessage(`Our AI chef is creating recipes for "${query}". This may take a moment...`);
        }
        
        setAllRecipes(results.recipes);

        if (results.recipes.length === 0) {
          setPageMessage(`No recipes found for "${query}". Try a different search.`);
        } else {
          setPageMessage(''); // Clear message on success
        }
      } catch (error) {
        if (error instanceof Error) {
            toast({ variant: 'destructive', title: 'Search Error', description: error.message });
        }
        setPageMessage('Could not complete search.');
      } finally {
        setIsGenerating(false);
      }
    });
  }, [query, searchMode, toast]);
  
  const resetToHome = () => {
      setQuery('');
      setHasSearched(false);
      setAllRecipes([]);
      setActiveFilter('all');
      loadTrending();
  };

  useEffect(() => {
    if (isStateLoaded) {
      loadTrending();
    }
  }, [isStateLoaded, loadTrending]);
  
  const addRecentlyViewed = (recipe: Recipe) => {
    setRecentlyViewed(prev => {
      const newHistory = [recipe, ...prev.filter(r => r.id !== recipe.id)];
      return newHistory.slice(0, 10); // Keep last 10
    });
  };

  const handleRecipeClick = async (recipeSummary: RecipeSummary | Recipe) => {
     if ('instructions' in recipeSummary) {
      setSelectedRecipe(recipeSummary);
      setIsModalOpen(true);
      if (recipeSummary.source !== 'User') { // Don't add user recipes to their own history
        addRecentlyViewed(recipeSummary);
      }
      return;
    }
      
    startTransition(async () => {
        try {
            const fullRecipe = await getRecipeDetails(recipeSummary.id, recipeSummary.source);
            if(fullRecipe) {
                setSelectedRecipe(fullRecipe);
                setIsModalOpen(true);
                addRecentlyViewed(fullRecipe);
            } else {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not load recipe details.' });
            }
        } catch (error) {
            if (error instanceof Error) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        }
    });
  };
  
  const handleAiChatClick = async (recipeSummary: RecipeSummary | Recipe) => {
    let fullRecipe: Recipe | null = null;
    if ('instructions' in recipeSummary) {
        fullRecipe = recipeSummary;
    } else {
        startTransition(async () => {
            fullRecipe = await getRecipeDetails(recipeSummary.id, recipeSummary.source);
            if (fullRecipe) {
                setCurrentRecipeForAi(fullRecipe);
                setIsAiChatModalOpen(true);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load recipe details to chat.' });
            }
        });
        return; 
    }
  
    if (fullRecipe) {
        setCurrentRecipeForAi(fullRecipe);
        setIsAiChatModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && suggestion && suggestion !== query) {
      e.preventDefault();
      setQuery(suggestion);
      setSuggestion('');
    }
  };
  
  const handleSaveChat = (messages: AiChatMessage[]) => {
    setAiChatHistory(prev => [...prev, messages]);
  };
  
  const handleClearChatHistory = () => {
    setAiChatHistory([]);
    toast({ title: "Chat History Cleared", description: "Your AI chat history has been successfully cleared." });
  };
  
  const handleShareClick = () => {
    if (user) {
        setIsShareModalOpen(true);
    } else {
        toast({
            variant: "destructive",
            title: "Authentication Required",
            description: "You must be signed in to share a recipe.",
        });
    }
  };


  const isLoading = isPending || isGenerating;

  return (
    <div className="min-h-screen w-full flex bg-background font-body">
      {/* Left Sidebar */}
      <TooltipProvider>
        <nav className="w-20 bg-card flex-col items-center py-6 gap-8 sticky top-0 h-screen hidden md:flex">
          <DishSpinner className="flex items-center justify-center" />
          <div className="flex flex-col gap-4 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className={`w-14 h-14 rounded-lg ${activeFilter === 'all' && !hasSearched ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`} onClick={resetToHome}>
                      <HomeIcon className="w-6 h-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Home</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className={`w-14 h-14 rounded-lg ${activeFilter === 'tutorials' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`} onClick={() => setActiveFilter('tutorials')}>
                      <BookOpen className="w-6 h-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Tutorials</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className={`w-14 h-14 rounded-lg ${activeFilter === 'history' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`} onClick={() => setActiveFilter('history')}>
                      <Clock className="w-6 h-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>History</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-14 h-14 rounded-lg text-muted-foreground" onClick={() => setIsChatHistoryOpen(true)}>
                      <MessageSquare className="w-6 h-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Chat History</p>
                </TooltipContent>
              </Tooltip>
          </div>
          <div className="mt-auto flex flex-col items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-14 h-14 rounded-lg text-muted-foreground"
                >
                  {mounted ? (theme === 'light' ? <Sun /> : <Moon />) : <Sun className="opacity-0" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </TooltipProvider>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 relative">
        <header className="sticky top-4 z-20 mb-8">
            <div className="bg-card/80 backdrop-blur-sm rounded-lg shadow-sm border p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KitchenBookIcon className="w-7 h-7" />
                    <h1 className="text-2xl font-bold font-headline">Dish Directory</h1>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                    <Button onClick={handleShareClick} variant="ghost" className="hidden sm:inline-flex items-center gap-2">
                        <Share className="w-4 h-4"/>
                        Share Recipe
                    </Button>
                    <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => setIsContactModalOpen(true)}>Contact Us</Button>
                    <Sheet open={isProfileSidebarOpen} onOpenChange={setProfileSidebarOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                        <span className="sr-only">Open Profile</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-80 p-0 border-l-0">
                        <SheetHeader className="p-6 sr-only">
                            <SheetTitle>User Profile</SheetTitle>
                            <SheetDescription>
                                View your profile information, recent activity, and culinary stats.
                            </SheetDescription>
                        </SheetHeader>
                        <ProfileSidebar 
                            recentlyViewed={recentlyViewed} 
                            onClearChatHistory={handleClearChatHistory}
                            measurementSystem={measurementSystem}
                            onMeasurementSystemChange={setMeasurementSystem}
                            onOpenSupport={() => setIsContactModalOpen(true)}
                            onOpenFaq={() => setIsFaqModalOpen(true)}
                        />
                    </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>

        <div className="flex flex-col items-center mb-8">
            <form onSubmit={handleSearch} className="w-full max-w-3xl">
              <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                  <AiSearchInput
                      value={query}
                      suggestion={suggestion}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder={searchPlaceholder}
                      className="pl-12 pr-14 py-3 h-12 rounded-lg bg-card border-border"
                  />
                  <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10">
                      <Search className="h-5 w-5" />
                      <span className="sr-only">Search</span>
                  </Button>
              </div>
            </form>

            <div className="mt-4 p-1 bg-muted rounded-lg flex items-center justify-center">
                <Button 
                    onClick={() => setSearchMode('dish')}
                    className={cn(
                        "w-32 px-2 py-1.5 rounded-md text-sm font-medium transition-colors flex-1",
                        searchMode === 'dish' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-transparent text-muted-foreground hover:bg-background/50'
                    )}
                >
                    <ChefHat className="w-4 h-4 mr-2" />
                    By Dish
                </Button>
                <Button 
                    onClick={() => setSearchMode('ingredient')}
                    className={cn(
                        "w-32 px-2 py-1.5 rounded-md text-sm font-medium transition-colors flex-1",
                        searchMode === 'ingredient' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-transparent text-muted-foreground hover:bg-background/50'
                    )}
                >
                    <Carrot className="w-4 h-4 mr-2" />
                    By Ingredient
                </Button>
            </div>
        </div>

        {isStateLoaded && isLoading && (
          <div className="flex flex-col items-center justify-start text-center h-full">
            <div className="text-muted-foreground mb-4 flex items-center justify-center gap-2">
              {isGenerating && <Sparkles className="w-5 h-5 text-primary animate-pulse" />}
              {pageMessage}
            </div>
            <div className="relative flex-grow flex items-center justify-center w-full pt-20">
              <div className="absolute top-1/3">
                <FireLoader />
              </div>
            </div>
          </div>
        )}

        {!isLoading && (
          <>
            {activeFilter === 'all' && !hasSearched && (
              <div className="bg-accent rounded-2xl p-6 sm:p-8 mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-headline text-foreground mb-2">Discover new recipes</h2>
                    <p className="text-muted-foreground">Find your next favorite meal today.</p>
                </div>
                <Image src="/food.png" alt="A delicious looking bowl of food" width={150} height={100} className="w-[100px] h-auto sm:w-[150px] rounded-lg" data-ai-hint="delicious food" />
              </div>
            )}
            {isStateLoaded && (
              <RecipeGrid 
                  recipes={filteredRecipes} 
                  onRecipeClick={handleRecipeClick}
                  onAiChatClick={handleAiChatClick}
                  message={pageMessage}
              />
            )}
          </>
        )}
      </main>

      <RecipeDetailModal 
          recipe={selectedRecipe}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAiChatClick={() => selectedRecipe && handleAiChatClick(selectedRecipe)}
          loading={isPending && isModalOpen && !selectedRecipe}
      />
      
      <AiChatModal
        isOpen={isAiChatModalOpen}
        onClose={() => setIsAiChatModalOpen(false)}
        recipe={currentRecipeForAi}
        askAiFunction={askRecipeExpert}
        onSaveChat={handleSaveChat}
      />

      <AiChatHistorySheet
        isOpen={isChatHistoryOpen}
        onClose={() => setIsChatHistoryOpen(false)}
        chatHistory={aiChatHistory}
      />
      
      {user && (
         <ShareRecipeModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            user={user}
        />
      )}

      <ContactUsModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        userEmail={user?.email || undefined}
      />

      <FaqModal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
      />
    </div>
  );

}

    
