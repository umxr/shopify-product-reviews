import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { RequestMethod } from "~/actions";
import { GET_PRODUCT_QUERY } from "~/gql/product";
import type { ProductReview } from "~/components/product-review-form";

const convertReviewsToCSV = (reviews: ProductReview[]) => {
  const headers = "Name,Rating,Message\n";
  const rows = reviews
    .map(
      (review) =>
        `"${review.name}","${review.rating}","${review.message.replace(
          /"/g,
          '""'
        )}"`
    )
    .join("\n");

  return headers + rows;
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  switch (request.method) {
    case RequestMethod.GET:
      const handle = params.handle;
      if (!handle) {
        console.error("Missing handle for GET request");
        return json(
          {
            error: "Missing handle for GET request",
          },
          {
            status: 400,
          }
        );
      }
      const productRequest = await admin.graphql(GET_PRODUCT_QUERY, {
        variables: {
          handle,
        },
      });

      const productJson = await productRequest.json();
      const metafield = productJson.data.productByHandle?.metafield ?? null;
      const reviews = metafield ? JSON.parse(metafield.value) : [];

      const csvData = convertReviewsToCSV(reviews);

      const headers = new Headers();
      headers.append("Content-Type", "text/csv");
      headers.append("Content-Disposition", "attachment; filename=reviews.csv");

      return new Response(csvData, { headers });
    default:
      return new Response(null, { status: 405 }); // Method Not Allowed
  }
};
