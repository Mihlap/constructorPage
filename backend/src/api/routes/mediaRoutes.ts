import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { requireAuth } from "../../middleware/auth";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { LocalStorageService } from "../../services/storage/localStorageService";
import { newId } from "../../lib/id";
import { asyncHandler } from "../../lib/asyncHandler";

const storageService = new LocalStorageService();

export function createMediaRouter() {
  const router = Router();
  const uploadDirAbs = path.resolve(env.UPLOAD_DIR);

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  });

  router.post("/", requireAuth, upload.single("file"), asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Файл не передан" });
    const ownerId = req.user!.id;
    const file = req.file;

    const ext = path.extname(file.originalname || "") || "";
    const assetId = newId(9);
    const storageKey = `${assetId}${ext}`;
    const absPath = path.join(uploadDirAbs, storageKey);

    await fs.mkdir(uploadDirAbs, { recursive: true });
    await fs.writeFile(absPath, file.buffer);

    const type = file.mimetype.startsWith("image/")
      ? "IMAGE"
      : file.mimetype.startsWith("video/")
        ? "VIDEO"
        : "FILE";

    const asset = await prisma.mediaAsset.create({
      data: {
        id: assetId,
        ownerId,
        type,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey
      }
    });

    const url = await storageService.getPublicUrl(asset.id);
    return res.status(201).json({ asset: { id: asset.id, url } });
  }));

  router.get("/:id", asyncHandler(async (req, res) => {
    const id = req.params.id;
    try {
      await storageService.sendAsset(id, res);
    } catch (e) {
      return res.status(404).json({ error: "Not found" });
    }
  }));

  return router;
}

