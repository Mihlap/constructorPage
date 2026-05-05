import { z } from "zod";

export type ContainerLayout = "stack" | "row";

export type PageNode =
  | {
      id: string;
      type: "container";
      props: { layout: ContainerLayout };
      children: PageNode[];
    }
  | {
      id: string;
      type: "heading";
      props: { text: string };
      children: PageNode[];
    }
  | {
      id: string;
      type: "text";
      props: { text: string };
      children: PageNode[];
    }
  | {
      id: string;
      type: "image";
      props: { assetId: string | null };
      children: PageNode[];
    }
  | {
      id: string;
      type: "button";
      props: { label: string; url: string };
      children: PageNode[];
    };

export type PageSchemaJson = { root: PageNode };

const containerPropsSchema = z.object({
  layout: z.enum(["stack", "row"])
});

const headingPropsSchema = z.object({
  text: z.string().min(1).max(200)
});

const textPropsSchema = z.object({
  text: z.string().min(1).max(5000)
});

const imagePropsSchema = z.object({
  assetId: z.string().min(1).nullable()
});

const buttonPropsSchema = z.object({
  label: z.string().min(1).max(60),
  url: z.string().min(1).max(200)
});

export const PageNodeSchema: z.ZodType<PageNode> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      id: z.string().min(1),
      type: z.literal("container"),
      props: containerPropsSchema,
      children: z.array(PageNodeSchema)
    }),
    z.object({
      id: z.string().min(1),
      type: z.literal("heading"),
      props: headingPropsSchema,
      children: z.array(PageNodeSchema).length(0)
    }),
    z.object({
      id: z.string().min(1),
      type: z.literal("text"),
      props: textPropsSchema,
      children: z.array(PageNodeSchema).length(0)
    }),
    z.object({
      id: z.string().min(1),
      type: z.literal("image"),
      props: imagePropsSchema,
      children: z.array(PageNodeSchema).length(0)
    }),
    z.object({
      id: z.string().min(1),
      type: z.literal("button"),
      props: buttonPropsSchema,
      children: z.array(PageNodeSchema).length(0)
    })
  ])
);

export const PageSchemaJsonSchema = z.object({
  root: PageNodeSchema
});

export function createEmptyPageSchemaJson() {
  return {
    root: {
      id: "root",
      type: "container",
      props: { layout: "stack" as const },
      children: []
    }
  } satisfies PageSchemaJson;
}

