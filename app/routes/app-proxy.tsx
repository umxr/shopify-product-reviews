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
  const formData = await request.formData();
  switch (request.method) {
    case RequestMethod.POST:
      try {
        const reviews = JSON.parse(formData.get("reviews") as string);
        const productId = formData.get("productId");
        const product = await getProductById(productId as string);
        const metafieldId = product.metafield?.id;
        const newReview = {
          name: formData.get("name") as string,
          message: formData.get("message") as string,
          rating: formData.get("rating") as string,
          id: generateUUID(),
        };
        const newReviewList = [...reviews, newReview];
        await updateProductReviews({
          metafieldId: metafieldId as string,
          productId: productId as string,
          reviews: newReviewList,
        });
        return json({
          action: "create",
          status: "success",
        });
      } catch (error) {
        console.log("Failed to create review", error);
        return json({
          action: "create",
          status: "error",
        });
      }

    default:
      return new Response(null, { status: 405 }); // Method Not Allowed
  }
}
