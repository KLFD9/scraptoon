'use client';

import { useToast, ToastType } from '../hooks/useToast';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onRemove: (id: string) => void;
}

function Toast({ id, type, message, onRemove }: ToastProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle
  };

  const colors = {
    success: 'border-green-500/50 bg-green-950/90 text-green-300',
    error: 'border-red-500/50 bg-red-950/90 text-red-300',
    info: 'border-blue-500/50 bg-blue-950/90 text-blue-300',
    warning: 'border-yellow-500/50 bg-yellow-950/90 text-yellow-300'
  };

  const Icon = icons[type];

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border backdrop-blur-sm shadow-lg transition-all duration-300 ${colors[type]}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={() => onRemove(id)}
        className="p-1 hover:bg-black/20 rounded transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; type: ToastType; message: string }>;
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
