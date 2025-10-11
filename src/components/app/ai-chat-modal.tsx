
'use client';

import { useState, useRef, useEffect } from 'react';
import { Recipe, AiChatMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, CornerDownLeft, Loader2, Utensils } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  askAiFunction: (recipe: Recipe, question: string) => Promise<string>;
  onSaveChat: (messages: AiChatMessage[]) => void;
}

export function AiChatModal({ isOpen, onClose, recipe, askAiFunction, onSaveChat }: AiChatModalProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && recipe) {
      setMessages([
        {
          sender: 'ai',
          text: `Hi there! I'm your AI recipe expert. Feel free to ask me anything about "${recipe.name}". For example: "Can I use a different ingredient?" or "What's a good side dish for this?"`,
          recipeName: recipe.name,
        },
      ]);
      setInput('');
      setIsLoading(false);
    }
  }, [isOpen, recipe]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !recipe) return;

    const userMessage: AiChatMessage = { sender: 'user', text: input, recipeName: recipe.name };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await askAiFunction(recipe, input);
      const aiMessage: AiChatMessage = { sender: 'ai', text: aiResponse, recipeName: recipe.name };
      setMessages(prev => [...prev, aiMessage]);
      onSaveChat([...newMessages, aiMessage]); // Save the full conversation
    } catch (error) {
      console.error('AI chat failed:', error);
      const errorMessage: AiChatMessage = {
        sender: 'ai',
        text: "Sorry, I'm having a little trouble thinking right now. Please try again in a moment.",
        recipeName: recipe.name,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  }
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[525px] h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="w-6 h-6 text-primary" />
            Ask Your AI Recipe Expert
          </DialogTitle>
          {recipe && <DialogDescription>
            Get instant help with substitutions, pairings, and techniques for &ldquo;{recipe.name}&rdquo;.
          </DialogDescription>}
        </DialogHeader>
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}
              >
                {message.sender === 'ai' && (
                  <Avatar className="w-8 h-8">
                     <AvatarFallback className="bg-primary text-primary-foreground">
                        <Utensils className="w-5 h-5"/>
                     </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg px-3 py-2 max-w-sm ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
                {message.sender === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                        <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
                <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                        <Utensils className="w-5 h-5"/>
                        </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg px-3 py-2 bg-muted flex items-center">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-2 border-t">
          <div className="relative w-full">
            <Input
              placeholder="e.g., Can I make this gluten-free?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="pr-12"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={handleSend}
              disabled={isLoading}
            >
              <CornerDownLeft className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
