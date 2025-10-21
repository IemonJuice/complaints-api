import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): Observable<ErrorResponse> {
    if (exception instanceof RpcException) {
      const error = exception.getError();
      if (typeof error === 'object' && error !== null) {
        return throwError(() => error as ErrorResponse);
      }
    }

    if (this.isErrorWithStatus(exception)) {
      return throwError(() => ({
        statusCode: exception.statusCode,
        message: exception.message,
        error: exception.error || 'Error',
      }));
    }

    if (exception instanceof Error) {
      return throwError(() => ({
        statusCode: 500,
        message: exception.message,
        error: exception.name,
      }));
    }

    return throwError(() => ({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Error',
    }));
  }

  private isErrorWithStatus(
    error: unknown,
  ): error is { statusCode: number; message: string; error?: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      'message' in error &&
      typeof (error as { statusCode: unknown }).statusCode === 'number' &&
      typeof (error as { message: unknown }).message === 'string'
    );
  }
}