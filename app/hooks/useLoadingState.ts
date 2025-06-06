import { useState, useEffect } from 'react';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface UseLoadingStateOptions {
  initialState?: LoadingState;
  autoReset?: number; // Auto-reset after X ms
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const { initialState = 'idle', autoReset } = options;
  const [state, setState] = useState<LoadingState>(initialState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoReset && (state === 'success' || state === 'error')) {
      const timer = setTimeout(() => {
        setState('idle');
        setError(null);
      }, autoReset);

      return () => clearTimeout(timer);
    }
  }, [state, autoReset]);

  const setLoading = () => {
    setState('loading');
    setError(null);
  };

  const setSuccess = () => {
    setState('success');
    setError(null);
  };
  const setErrorState = (errorMessage: string) => {
    setState('error');
    setError(errorMessage);
  };

  const reset = () => {
    setState('idle');
    setError(null);
  };

  return {
    state,
    error,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
    setLoading,
    setSuccess,
    setError: setErrorState,
    reset
  };
}
