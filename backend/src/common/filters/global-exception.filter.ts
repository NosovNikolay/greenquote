import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from '../exceptions/app.exception';
import { ErrorCode } from '../exceptions/error-codes';

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  path: string;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body = this.toErrorBody(exception, request.url);
    if (body.statusCode >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
        `${request.method} ${request.url}`,
      );
    } else {
      this.logger.warn(`${body.message} — ${request.method} ${request.url}`);
    }

    response.status(body.statusCode).json(body);
  }

  private toErrorBody(exception: unknown, path: string): ErrorBody {
    const timestamp = new Date().toISOString();

    if (exception instanceof AppException) {
      return {
        statusCode: exception.httpStatus,
        code: exception.code,
        message: exception.message,
        details: exception.details,
        path,
        timestamp,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : typeof res === 'object' && res !== null && 'message' in res
            ? this.stringifyMessage((res as { message: unknown }).message)
            : exception.message;
      const details =
        typeof res === 'object' && res !== null && 'error' in res
          ? (res as { error: unknown }).error
          : undefined;

      return {
        statusCode: status,
        code: this.httpCodeFromStatus(status),
        message,
        details,
        path,
        timestamp,
      };
    }

    /** FK violation: e.g. JWT user id no longer in DB after reset — avoid opaque 500. */
    const pgCode = this.findPostgresErrorCode(exception);
    if (pgCode === '23503') {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: ErrorCode.UNAUTHORIZED,
        message:
          'Your session is no longer valid for this database. Please sign in again.',
        path,
        timestamp,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL,
      message: 'Internal server error',
      path,
      timestamp,
    };
  }

  /** Walks Error.cause chain (Drizzle wraps node-postgres errors). */
  private findPostgresErrorCode(exception: unknown): string | undefined {
    const seen = new Set<unknown>();
    let current: unknown = exception;
    for (let depth = 0; depth < 10 && current != null; depth++) {
      if (seen.has(current)) {
        break;
      }
      seen.add(current);
      if (
        typeof current === 'object' &&
        current !== null &&
        'code' in current
      ) {
        const code = (current as { code: unknown }).code;
        if (typeof code === 'string' && /^[0-9]{5}$/.test(code)) {
          return code;
        }
      }
      if (
        current instanceof Error &&
        'cause' in current &&
        (current as Error & { cause?: unknown }).cause !== undefined
      ) {
        current = (current as Error & { cause: unknown }).cause;
        continue;
      }
      break;
    }
    return undefined;
  }

  private stringifyMessage(message: unknown): string {
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
    return JSON.stringify(message);
  }

  private httpCodeFromStatus(status: number): ErrorCode {
    if (status >= 500) return ErrorCode.INTERNAL;
    if (status === 401) return ErrorCode.UNAUTHORIZED;
    if (status === 403) return ErrorCode.FORBIDDEN;
    if (status === 404) return ErrorCode.NOT_FOUND;
    if (status === 409) return ErrorCode.CONFLICT;
    if (status === 400) return ErrorCode.VALIDATION;
    return ErrorCode.BAD_REQUEST;
  }
}
