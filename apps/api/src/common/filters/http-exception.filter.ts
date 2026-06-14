import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { PrismaService } from '../../prisma/prisma.service';

type ErrorResponseBody = {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  method: string;
  timestamp: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly prisma?: PrismaService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message = this.extractMessage(exceptionResponse, exception);
    const error = this.extractError(exceptionResponse, status);

    const body: ErrorResponseBody = {
      statusCode: status,
      error,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    if (request.url.startsWith('/internal') && status >= 400) {
      void this.recordInternalFailureAudit({
        request,
        status,
        error,
        message,
        exception,
      });
    }

    response.status(status).json(body);
  }

  private async recordInternalFailureAudit({
    request,
    status,
    error,
    message,
    exception,
  }: {
    request: Request;
    status: number;
    error: string;
    message: string | string[];
    exception: unknown;
  }) {
    if (!this.prisma) {
      return;
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          action:
            status >= 500
              ? 'PLATFORM_RUNTIME_ERROR'
              : 'INTERNAL_API_REQUEST_FAILED',
          entityType: 'InternalApiRequest',
          entityId: request.url,
          metadata: {
            method: request.method,
            path: request.url,
            statusCode: status,
            error,
            message,
            role: this.normaliseHeader(request.headers['x-internal-role']),
            userAgent: this.normaliseHeader(request.headers['user-agent']),
            exceptionName:
              exception instanceof Error ? exception.name : 'UnknownException',
          },
        },
      });
    } catch {
      // Do not let audit logging failure break the original error response.
    }
  }

  private normaliseHeader(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return value ?? null;
  }

  private extractMessage(
    exceptionResponse: string | object | null,
    exception: unknown,
  ): string | string[] {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const responseWithMessage = exceptionResponse as {
        message: string | string[];
      };

      return responseWithMessage.message;
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return 'Internal server error';
  }

  private extractError(
    exceptionResponse: string | object | null,
    status: number,
  ): string {
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'error' in exceptionResponse
    ) {
      const responseWithError = exceptionResponse as { error: string };

      return responseWithError.error;
    }

    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      default:
        return 'Internal Server Error';
    }
  }
}
