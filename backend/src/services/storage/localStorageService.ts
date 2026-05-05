import path from "node:path";
import fs from "node:fs/promises";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import type { StorageService } from "./storageService";

export class LocalStorageService implements StorageService {
  getPublicUrl(assetId: string) {
    return `${env.PUBLIC_BASE_URL}${env.MEDIA_ROUTE_PREFIX}/${assetId}`;
  }

  async sendAsset(assetId: string, res: Parameters<StorageService["sendAsset"]>[1]) {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: assetId },
      select: { storageKey: true, mimeType: true, filename: true }
    });
    if (!asset) throw new Error("Asset not found");

    const absPath = path.resolve(env.UPLOAD_DIR, asset.storageKey);
    await fs.access(absPath);

    res.type(asset.mimeType);
    res.sendFile(absPath, { headers: { "Content-Disposition": `inline; filename="${asset.filename}"` } });
  }
}

