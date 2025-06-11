'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration (default 5 seconds)
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    // Wait for exit animation before removing
    setTimeout(onRemove, 200);
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  const styles = {
    success: 'bg-green-900/20 border-green-500/30',
    error: 'bg-red-900/20 border-red-500/30',
    warning: 'bg-yellow-900/20 border-yellow-500/30',
    info: 'bg-blue-900/20 border-blue-500/30',
  };

  return (
    <div
      className={`
        max-w-sm w-full bg-gray-900 border rounded-lg shadow-lg p-4 transition-all duration-200
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${styles[toast.type]}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {icons[toast.type]}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-sm text-gray-400 mt-1">
              {toast.message}
            </p>
          )}
        </div>
        
        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
