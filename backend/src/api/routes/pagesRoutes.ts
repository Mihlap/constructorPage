import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { createPageDraft, deletePage, getPageForEditor, listPages, publish, saveDraft } from "../../services/pages/pageService";
import { PageSchemaJsonSchema } from "../../model/pageSchema";
import { asyncHandler } from "../../lib/asyncHandler";

const CreatePageBodySchema = z.object({
  title: z.string().min(2).max(120)
});

const SaveDraftBodySchema = z.object({
  schemaJson: PageSchemaJsonSchema
});

const PublishBodySchema = z.object({
  slug: z.string().min(1).max(120).optional()
});

export function createPagesRouter() {
  const router = Router();

  router.use(requireAuth);

  router.post("/", asyncHandler(async (req, res) => {
    const body = CreatePageBodySchema.parse(req.body);
    const userId = req.user!.id;

    const created = await createPageDraft({ ownerId: userId, createdById: userId, title: body.title });
    return res.status(201).json(created);
  }));

  router.get("/", asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const pages = await listPages({ ownerId: userId });
    return res.json({ pages });
  }));

  router.get("/:pageId", asyncHandler(async (req, res) => {
    const page = await getPageForEditor({ ownerId: req.user!.id, pageId: req.params.pageId });
    return res.json(page);
  }));

  router.post("/:pageId/draft", asyncHandler(async (req, res) => {
    const body = SaveDraftBodySchema.parse(req.body);
    const { schemaJson } = body;
    const result = await saveDraft({
      ownerId: req.user!.id,
      createdById: req.user!.id,
      pageId: req.params.pageId,
      schemaJson
    });
    return res.json(result);
  }));

  router.post("/:pageId/publish", asyncHandler(async (req, res) => {
    const body = PublishBodySchema.parse(req.body ?? {});
    const result = await publish({
      ownerId: req.user!.id,
      createdById: req.user!.id,
      pageId: req.params.pageId,
      slug: body.slug
    });
    return res.json(result);
  }));

  router.delete("/:pageId", asyncHandler(async (req, res) => {
    const result = await deletePage({
      ownerId: req.user!.id,
      pageId: req.params.pageId
    });
    return res.json(result);
  }));

  return router;
}

