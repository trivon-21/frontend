export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  timestamp?: Date;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  limit: number;
  skip: number;
  page?: number;
  totalPages?: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: Date;
}
