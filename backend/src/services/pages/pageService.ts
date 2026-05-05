import slugify from "slugify";
import { prisma } from "../../lib/prisma";
import { PageSchemaJsonSchema, createEmptyPageSchemaJson } from "../../model/pageSchema";
import { newId, newShortId } from "../../lib/id";

export class NotFoundError extends Error {
  status = 404;
}

export class BadRequestError extends Error {
  status = 400;
}

export function pickPageSlugBase(title: string) {
  const s = slugify(title, { lower: true, strict: true });
  return s.length ? s : `page-${newShortId(6)}`;
}

async function ensureUniqueSlug(ownerId: string, baseSlug: string, excludePageId?: string) {
  let attempt = 0;
  while (attempt < 10) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${newShortId(4)}`;
    const existing = await prisma.page.findFirst({
      where: { ownerId, slug: candidate },
      select: { id: true }
    });
    if (!existing || existing.id === excludePageId) return candidate;
    attempt++;
  }
  throw new BadRequestError("Не удалось создать уникальный slug");
}

export async function createPageDraft(input: { ownerId: string; createdById: string; title: string }) {
  const schemaJson = createEmptyPageSchemaJson();
  const parsed = PageSchemaJsonSchema.parse(schemaJson);

  // versionNo: 1 (чтобы было удобно в UI/истории)
  const page = await prisma.page.create({
    data: {
      ownerId: input.ownerId,
      title: input.title,
      status: "DRAFT",
      versions: {
        create: {
          versionNo: 1,
          schemaJson: parsed,
          createdById: input.createdById
        }
      }
    }
  });

  const version = await prisma.pageVersion.findFirst({
    where: { pageId: page.id },
    orderBy: { versionNo: "desc" }
  });
  if (!version) throw new Error("Failed to create initial page version");

  const updated = await prisma.page.update({
    where: { id: page.id },
    data: { draftVersionId: version.id }
  });

  return { pageId: updated.id, schemaJson: version.schemaJson as unknown };
}

export async function getPageForEditor(input: { ownerId: string; pageId: string }) {
  const page = await prisma.page.findUnique({
    where: { id: input.pageId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      status: true,
      draftVersionId: true,
      publishedVersionId: true
    }
  });

  if (!page || page.ownerId !== input.ownerId) throw new NotFoundError("Страница не найдена");

  const versionId = page.draftVersionId ?? page.publishedVersionId;
  if (!versionId) throw new BadRequestError("У страницы нет доступных версий");

  const version = await prisma.pageVersion.findUnique({
    where: { id: versionId },
    select: { schemaJson: true }
  });

  if (!version) throw new NotFoundError("Версия не найдена");

  return { pageId: page.id, title: page.title, status: page.status, schemaJson: version.schemaJson };
}

export async function saveDraft(input: { ownerId: string; createdById: string; pageId: string; schemaJson: unknown }) {
  const schemaJson = PageSchemaJsonSchema.parse(input.schemaJson);

  const page = await prisma.page.findUnique({
    where: { id: input.pageId },
    select: { id: true, ownerId: true }
  });

  if (!page || page.ownerId !== input.ownerId) throw new NotFoundError("Страница не найдена");

  const last = await prisma.pageVersion.findFirst({
    where: { pageId: input.pageId },
    orderBy: { versionNo: "desc" },
    select: { versionNo: true }
  });
  const nextVersionNo = (last?.versionNo ?? 0) + 1;

  const createdVersion = await prisma.pageVersion.create({
    data: {
      pageId: input.pageId,
      versionNo: nextVersionNo,
      schemaJson,
      createdById: input.createdById
    }
  });

  await prisma.page.update({
    where: { id: input.pageId },
    data: { draftVersionId: createdVersion.id, status: "DRAFT" }
  });

  return { schemaJson: createdVersion.schemaJson };
}

export async function publish(input: { ownerId: string; createdById: string; pageId: string; slug?: string }) {
  const page = await prisma.page.findUnique({
    where: { id: input.pageId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      draftVersionId: true,
      publishedVersionId: true
    }
  });
  if (!page || page.ownerId !== input.ownerId) throw new NotFoundError("Страница не найдена");
  if (!page.draftVersionId) throw new BadRequestError("Сначала сохраните draft");

  const baseSlug = input.slug ? input.slug : pickPageSlugBase(page.title);
  const uniqueSlug = await ensureUniqueSlug(input.ownerId, baseSlug, page.id);

  const updated = await prisma.page.update({
    where: { id: input.pageId },
    data: {
      status: "PUBLISHED",
      publishedVersionId: page.draftVersionId,
      slug: uniqueSlug
    },
    select: { id: true, draftVersionId: true }
  });

  const version = await prisma.pageVersion.findUnique({
    where: { id: updated.draftVersionId ?? undefined }
  });
  if (!version) throw new NotFoundError("Версия не найдена");

  // Чтобы не плодить поля: публикуем draft-версию как snapshot.
  return { pageId: updated.id, schemaJson: version.schemaJson, slug: uniqueSlug };
}

export async function listPages(input: { ownerId: string }) {
  return prisma.page.findMany({
    where: { ownerId: input.ownerId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      updatedAt: true
    },
    orderBy: { updatedAt: "desc" }
  });
}

export async function deletePage(input: { ownerId: string; pageId: string }) {
  const page = await prisma.page.findUnique({
    where: { id: input.pageId },
    select: { id: true, ownerId: true }
  });

  if (!page || page.ownerId !== input.ownerId) {
    throw new NotFoundError("Страница не найдена");
  }

  await prisma.page.delete({
    where: { id: input.pageId }
  });

  return { ok: true as const };
}

export async function getPublicPublishedSchemaBySlug(input: { slug: string }) {
  const page = await prisma.page.findFirst({
    where: { slug: input.slug, status: "PUBLISHED" },
    select: {
      publishedVersionId: true,
      id: true
    }
  });
  if (!page || !page.publishedVersionId) throw new NotFoundError("Страница не найдена");

  const version = await prisma.pageVersion.findUnique({
    where: { id: page.publishedVersionId },
    select: { schemaJson: true }
  });
  if (!version) throw new NotFoundError("Версия не найдена");

  return { schemaJson: version.schemaJson };
}

