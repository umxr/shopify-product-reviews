import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Page } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { ProductTable } from "~/components/product-table";
import { useLoaderData } from "@remix-run/react";
import { flattenEdges } from "~/utils/flattenEdges";
import type { Product } from "~/types/product";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
  query getProducts {
    products (first: 12) {
      edges {
        node {
          id
          title
          status
          handle
        }
      }
    }
  }`
  );

  const products = await response.json();

  const formattedProducts = flattenEdges(products.data.products) as Product[];

  return json({
    products: formattedProducts,
    session,
  });
};

export default function Index() {
  const { products } = useLoaderData<typeof loader>();
  return (
    <Page>
      <ui-title-bar title="Hyrdogen Reviews" />
      <ProductTable products={products} />
    </Page>
  );
}
