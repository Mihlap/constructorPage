import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { PageSchemaJson } from "../model/pageSchema";
import { getPublicPage } from "../lib/api/client";
import { PreviewRenderer } from "../preview/PreviewRenderer";

export function PublicPreviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const [schemaJson, setSchemaJson] = useState<PageSchemaJson | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const result = await getPublicPage(slug);
        setSchemaJson(result.schemaJson);
      } catch (e: any) {
        setError(e?.response?.data?.error ?? e?.message ?? "Ошибка");
      }
    })();
  }, [slug]);

  if (!schemaJson) {
    return (
      <div style={{ maxWidth: 1200, margin: "30px auto", padding: 20 }}>
        {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : "Загрузка..." }
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "30px auto", padding: 20 }}>
      <PreviewRenderer schemaJson={schemaJson} />
    </div>
  );
}

