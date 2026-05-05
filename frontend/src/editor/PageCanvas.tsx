import React from "react";
import type { PageNode, PageSchemaJson } from "../model/pageSchema";

function NodeCard({
  node,
  isSelected,
  children
}: {
  node: PageNode;
  isSelected: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: isSelected ? "2px solid #2563eb" : "1px solid #d1d5db",
        borderRadius: 12,
        background: "white",
        padding: 12,
        cursor: "pointer"
      }}
    >
      {children}
    </div>
  );
}

function Slot({
  targetContainerId,
  index,
  onMove
}: {
  targetContainerId: string;
  index: number;
  onMove: (nodeId: string, targetContainerId: string, index: number) => void;
}) {
  return (
    <div
      style={{
        height: 14,
        borderRadius: 8,
        background: "transparent",
        border: "1px dashed rgba(37, 99, 235, 0.2)"
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const nodeId = e.dataTransfer.getData("text/plain");
        if (!nodeId) return;
        onMove(nodeId, targetContainerId, index);
      }}
      aria-label="drop-slot"
    />
  );
}

function renderEditableNode({
  node,
  selectedNodeId,
  onSelect,
  onMove
}: {
  node: PageNode;
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
  onMove: (nodeId: string, targetContainerId: string, index: number) => void;
}): React.ReactNode {
  const isSelected = selectedNodeId === node.id;
  const canDrag = node.id !== "root";

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
      <div style={{ fontWeight: 800, textTransform: "capitalize" }}>{node.type}</div>
      {canDrag ? <div style={{ fontSize: 12, color: "#6b7280" }}>drag</div> : null}
    </div>
  );

  const commonProps = {
    draggable: canDrag,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", node.id);
      e.dataTransfer.effectAllowed = "move";
      e.stopPropagation();
    },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(node.id);
    },
    onDragEnd: () => {}
  };

  if (node.type === "container") {
    return (
      <div {...commonProps}>
        <NodeCard node={node} isSelected={isSelected}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {header}
            <div style={{ color: "#6b7280", fontSize: 13 }}>layout: {node.props.layout}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Slot targetContainerId={node.id} index={0} onMove={onMove} />
              {node.children.map((c, idx) => (
                <React.Fragment key={c.id}>
                  {renderEditableNode({ node: c, selectedNodeId, onSelect, onMove })}
                  <Slot targetContainerId={node.id} index={idx + 1} onMove={onMove} />
                </React.Fragment>
              ))}
            </div>
          </div>
        </NodeCard>
      </div>
    );
  }

  let detail: React.ReactNode = null;
  if (node.type === "heading") detail = <div style={{ color: "#111827" }}>{node.props.text}</div>;
  if (node.type === "text") detail = <div style={{ color: "#111827" }}>{node.props.text}</div>;
  if (node.type === "image")
    detail = (
      <div style={{ color: "#6b7280", fontSize: 13 }}>{node.props.assetId ? `asset: ${node.props.assetId}` : "no image"}</div>
    );
  if (node.type === "button")
    detail = (
      <div style={{ color: "#6b7280", fontSize: 13 }}>
        {node.props.label} · {node.props.url}
      </div>
    );

  return (
    <div {...commonProps}>
      <NodeCard node={node} isSelected={isSelected}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {header}
          {detail}
        </div>
      </NodeCard>
    </div>
  );
}

export function PageCanvas({
  schemaJson,
  selectedNodeId,
  onSelect,
  onMove
}: {
  schemaJson: PageSchemaJson;
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
  onMove: (nodeId: string, targetContainerId: string, index: number) => void;
}) {
  return (
    <div>
      {renderEditableNode({ node: schemaJson.root, selectedNodeId, onSelect, onMove })}
    </div>
  );
}

