import React, { useMemo } from "react";
import type { PageNode, PageSchemaJson } from "../model/pageSchema";
import { findNodeById } from "../model/pageOps";

export function InspectorPanel({
  schemaJson,
  selectedNodeId,
  onPatchNode,
  onDeleteNode,
  onUploadMedia,
  onClearMedia
}: {
  schemaJson: PageSchemaJson;
  selectedNodeId: string | null;
  onPatchNode: (nodeId: string, patch: (node: PageNode) => PageNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onUploadMedia: (file: File) => Promise<string>;
  onClearMedia: (nodeId: string) => void;
}) {
  const node = useMemo(() => {
    if (!selectedNodeId) return null;
    return findNodeById(schemaJson, selectedNodeId);
  }, [schemaJson, selectedNodeId]);

  if (!node) {
    return (
      <div style={{ background: "white", borderRadius: 14, padding: 16, border: "1px solid #e5e7eb" }}>
        Выберите блок
      </div>
    );
  }

  const canDelete = node.id !== "root";

  return (
    <div style={{ background: "white", borderRadius: 14, padding: 16, border: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontWeight: 900, textTransform: "capitalize" }}>{node.type}</div>
        {canDelete ? (
          <button
            onClick={() => onDeleteNode(node.id)}
            style={{ background: "#ef4444", color: "white", border: 0, padding: "8px 12px", borderRadius: 10 }}
          >
            Удалить
          </button>
        ) : null}
      </div>

      <div style={{ height: 12 }} />

      {node.type === "container" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.4 }}>
            Выбран контейнер. Чтобы редактировать текст, выберите на холсте блок <b>heading</b> или <b>text</b>.
          </div>
          <label>
            layout
            <select
              value={node.props.layout}
              onChange={(e) =>
                onPatchNode(node.id, (n) =>
                  n.type !== "container" ? n : { ...n, props: { ...n.props, layout: e.target.value as any } }
                )
              }
              style={{ width: "100%", marginTop: 4 }}
            >
              <option value="stack">stack</option>
              <option value="row">row</option>
            </select>
          </label>
        </div>
      ) : null}

      {node.type === "heading" ? (
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Текст</span>
          <input
            value={node.props.text}
            onChange={(e) =>
              onPatchNode(node.id, (n) => (n.type !== "heading" ? n : { ...n, props: { ...n.props, text: e.target.value } }))
            }
          />
        </label>
      ) : null}

      {node.type === "text" ? (
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Текст</span>
          <textarea
            value={node.props.text}
            onChange={(e) =>
              onPatchNode(node.id, (n) => (n.type !== "text" ? n : { ...n, props: { ...n.props, text: e.target.value } }))
            }
            rows={5}
          />
        </label>
      ) : null}

      {node.type === "image" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ color: "#6b7280", fontSize: 13 }}>assetId: {node.props.assetId ?? "none"}</div>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const assetId = await onUploadMedia(file);
              onPatchNode(node.id, (n) => (n.type !== "image" ? n : { ...n, props: { ...n.props, assetId } }));
            }}
          />
          <button
            onClick={() => onClearMedia(node.id)}
            disabled={!node.props.assetId}
            style={{
              background: "#f3f4f6",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "8px 12px",
              cursor: node.props.assetId ? "pointer" : "not-allowed",
              color: node.props.assetId ? "#111827" : "#9ca3af"
            }}
          >
            Убрать изображение
          </button>
        </div>
      ) : null}

      {node.type === "button" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>Label</span>
            <input
              value={node.props.label}
              onChange={(e) => onPatchNode(node.id, (n) => (n.type !== "button" ? n : { ...n, props: { ...n.props, label: e.target.value } }))}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>URL</span>
            <input
              value={node.props.url}
              onChange={(e) => onPatchNode(node.id, (n) => (n.type !== "button" ? n : { ...n, props: { ...n.props, url: e.target.value } }))}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

