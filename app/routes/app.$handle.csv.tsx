import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { RequestMethod } from "~/actions";
import { convertReviewsToCSV } from "~/actions/import/util";
import { createProductHandler } from "~/api/product";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  if (request.method !== RequestMethod.GET) {
    return new Response(null, { status: 405 }); // Method Not Allowed
  }

  try {
    const { getProductByHandle } = createProductHandler(admin);
    const { reviews } = await getProductByHandle(params.handle as string);

    const csvData = convertReviewsToCSV(reviews);

    const headers = new Headers();
    headers.append("Content-Type", "text/csv");
    headers.append("Content-Disposition", "attachment; filename=reviews.csv");

    return new Response(csvData, { headers });
  } catch (error) {
    return new Response(null, { status: 400 });
  }
};
