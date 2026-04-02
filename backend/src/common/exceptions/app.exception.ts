import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes';

export class AppException extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly httpStatus: HttpStatus,
    message: string,
    public readonly details?: unknown,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'AppException';
  }

  static notFound(message: string, details?: unknown): AppException {
    return new AppException(
      ErrorCode.NOT_FOUND,
      HttpStatus.NOT_FOUND,
      message,
      details,
    );
  }

  static forbidden(message: string, details?: unknown): AppException {
    return new AppException(
      ErrorCode.FORBIDDEN,
      HttpStatus.FORBIDDEN,
      message,
      details,
    );
  }

  static conflict(message: string, details?: unknown): AppException {
    return new AppException(
      ErrorCode.CONFLICT,
      HttpStatus.CONFLICT,
      message,
      details,
    );
  }

  static badRequest(message: string, details?: unknown): AppException {
    return new AppException(
      ErrorCode.BAD_REQUEST,
      HttpStatus.BAD_REQUEST,
      message,
      details,
    );
  }

  static unauthorized(message: string, details?: unknown): AppException {
    return new AppException(
      ErrorCode.UNAUTHORIZED,
      HttpStatus.UNAUTHORIZED,
      message,
      details,
    );
  }

  static internal(
    message: string,
    details?: unknown,
    cause?: unknown,
  ): AppException {
    let options: ErrorOptions | undefined;
    if (cause instanceof Error) {
      options = { cause };
    } else if (cause !== undefined) {
      const serialized =
        typeof cause === 'string' ||
        typeof cause === 'number' ||
        typeof cause === 'boolean' ||
        typeof cause === 'bigint'
          ? String(cause)
          : JSON.stringify(cause);
      options = { cause: new Error(serialized) };
    }
    return new AppException(
      ErrorCode.INTERNAL,
      HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      details,
      options,
    );
  }
}
