import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { authenticate, unauthenticated } from "../shopify.server";
import { RequestMethod } from "~/actions";
import { createProductHandler } from "~/api/product";

// The loader responds to preflight requests from Shopify
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.public.checkout(request);
};

// The action responds to the POST request from the extension. Make sure to use the cors helper for the request to work.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { cors, sessionToken } = await authenticate.public.checkout(request);

  switch (request.method) {
    case RequestMethod.POST:
      try {
        const shop = sessionToken.input_data.shop.domain.split("//").pop();
        const { admin } = await unauthenticated.admin(shop);
        const { productId } = await request.json();
        const graphId = `gid://shopify/Product/${productId}`;
        const { getProductById } = createProductHandler(admin);
        const { product } = await getProductById(graphId);
        return cors(json(product));
      } catch (error) {
        return cors(json({ error: "Error fetching product" }));
      }
    default:
      return new Response(null, {
        status: 405,
        statusText: "Method Not Allowed",
      });
  }
};
