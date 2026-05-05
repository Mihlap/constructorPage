import { describe, expect, it } from "vitest";
import { deleteNode, moveNode } from "../src/model/pageOps";
import type { PageSchemaJson } from "../src/model/pageSchema";

describe("pageOps (tree operations)", () => {
  it("moveNode: move leaf into container at specific index", () => {
    const schema: PageSchemaJson = {
      root: {
        id: "root",
        type: "container",
        props: { layout: "stack" },
        children: [
          {
            id: "c1",
            type: "container",
            props: { layout: "stack" },
            children: [
              { id: "n1", type: "heading", props: { text: "A" }, children: [] }
            ]
          },
          { id: "h2", type: "heading", props: { text: "B" }, children: [] }
        ]
      }
    };

    const next = moveNode(schema, "h2", "c1", 0);

    expect(next.root.children.map((n) => n.id)).toEqual(["c1"]);
    const c1 = next.root.children[0]!;
    if (c1.type !== "container") throw new Error("expected container");
    expect(c1.children.map((n) => n.id)).toEqual(["h2", "n1"]);
  });

  it("moveNode: prevent moving node into its own descendant", () => {
    const schema: PageSchemaJson = {
      root: {
        id: "root",
        type: "container",
        props: { layout: "stack" },
        children: [
          {
            id: "c1",
            type: "container",
            props: { layout: "stack" },
            children: [{ id: "n1", type: "heading", props: { text: "A" }, children: [] }]
          }
        ]
      }
    };

    const next = moveNode(schema, "c1", "n1", 0);
    expect(next).toEqual(schema);
  });

  it("deleteNode: removes node from tree", () => {
    const schema: PageSchemaJson = {
      root: {
        id: "root",
        type: "container",
        props: { layout: "stack" },
        children: [
          { id: "h1", type: "heading", props: { text: "X" }, children: [] },
          { id: "h2", type: "heading", props: { text: "Y" }, children: [] }
        ]
      }
    };

    const next = deleteNode(schema, "h1");
    expect(next.root.children.map((n) => n.id)).toEqual(["h2"]);
  });
});

