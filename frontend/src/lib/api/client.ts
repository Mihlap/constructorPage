import axios from "axios";
import type { PageSchemaJson } from "../../model/pageSchema";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE_URL
});

export type AuthResponse = { token: string };

export async function authRegister(input: { email: string; password: string }) {
  const res = await api.post<AuthResponse>("/api/auth/register", input);
  return res.data;
}

export async function authLogin(input: { email: string; password: string }) {
  const res = await api.post<AuthResponse>("/api/auth/login", input);
  return res.data;
}

export type PageListItem = {
  id: string;
  title: string;
  slug: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt: string;
};

export async function createPage(token: string, input: { title: string }) {
  const res = await api.post<{ pageId: string; schemaJson: PageSchemaJson }>(
    "/api/pages",
    input,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function listPages(token: string) {
  const res = await api.get<{ pages: PageListItem[] }>("/api/pages", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.pages;
}

export async function deletePage(token: string, pageId: string) {
  const res = await api.delete<{ ok: true }>(`/api/pages/${pageId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getPage(token: string, pageId: string) {
  const res = await api.get<{
    pageId: string;
    title: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    schemaJson: PageSchemaJson;
  }>(`/api/pages/${pageId}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function saveDraft(token: string, pageId: string, schemaJson: PageSchemaJson) {
  const res = await api.post<{ schemaJson: PageSchemaJson }>(
    `/api/pages/${pageId}/draft`,
    { schemaJson },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function publishPage(token: string, pageId: string, slug?: string) {
  const res = await api.post<{ pageId: string; schemaJson: PageSchemaJson; slug: string }>(
    `/api/pages/${pageId}/publish`,
    { slug: slug ?? undefined },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function getPublicPage(slug: string) {
  const res = await api.get<{ schemaJson: PageSchemaJson }>(`/api/public/pages/${slug}`);
  return res.data;
}

export async function uploadMedia(token: string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.post<{ asset: { id: string; url: string } }>(`/api/media`, fd, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
  });
  return res.data.asset;
}

