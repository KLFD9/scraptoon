'use client';

import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'inline' | 'card' | 'toast';
  className?: string;
}

export default function ErrorMessage({ 
  message, 
  onRetry, 
  onDismiss, 
  variant = 'inline',
  className = '' 
}: ErrorMessageProps) {
  const baseClasses = "flex items-center gap-2 text-sm";
  
  const variantClasses = {
    inline: "text-red-400",
    card: "p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-red-400",
    toast: "p-3 bg-red-950/90 backdrop-blur-sm border border-red-900/50 rounded-lg text-red-300 shadow-lg"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      
      <div className="flex items-center gap-1">
        {onRetry && (
          <button
            onClick={onRetry}
            className="p-1 hover:bg-red-900/30 rounded transition-colors"
            title="Réessayer"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-red-900/30 rounded transition-colors"
            title="Fermer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
