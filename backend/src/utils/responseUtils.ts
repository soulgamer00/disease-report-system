// backend/src/utils/responseUtils.ts

import { Response } from 'express';

// Standardized response interfaces
export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
}

// Response utility class - Single pattern for all responses
export class ResponseUtils {
  /**
   * Send successful response
   */
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200
  ): Response {
    const response: SuccessResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    error?: string,
    code?: string
  ): Response {
    const response: ErrorResponse = {
      success: false,
      message,
      error,
      code,
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   */
  static validationError(
    res: Response,
    message: string,
    errors: Array<{ field: string; message: string }>,
    statusCode: number = 400
  ): Response {
    const response: ErrorResponse = {
      success: false,
      message,
      errors,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send not found error
   */
  static notFound(
    res: Response,
    message: string,
    resource?: string
  ): Response {
    return this.error(res, message, 404, undefined, 'NOT_FOUND');
  }

  /**
   * Send unauthorized error
   */
  static unauthorized(
    res: Response,
    message: string = 'Unauthorized access'
  ): Response {
    return this.error(res, message, 401, undefined, 'UNAUTHORIZED');
  }

  /**
   * Send forbidden error
   */
  static forbidden(
    res: Response,
    message: string = 'Access forbidden'
  ): Response {
    return this.error(res, message, 403, undefined, 'FORBIDDEN');
  }

  /**
   * Send conflict error
   */
  static conflict(
    res: Response,
    message: string,
    resource?: string
  ): Response {
    return this.error(res, message, 409, undefined, 'CONFLICT');
  }

  /**
   * Send internal server error
   */
  static internalError(
    res: Response,
    message: string = 'Internal server error',
    error?: string
  ): Response {
    return this.error(res, message, 500, error, 'INTERNAL_ERROR');
  }
}