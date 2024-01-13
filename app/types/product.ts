export type Product = {
  id: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  handle: string;
};

export type ProductWithImage = Product & {
  featuredImage: {
    altText: string;
    url: string;
  };
};
