import type { FastifyRequest } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { AppError } from "../../errors.ts";
import { requireRole, requireUser } from "../../platform/auth.ts";
import { idempotent } from "../../platform/idempotency.ts";
import { IdParams } from "../catalog/schemas.ts";
import { MAX_UPLOAD_BYTES, mediaTypeOf, megabytes } from "./magic.ts";
import {
  CompleteUploadBody,
  ErrorResponse,
  FsUploadParams,
  ListMediaQuery,
  MediaItem,
  MediaListResponse,
  RequestUploadBody,
  UpdateMediaBody,
  UploadTicket,
} from "./schemas.ts";
import {
  completeUpload,
  createUpload,
  GLB_PARTS_JOB,
  listMedia,
  MAX_OPEN_UPLOADS,
  planUpload,
  requireDep,
  runGlbPartsJob,
  storeUploadedObject,
  updateMedia,
} from "./service.ts";
import { isFsStorage, type FsStorage, type UploadGrant } from "./storage-fs.ts";

const tooLarge = (maxBytes: number) => new AppError(413, "PAYLOAD_TOO_LARGE", `Dosya en fazla ${megabytes(maxBytes)} olabilir.`);

/**
 * `PUT /v1/media/uploads/fs/:token`: the upload target the filesystem driver hands out in place of an
 * S3 presigned URL. The token is the credential, so no sign-in is needed; it pins the object key, the
 * content type and the size cap, and it writes only while the upload behind it is still pending.
 */
const fsUploadRoutes: FastifyPluginAsyncZod<{ storage: FsStorage }> = async (app, { storage }) => {
  // The body is raw bytes of any type: no JSON or text parsing, one catch-all buffer parser.
  app.removeAllContentTypeParsers();
  app.addContentTypeParser("*", { parseAs: "buffer", bodyLimit: MAX_UPLOAD_BYTES }, (_req, body, done) => done(null, body));

  function checkLink(req: FastifyRequest): UploadGrant {
    const params = FsUploadParams.safeParse(req.params);
    const checked = storage.verifyUploadToken(params.success ? params.data.token : "");
    if (!checked.ok) {
      throw new AppError(
        403,
        "FORBIDDEN",
        checked.reason === "expired" ? "Yükleme bağlantısının süresi doldu. Yeni bir yükleme başlat." : "Yükleme bağlantısı geçersiz.",
      );
    }
    if (mediaTypeOf(req.headers["content-type"] ?? "") !== checked.grant.contentType) {
      throw new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Dosya türü yükleme izniyle uyuşmuyor.");
    }
    if (Number(req.headers["content-length"]) > checked.grant.maxBytes) throw tooLarge(checked.grant.maxBytes);
    return checked.grant;
  }

  // Forged, expired, mistyped or oversized uploads are refused before their body is read.
  app.addHook("onRequest", async (req) => {
    checkLink(req);
  });

  app.put(
    "/v1/media/uploads/fs/:token",
    {
      bodyLimit: MAX_UPLOAD_BYTES,
      schema: {
        tags: ["media"],
        summary: "Dosya sistemi depolamasına yükleme (S3 imzalı adresinin yerine geçer; yalnız geliştirme ve çevrimdışı)",
        params: FsUploadParams,
        response: { 204: z.null(), 400: ErrorResponse, 403: ErrorResponse, 404: ErrorResponse, 409: ErrorResponse, 413: ErrorResponse, 415: ErrorResponse },
      },
    },
    async (req, reply) => {
      const grant = checkLink(req);
      const body = req.body;
      if (!Buffer.isBuffer(body) || body.length === 0) throw new AppError(400, "VALIDATION_FAILED", "Dosya boş.");
      if (body.length > grant.maxBytes) throw tooLarge(grant.maxBytes);
      await storeUploadedObject(app.deps.db, storage, grant, body);
      return reply.status(204).send(null);
    },
  );
};

export const mediaRoutes: FastifyPluginAsyncZod = async (app) => {
  const { db, storage, jobs } = app.deps;

  await jobs?.work(GLB_PARTS_JOB, (data) => runGlbPartsJob({ db, storage, log: app.log }, data));
  if (isFsStorage(storage)) await app.register(fsUploadRoutes, { storage });

  app.post(
    "/v1/media/uploads",
    {
      preHandler: requireUser,
      schema: {
        tags: ["media"],
        summary: `Medya yükleme izni: tür ve boyut doğrulanır, imzalı yükleme adresi döner; hesap başına en çok ${MAX_OPEN_UPLOADS} açık yükleme`,
        body: RequestUploadBody,
        response: {
          201: UploadTicket,
          400: ErrorResponse,
          401: ErrorResponse,
          403: ErrorResponse,
          413: ErrorResponse,
          415: ErrorResponse,
          422: ErrorResponse,
          429: ErrorResponse,
          503: ErrorResponse,
        },
      },
    },
    async (req, reply) => {
      const user = req.user!;
      const store = requireDep(storage, "Dosya depolama");
      const extension = planUpload(user, req.body);
      if (req.body.kind === "model") requireDep(jobs, "İş kuyruğu");
      const result = await idempotent(db, req, user.id, (tx) => createUpload(tx, store, user, req.body, extension));
      return reply.status(result.status as 201).send(result.body);
    },
  );

  app.post(
    "/v1/media/uploads/:id/complete",
    {
      preHandler: requireUser,
      schema: {
        tags: ["media"],
        summary: "Yüklemeyi tamamla: boyut ve dosya içeriği doğrulanır, kalıcı medya kaydı oluşur",
        params: IdParams,
        body: CompleteUploadBody,
        response: {
          200: MediaItem,
          201: MediaItem,
          400: ErrorResponse,
          401: ErrorResponse,
          404: ErrorResponse,
          409: ErrorResponse,
          413: ErrorResponse,
          415: ErrorResponse,
          422: ErrorResponse,
          503: ErrorResponse,
        },
      },
    },
    async (req, reply) => {
      const user = req.user!;
      const store = requireDep(storage, "Dosya depolama");
      const created: { modelId: string | undefined } = { modelId: undefined };
      const result = await idempotent(db, req, user.id, async (tx) => {
        const done = await completeUpload(tx, { storage: store, jobs, user, requestId: req.id }, req.params.id, req.body);
        created.modelId = done.modelId;
        return done.result;
      });
      // Only after the commit: a worker that picks the job up must find the row.
      if (created.modelId) await requireDep(jobs, "İş kuyruğu").send(GLB_PARTS_JOB, { mediaId: created.modelId });
      return reply.status(result.status as 200 | 201 | 409 | 413 | 415).send(result.body);
    },
  );

  app.get(
    "/v1/admin/media",
    {
      preHandler: requireRole("editor"),
      schema: {
        tags: ["admin-media"],
        summary: "Medya kütüphanesi: türe göre süzülür, yeniden eskiye, keyset sayfalama",
        querystring: ListMediaQuery,
        response: { 200: MediaListResponse, 400: ErrorResponse, 401: ErrorResponse, 403: ErrorResponse },
      },
    },
    async (req) => listMedia(db, req.query),
  );

  app.patch(
    "/v1/admin/media/:id",
    {
      preHandler: requireRole("editor"),
      schema: {
        tags: ["admin-media"],
        summary: "Medya bilgisini güncelle: alt metin, başlık, açıklama, lisans, kaynak, güven düzeyi",
        params: IdParams,
        body: UpdateMediaBody,
        response: { 200: MediaItem, 400: ErrorResponse, 401: ErrorResponse, 403: ErrorResponse, 404: ErrorResponse, 422: ErrorResponse },
      },
    },
    async (req, reply) => {
      const user = req.user!;
      const result = await idempotent(db, req, user.id, (tx) => updateMedia(tx, user, req.params.id, req.body, req.id));
      return reply.status(result.status as 200).send(result.body);
    },
  );
};
