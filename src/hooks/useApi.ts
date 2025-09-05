import { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';
import type { ApiError } from '@/types/api';

// Generic API state
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Hook for API calls with loading states
export function useApi<T>(apiCall: () => Promise<T>, dependencies: any[] = []) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  const retry = useCallback(() => {
    execute();
  }, [execute]);

  return {
    ...state,
    execute,
    retry,
  };
}

// Hook for manual API calls (don't execute automatically)
export function useApiCall<T, P extends any[] = []>(
  apiCall: (...params: P) => Promise<T>
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...params: P) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await apiCall(...params);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        throw error;
      }
    },
    [apiCall]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Hook for paginated API calls
export function usePaginatedApi<T>(
  apiCall: (
    page: number,
    perPage: number
  ) => Promise<{
    data: T[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }>,
  initialPage = 1,
  perPage = 10
) {
  const [state, setState] = useState({
    data: [] as T[],
    loading: false,
    error: null as string | null,
    currentPage: initialPage,
    lastPage: 1,
    total: 0,
    perPage,
  });

  const loadPage = useCallback(
    async (page: number) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await apiCall(page, perPage);
        setState(prev => ({
          ...prev,
          data: result.data,
          loading: false,
          currentPage: result.meta.current_page,
          lastPage: result.meta.last_page,
          total: result.meta.total,
        }));
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      }
    },
    [apiCall, perPage]
  );

  useEffect(() => {
    loadPage(initialPage);
  }, [loadPage, initialPage]);

  const nextPage = useCallback(() => {
    if (state.currentPage < state.lastPage) {
      loadPage(state.currentPage + 1);
    }
  }, [state.currentPage, state.lastPage, loadPage]);

  const previousPage = useCallback(() => {
    if (state.currentPage > 1) {
      loadPage(state.currentPage - 1);
    }
  }, [state.currentPage, loadPage]);

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= state.lastPage) {
        loadPage(page);
      }
    },
    [state.lastPage, loadPage]
  );

  return {
    ...state,
    loadPage,
    nextPage,
    previousPage,
    goToPage,
    hasNextPage: state.currentPage < state.lastPage,
    hasPreviousPage: state.currentPage > 1,
  };
}

// Utility function to extract error message
function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;
    return apiError?.message || error.message || 'An error occurred';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}
