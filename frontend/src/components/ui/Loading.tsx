import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function Loading({ size = 'md', text, className = '' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const containerClasses = {
    sm: 'gap-2 text-sm',
    md: 'gap-3 text-base',
    lg: 'gap-4 text-lg'
  };

  return (
    <div className={`flex items-center justify-center ${containerClasses[size]} ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-muted border-t-primary ${sizeClasses[size]}`} />
      {text && (
        <span className="text-muted-foreground">{text}</span>
      )}
    </div>
  );
}

// Full page loading component
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="property-card">
        <Loading size="lg" text={text} />
      </div>
    </div>
  );
}

// Inline loading for smaller components
export function InlineLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <Loading size="sm" text={text} />
    </div>
  );
}