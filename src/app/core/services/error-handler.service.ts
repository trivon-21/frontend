import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/api-response.model';

/**
 * Service: Centralized error handling and logging
 * Provides consistent error formatting across the application
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  constructor() {}

  /**
   * Handle HTTP errors with standardized format
   */
  handleError(error: HttpErrorResponse): ApiError {
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage =
        error.error?.message ||
        error.error?.error ||
        error.message ||
        errorMessage;
    }

    const apiError: ApiError = {
      statusCode: error.status,
      message: errorMessage,
      error: error.error?.error || error.statusText,
      timestamp: new Date(),
    };

    this.logError(apiError);
    return apiError;
  }

  /**
   * Log error to console (can be extended to send to logging service)
   */
  private logError(error: ApiError): void {
    console.error(`[${error.statusCode}] ${error.message}:`, error);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: ApiError): string {
    const statusMessages: { [key: number]: string } = {
      400: 'Invalid request. Please check your input.',
      401: 'Session expired. Please log in again.',
      403: 'You do not have permission to perform this action.',
      404: 'Resource not found.',
      500: 'Server error. Please try again later.',
      503: 'Service unavailable. Please try again later.',
    };

    return statusMessages[error.statusCode] || error.message;
  }
}
