import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPage, deletePage as deletePageApi, listPages, type PageListItem } from "../lib/api/client";
import { useAuthStore } from "../store/authStore";

export function PagesListPage() {
  const token = useAuthStore((s) => s.token);
  const [pages, setPages] = useState<PageListItem[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const list = await listPages(token);
      setPages(list);
    })().catch((e) => setError(e?.message ?? "Ошибка загрузки"));
  }, [token]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createPage(token, { title });
      setTitle("");
      window.location.href = `/app/pages/${created.pageId}`;
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Ошибка создания");
    } finally {
      setLoading(false);
    }
  }

  async function onDeletePage(pageId: string) {
    if (!token) return;
    const confirmed = window.confirm("Удалить страницу без возможности восстановления?");
    if (!confirmed) return;

    setError(null);
    try {
      await deletePageApi(token, pageId);
      setPages((prev) => prev.filter((p) => p.id !== pageId));
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Ошибка удаления");
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: "30px auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <h1 style={{ margin: 0 }}>Страницы</h1>
        <button
          onClick={() => {
            useAuthStore.getState().clear();
            window.location.href = "/login";
          }}
          style={{ padding: "8px 12px", borderRadius: 10 }}
        >
          Выйти
        </button>
      </div>

      <div style={{ height: 18 }} />

      <form onSubmit={onCreate} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          Название
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Пицца" />
        </label>
        <button
          disabled={loading || title.trim().length < 2}
          style={{ padding: "10px 14px", borderRadius: 10, background: "#111827", color: "white", border: 0 }}
        >
          {loading ? "..." : "Создать"}
        </button>
      </form>

      {error ? <div style={{ marginTop: 12, color: "#b91c1c" }}>{error}</div> : null}

      <div style={{ height: 22 }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {pages.map((p) => (
          <div key={p.id} style={{ background: "white", borderRadius: 14, padding: 14, border: "1px solid #e5e7eb" }}>
            <div style={{ fontWeight: 900 }}>{p.title}</div>
            <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}>status: {p.status}</div>
            {p.slug ? <div style={{ color: "#6b7280", fontSize: 13 }}>slug: {p.slug}</div> : null}
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link to={`/app/pages/${p.id}`} style={{ textDecoration: "none", color: "#2563eb", fontWeight: 800 }}>
                Редактировать
              </Link>
              {p.slug ? (
                <Link to={`/p/${p.slug}`} style={{ textDecoration: "none", color: "#111827", fontWeight: 800 }}>
                  Предпросмотр
                </Link>
              ) : null}
              <button
                onClick={() => onDeletePage(p.id)}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "#dc2626",
                  fontWeight: 800,
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

