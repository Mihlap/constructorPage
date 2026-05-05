import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PreviewRenderer } from "../preview/PreviewRenderer";
import type { PageNode, PageSchemaJson } from "../model/pageSchema";
import { addNodeToContainer, deleteNode, findNodeById, moveNode, patchNodeProps } from "../model/pageOps";
import { getPage, publishPage, saveDraft, uploadMedia as uploadMediaApi } from "../lib/api/client";
import { useAuthStore } from "../store/authStore";
import { PageCanvas } from "../editor/PageCanvas";
import { InspectorPanel } from "../editor/InspectorPanel";

const BLOCK_TYPES: Array<PageNode["type"]> = ["heading", "text", "image", "button", "container"];

export function PageEditorPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const { pageId } = useParams<{ pageId: string }>();

  const [schemaJson, setSchemaJson] = useState<PageSchemaJson | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !pageId) return;
    (async () => {
      setError(null);
      const data = await getPage(token, pageId);
      setSchemaJson(data.schemaJson);
      setSelectedNodeId(null);
      setDirty(false);
    })().catch((e) => setError(e?.message ?? "Ошибка загрузки страницы"));
  }, [token, pageId]);

  const selectedNode = useMemo(() => {
    if (!schemaJson || !selectedNodeId) return null;
    return findNodeById(schemaJson, selectedNodeId);
  }, [schemaJson, selectedNodeId]);

  const targetContainerId = selectedNode?.type === "container" ? selectedNode.id : "root";

  async function onSaveDraft() {
    if (!token || !pageId || !schemaJson) return;
    setSaving(true);
    setError(null);
    try {
      await saveDraft(token, pageId, schemaJson);
      setDirty(false);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function onPublish() {
    if (!token || !pageId) return;
    if (!schemaJson) return;
    // На публикацию отправляем актуальный черновик.
    if (dirty && !saving) {
      await onSaveDraft();
    }
    setPublishing(true);
    setError(null);
    try {
      const result = await publishPage(token, pageId);
      navigate(`/p/${result.slug}`);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Ошибка публикации");
    } finally {
      setPublishing(false);
    }
  }

  function applyUpdate(next: PageSchemaJson) {
    setSchemaJson(next);
    setDirty(true);
  }

  function onMove(nodeId: string, targetContainer: string, index: number) {
    if (!schemaJson) return;
    applyUpdate(moveNode(schemaJson, nodeId, targetContainer, index));
  }

  function onDelete(nodeId: string) {
    if (!schemaJson) return;
    applyUpdate(deleteNode(schemaJson, nodeId));
    setSelectedNodeId((cur) => (cur === nodeId ? null : cur));
  }

  function onPatchNode(nodeId: string, patch: (node: PageNode) => PageNode) {
    if (!schemaJson) return;
    applyUpdate(patchNodeProps(schemaJson, nodeId, patch));
  }

  async function onUploadMedia(file: File): Promise<string> {
    if (!token) throw new Error("Нет токена");
    const asset = await uploadMediaApi(token, file);
    return asset.id;
  }

  function onClearMedia(nodeId: string) {
    onPatchNode(nodeId, (n) => (n.type !== "image" ? n : { ...n, props: { ...n.props, assetId: null } }));
  }

  function onAddBlock(type: PageNode["type"]) {
    if (!schemaJson) return;
    applyUpdate(addNodeToContainer(schemaJson, type, targetContainerId));
  }

  if (!schemaJson) {
    return (
      <div style={{ maxWidth: 1200, margin: "20px auto", padding: 20 }}>
        {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : "Загрузка..."}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "20px auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h1 style={{ margin: 0 }}>Редактор</h1>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
            {dirty ? "Черновик изменен (есть несохраненные правки)" : "Синхронизировано"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={onSaveDraft}
            disabled={saving || !dirty}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: saving ? "#6b7280" : "#111827",
              color: "white",
              border: 0,
              cursor: saving || !dirty ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
          <button
            onClick={onPublish}
            disabled={publishing}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: publishing ? "#6b7280" : "#2563eb",
              color: "white",
              border: 0,
              cursor: publishing ? "not-allowed" : "pointer"
            }}
          >
            {publishing ? "Публикация..." : "Опубликовать"}
          </button>
        </div>
      </div>

      {error ? <div style={{ marginTop: 12, color: "#b91c1c" }}>{error}</div> : null}

      <div style={{ height: 14 }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        <div style={{ background: "white", borderRadius: 14, padding: 16, border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {BLOCK_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => onAddBlock(t)}
                style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb" }}
              >
                Добавить {t}
              </button>
            ))}
          </div>

          <div style={{ height: 14 }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Холст</div>
              <PageCanvas schemaJson={schemaJson} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} onMove={onMove} />
            </div>

            <div>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Предпросмотр</div>
              <PreviewRenderer schemaJson={schemaJson} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <InspectorPanel
            schemaJson={schemaJson}
            selectedNodeId={selectedNodeId}
            onPatchNode={onPatchNode}
            onDeleteNode={onDelete}
            onUploadMedia={onUploadMedia}
            onClearMedia={onClearMedia}
          />
        </div>
      </div>
    </div>
  );
}

