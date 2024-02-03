import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { RequestMethod } from "~/actions";
import { createMetafieldHandler } from "~/api/metafield";
import { createProductHandler } from "~/api/product";
import { authenticate, unauthenticated } from "~/shopify.server";
import { generateUUID } from "~/utils/generate-uuid";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.public.checkout(request);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { cors, sessionToken } = await authenticate.public.checkout(request);

  switch (request.method) {
    case RequestMethod.POST:
      try {
        const shop = sessionToken.input_data.shop.domain.split("//").pop();
        const { admin } = await unauthenticated.admin(shop);
        const { productId, name, rating, message } = await request.json();
        const graphId = `gid://shopify/Product/${productId}`;
        const { getProductById } = createProductHandler(admin);
        const { updateProductReviews } = createMetafieldHandler(admin);
        const { metafield, reviews } = await getProductById(graphId);
        const updatedReviewsList = [
          ...reviews,
          {
            id: generateUUID(),
            name,
            rating,
            message,
          },
        ];
        await updateProductReviews({
          metafieldId: metafield?.id ?? "undefined",
          productId: graphId,
          reviews: updatedReviewsList,
        });
        return cors(json({ status: "success" }));
      } catch (error) {
        console.log("Error creating review", error);
        return cors(json({ status: "error" }));
      }
    default:
      return new Response(null, {
        status: 405,
        statusText: "Method Not Allowed",
      });
  }
};
