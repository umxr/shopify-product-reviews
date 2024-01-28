import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { RequestMethod } from "~/actions";
import { createMetafieldHandler } from "~/api/metafield";
import { createProductHandler } from "~/api/product";
import { authenticate } from "~/shopify.server";
import { generateUUID } from "~/utils/generate-uuid";

export async function loader({ request }: LoaderFunctionArgs) {
  const { liquid } = await authenticate.public.appProxy(request);

  return liquid("Hello {{shop.name}}");
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.public.appProxy(request);
  const { updateProductReviews } = createMetafieldHandler(admin);
  const { getProductById } = createProductHandler(admin);
  const { productId, name, rating, message } = await request.json();
  switch (request.method) {
    case RequestMethod.POST:
      try {
        const productGraphId = `gid://shopify/Product/${productId}`;
        const { metafield, reviews } = await getProductById(productGraphId);
        const metafieldId = metafield?.id;
        const newReview = {
          name,
          message,
          rating,
          id: generateUUID(),
        };
        const newReviewList = [...reviews, newReview];
        await updateProductReviews({
          metafieldId: metafieldId as string,
          productId: productGraphId,
          reviews: newReviewList,
        });
        return json({
          action: "create",
          status: "success",
        });
      } catch (error) {
        console.error("Failed to create review", error);
        return json({
          action: "create",
          status: "error",
        });
      }

    default:
      return new Response(null, { status: 405 }); // Method Not Allowed
  }
}
