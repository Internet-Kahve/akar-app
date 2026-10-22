import type { FastifyError, FastifyInstance } from "fastify";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";

/** Contract: docs/API-HANDOFF.md "Örnek hata sözleşmesi". */
export type ErrorBody = {
  error: {
    code: string;
    message: string;
    fieldErrors: Record<string, string[]>;
    requestId: string;
  };
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string[]>;

  constructor(statusCode: number, code: string, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function registerErrorHandling(app: FastifyInstance): void {
  app.setNotFoundHandler((req, reply) => {
    reply.status(404).send(body("NOT_FOUND", "Kaynak bulunamadı.", {}, req.id));
  });

  app.setErrorHandler((err: FastifyError | AppError, req, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.statusCode).send(body(err.code, err.message, err.fieldErrors, req.id));
    }
    if (hasZodFastifySchemaValidationErrors(err)) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of err.validation) {
        const path = issue.instancePath.replace(/^\//, "").replaceAll("/", ".") || "_";
        (fieldErrors[path] ??= []).push(issue.message ?? "Geçersiz değer.");
      }
      return reply.status(400).send(body("VALIDATION_FAILED", "Girdi doğrulanamadı.", fieldErrors, req.id));
    }
    if (err.statusCode === 429) {
      return reply.status(429).send(body("RATE_LIMITED", "Çok fazla istek. Biraz sonra tekrar dene.", {}, req.id));
    }
    if (err.statusCode && err.statusCode < 500) {
      return reply.status(err.statusCode).send(body(err.code ?? "BAD_REQUEST", err.message, {}, req.id));
    }
    req.log.error({ err }, "unhandled error");
    return reply.status(500).send(body("INTERNAL", "Beklenmeyen bir hata oluştu.", {}, req.id));
  });
}

function body(code: string, message: string, fieldErrors: Record<string, string[]>, requestId: string): ErrorBody {
  return { error: { code, message, fieldErrors, requestId } };
}
