export type Product = {
  id: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  handle: string;
};
