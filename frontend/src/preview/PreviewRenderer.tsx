import React from "react";
import type { PageNode, PageSchemaJson } from "../model/pageSchema";

function renderNode(node: PageNode, apiBaseUrl: string) {
  switch (node.type) {
    case "container": {
      const dir = node.props.layout === "row" ? "row" : "column";
      return (
        <div style={{ display: "flex", flexDirection: dir, gap: 12 }} data-testid={`node-${node.type}-${node.id}`}>
          {node.children.map((c) => (
            <React.Fragment key={c.id}>{renderNode(c, apiBaseUrl)}</React.Fragment>
          ))}
        </div>
      );
    }
    case "heading":
      return (
        <h2 style={{ fontSize: 28, fontWeight: 800 }} data-testid={`node-heading-${node.id}`}>
          {node.props.text}
        </h2>
      );
    case "text":
      return (
        <p style={{ fontSize: 16, lineHeight: 1.55 }} data-testid={`node-text-${node.id}`}>
          {node.props.text}
        </p>
      );
    case "image": {
      const src = node.props.assetId ? `${apiBaseUrl}/api/media/${node.props.assetId}` : "";
      return (
        <div data-testid={`node-image-${node.id}`}>
          {node.props.assetId ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img src={src} style={{ maxWidth: "100%", borderRadius: 10 }} />
          ) : (
            <div style={{ width: "100%", height: 120, background: "#e5e7eb", borderRadius: 10 }} />
          )}
        </div>
      );
    }
    case "button":
      return (
        <a
          href={node.props.url}
          style={{
            display: "inline-block",
            padding: "10px 16px",
            background: "#111827",
            color: "white",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 700
          }}
          target={node.props.url.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          data-testid={`node-button-${node.id}`}
        >
          {node.props.label}
        </a>
      );
  }
}

export function PreviewRenderer({ schemaJson }: { schemaJson: PageSchemaJson }) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
  return <div style={{ padding: 16, background: "white", borderRadius: 14 }}>{renderNode(schemaJson.root, apiBaseUrl)}</div>;
}

