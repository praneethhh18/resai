
'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import React from 'react';

interface AiSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suggestion?: string;
}

export function AiSearchInput({
  value,
  suggestion,
  className,
  ...props
}: AiSearchInputProps) {
  const displaySuggestion =
    suggestion &&
    suggestion.toLowerCase().startsWith(String(value).toLowerCase()) &&
    String(value).length > 0
      ? suggestion
      : '';

  return (
    <div className="relative">
      <Input
        type="text"
        className={cn('relative z-10 bg-transparent', className)}
        value={value}
        {...props}
      />
      <Input
        type="text"
        className={cn(
          'absolute inset-0 z-0 text-muted-foreground/80',
          className
        )}
        value={displaySuggestion}
        readOnly
        disabled
        aria-hidden="true"
      />
    </div>
  );
}
