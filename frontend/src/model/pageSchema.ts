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
      children: [];
    }
  | {
      id: string;
      type: "text";
      props: { text: string };
      children: [];
    }
  | {
      id: string;
      type: "image";
      props: { assetId: string | null };
      children: [];
    }
  | {
      id: string;
      type: "button";
      props: { label: string; url: string };
      children: [];
    };

export type PageSchemaJson = { root: PageNode };

