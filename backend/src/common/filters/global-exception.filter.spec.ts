import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { AppException } from '../exceptions/app.exception';
import { ErrorCode } from '../exceptions/error-codes';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();
  let statusCode = 0;
  let jsonBody: unknown;

  function createHost(url: string): ArgumentsHost {
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (body: unknown) => {
        jsonBody = body;
      },
    };
    return {
      switchToHttp: () => ({
        getResponse: () => res,
        getRequest: () => ({ url, method: 'GET' }),
      }),
    } as unknown as ArgumentsHost;
  }

  beforeEach(() => {
    statusCode = 0;
    jsonBody = undefined;
  });

  it('maps AppException.notFound', () => {
    filter.catch(AppException.notFound('gone'), createHost('/api/x'));
    expect(statusCode).toBe(404);
    expect(jsonBody).toMatchObject({
      code: ErrorCode.NOT_FOUND,
      message: 'gone',
      path: '/api/x',
    });
  });

  it('maps AppException.conflict', () => {
    filter.catch(
      AppException.conflict('dup'),
      createHost('/api/auth/register'),
    );
    expect(statusCode).toBe(409);
    expect(jsonBody).toMatchObject({
      code: ErrorCode.CONFLICT,
      message: 'dup',
    });
  });

  it('maps AppException.badRequest', () => {
    filter.catch(
      AppException.badRequest('bad', { x: 1 }),
      createHost('/api/quotes'),
    );
    expect(statusCode).toBe(400);
    expect(jsonBody).toMatchObject({
      code: ErrorCode.BAD_REQUEST,
      message: 'bad',
      details: { x: 1 },
    });
  });

  it('maps HttpException (validation) to VALIDATION code for 400', () => {
    filter.catch(
      new HttpException({ message: ['a', 'b'] }, HttpStatus.BAD_REQUEST),
      createHost('/api/q'),
    );
    expect(statusCode).toBe(400);
    expect(jsonBody).toMatchObject({
      code: ErrorCode.VALIDATION,
      message: 'a, b',
    });
  });

  it('maps unknown errors to 500 INTERNAL', () => {
    filter.catch(new Error('boom'), createHost('/api/z'));
    expect(statusCode).toBe(500);
    expect(jsonBody).toMatchObject({
      code: ErrorCode.INTERNAL,
      message: 'Internal server error',
    });
  });

  it('maps Postgres FK violation (23503) to 401 — stale JWT after DB reset', () => {
    const pgErr = Object.assign(new Error('insert violates FK'), {
      code: '23503',
    });
    const wrapped = new Error('Failed query', { cause: pgErr });
    filter.catch(wrapped, createHost('/api/quotes'));
    expect(statusCode).toBe(401);
    expect(jsonBody).toMatchObject({
      code: ErrorCode.UNAUTHORIZED,
      message: expect.stringMatching(/sign in again/i),
    });
  });
});
