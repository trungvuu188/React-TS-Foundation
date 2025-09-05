// Common API response structure
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  errors?: Record<string, string[]>;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Search parameters
export interface SearchParams extends PaginationParams {
  search?: string;
  filters?: Record<string, any>;
}

// API Error structure
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}
