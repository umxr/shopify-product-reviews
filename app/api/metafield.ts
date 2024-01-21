import type { ProductReview } from "~/components/product-review-form";
import { PRODUCT_METAFIELD_MUTATION } from "~/gql/product";

export type UpdateProductReviewsInput = {
  reviews: ProductReview[];
  productId: string;
  metafieldId: string;
};

export type UpdateProductReviewsResult = void;

export const createMetafieldHandler = (admin) => {
  const updateProductReviews = async (
    opts: UpdateProductReviewsInput
  ): Promise<UpdateProductReviewsResult> => {
    const { reviews, productId, metafieldId } = opts;
    const newReviewList = JSON.stringify(reviews);

    const variables =
      metafieldId !== "undefined"
        ? {
            input: {
              id: productId,
              metafields: [
                {
                  id: metafieldId,
                  value: newReviewList,
                },
              ],
            },
          }
        : {
            input: {
              id: productId,
              metafields: [
                {
                  namespace: "hydrogen_reviews",
                  key: "product_reviews",
                  value: newReviewList,
                  type: "json",
                },
              ],
            },
          };

    await admin.graphql(PRODUCT_METAFIELD_MUTATION, {
      variables,
    });
  };

  return {
    updateProductReviews,
  };
};
