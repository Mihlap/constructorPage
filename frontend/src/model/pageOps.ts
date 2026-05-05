import { nanoid } from "nanoid";
import type { ContainerLayout, PageNode, PageSchemaJson } from "./pageSchema";

export function createEmptyPageSchemaJson(): PageSchemaJson {
  return {
    root: {
      id: "root",
      type: "container",
      props: { layout: "stack" },
      children: []
    }
  };
}

export function createNodeByType(type: PageNode["type"]): PageNode {
  switch (type) {
    case "container":
      return {
        id: nanoid(),
        type: "container",
        props: { layout: "stack" as ContainerLayout },
        children: []
      };
    case "heading":
      return { id: nanoid(), type: "heading", props: { text: "Заголовок" }, children: [] };
    case "text":
      return { id: nanoid(), type: "text", props: { text: "Текст вашего лендинга" }, children: [] };
    case "image":
      return { id: nanoid(), type: "image", props: { assetId: null }, children: [] };
    case "button":
      return { id: nanoid(), type: "button", props: { label: "Кнопка", url: "#" }, children: [] };
  }
}

function isAncestor(root: PageNode, ancestorId: string, maybeDescendantId: string): boolean {
  if (root.id === ancestorId) {
    if (root.type === "container") return subtreeContains(root, maybeDescendantId);
    return false;
  }
  if (root.type === "container") {
    return root.children.some((c) => isAncestor(c, ancestorId, maybeDescendantId));
  }
  return false;
}

function subtreeContains(root: PageNode, nodeId: string): boolean {
  if (root.id === nodeId) return true;
  if (root.type !== "container") return false;
  return root.children.some((c) => subtreeContains(c, nodeId));
}

function removeNode(root: PageNode, nodeId: string): { next: PageNode; removed: PageNode | null } {
  if (root.type !== "container") return { next: root, removed: null };
  const idx = root.children.findIndex((c) => c.id === nodeId);
  if (idx >= 0) {
    const removed = root.children[idx];
    return { next: { ...root, children: [...root.children.slice(0, idx), ...root.children.slice(idx + 1)] }, removed };
  }

  // recurse into children containers
  let removed: PageNode | null = null;
  const nextChildren = root.children.map((c) => {
    if (removed) return c;
    const res = removeNode(c, nodeId);
    if (res.removed) removed = res.removed;
    return res.next;
  });

  return { next: { ...root, children: nextChildren }, removed };
}

function insertIntoContainer(root: PageNode, containerId: string, node: PageNode, index: number): PageNode {
  if (root.type !== "container") return root;
  if (root.id === containerId) {
    const safeIndex = Math.max(0, Math.min(index, root.children.length));
    return { ...root, children: [...root.children.slice(0, safeIndex), node, ...root.children.slice(safeIndex)] };
  }
  return { ...root, children: root.children.map((c) => insertIntoContainer(c, containerId, node, index)) };
}

function updateNode(root: PageNode, nodeId: string, updater: (n: PageNode) => PageNode): PageNode {
  if (root.id === nodeId) return updater(root);
  if (root.type !== "container") return root;
  return { ...root, children: root.children.map((c) => updateNode(c, nodeId, updater)) };
}

export function patchNodeProps(schema: PageSchemaJson, nodeId: string, patch: (node: PageNode) => PageNode): PageSchemaJson {
  return { ...schema, root: updateNode(schema.root, nodeId, patch) };
}

export function deleteNode(schema: PageSchemaJson, nodeId: string): PageSchemaJson {
  if (nodeId === "root") return schema;
  const res = removeNode(schema.root, nodeId);
  if (!res.removed) return schema;
  return { ...schema, root: res.next };
}

export function moveNode(schema: PageSchemaJson, nodeId: string, targetContainerId: string, index: number): PageSchemaJson {
  if (nodeId === "root") return schema;
  if (nodeId === targetContainerId) return schema;
  if (isAncestor(schema.root, nodeId, targetContainerId)) return schema; // нельзя вставить в самого себя

  const removed = removeNode(schema.root, nodeId);
  if (!removed.removed) return schema;

  // Если target контейнер был внутри удалённого узла, он уже исчез и drop не применяем.
  if (!findNodeByIdInTree(removed.next, targetContainerId)) return schema;

  const inserted = insertIntoContainer(removed.next, targetContainerId, removed.removed, index);
  return { ...schema, root: inserted };
}

export function findNodeById(schema: PageSchemaJson, nodeId: string): PageNode | null {
  return findNodeByIdInTree(schema.root, nodeId);
}

function findNodeByIdInTree(root: PageNode, nodeId: string): PageNode | null {
  if (root.id === nodeId) return root;
  if (root.type !== "container") return null;
  for (const c of root.children) {
    const r = findNodeByIdInTree(c, nodeId);
    if (r) return r;
  }
  return null;
}

export function addNodeToContainer(schema: PageSchemaJson, type: PageNode["type"], containerId: string, index?: number): PageSchemaJson {
  const node = createNodeByType(type);
  const inserted = insertIntoContainer(schema.root, containerId, node, index ?? Number.MAX_SAFE_INTEGER);
  return { ...schema, root: inserted };
}

