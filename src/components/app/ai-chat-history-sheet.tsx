
'use client';

import { AiChatMessage } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { User, Utensils } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface AiChatHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistory: AiChatMessage[][];
}

export function AiChatHistorySheet({ isOpen, onClose, chatHistory }: AiChatHistorySheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[400px] sm:w-[540px] p-0">
        <SheetHeader className="p-6">
          <SheetTitle>AI Chat History</SheetTitle>
          <SheetDescription>
            Review your past conversations with the AI Recipe Expert.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          {chatHistory.length > 0 ? (
            <Accordion type="single" collapsible className="w-full px-6">
              {chatHistory.map((conversation, convoIndex) => {
                const recipeName = conversation[0]?.recipeName || 'Conversation';
                return (
                  <AccordionItem value={`item-${convoIndex}`} key={convoIndex}>
                    <AccordionTrigger>{`Conversation about "${recipeName}"`}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {conversation.map((message, msgIndex) => (
                           <div
                            key={msgIndex}
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
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <p>You have no chat history yet.</p>
              <p className="text-sm">Start a conversation with the AI expert to see your history here.</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

    