import { Router } from "express";
import { z } from "zod";
import { getPublicPublishedSchemaBySlug } from "../../services/pages/pageService";
import { asyncHandler } from "../../lib/asyncHandler";

const SlugParamSchema = z.object({
  slug: z.string().min(1).max(120)
});

export function createPublicPagesRouter() {
  const router = Router();

  router.get("/:slug", asyncHandler(async (req, res) => {
    const { slug } = SlugParamSchema.parse(req.params);
    const result = await getPublicPublishedSchemaBySlug({ slug });
    return res.json(result);
  }));

  return router;
}

