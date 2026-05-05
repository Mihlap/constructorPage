import type { Response } from "express";

export type StoredAsset = {
  id: string;
  storageKey: string;
};

export interface StorageService {
  getPublicUrl(assetId: string): string;
  sendAsset(assetId: string, res: Response): Promise<void>;
  // В MVP фактическая запись идет через multer, поэтому метод put опционален.
}

