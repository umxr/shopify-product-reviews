import type { ProductReview } from "~/components/product-review-form";
import {
  METAFIELD_DEFINITION_QUERY,
  PRODUCT_METAFIELD_MUTATION,
} from "~/gql/product";
import type { GetMetafieldDefinitionQuery } from "~/types/admin.generated";

/**
 * Type definitions for updating product reviews.
 */
export type UpdateProductReviewsInput = {
  reviews: ProductReview[];
  productId: string;
  metafieldId: string;
};
export type UpdateProductReviewsResult = void;

/**
 * Type definitions for getting metafield definition.
 */
export type GetMetafieldDefinitionInput = void;
export type GetMetafieldDefinitionResult =
  | GetMetafieldDefinitionQuery["metafieldDefinitions"]["edges"]
  | null;

/**
 * Creates handlers for metafield operations.
 *
 * @param {Object} admin - Admin object for GraphQL operations.
 * @returns {Object} Handlers for updateProductReviews and getMetafieldDefinition.
 */
export const createMetafieldHandler = (admin) => {
  /**
   * Updates product reviews metafield.
   *
   * @param {UpdateProductReviewsInput} opts - The input options for updating product reviews.
   * @returns {Promise<UpdateProductReviewsResult>} The result of the update operation.
   */
  const updateProductReviews = async (
    opts: UpdateProductReviewsInput
  ): Promise<UpdateProductReviewsResult> => {
    const { reviews, productId, metafieldId } = opts;
    const newReviewList = JSON.stringify(reviews);

    const metafield =
      metafieldId !== "undefined"
        ? { id: metafieldId, value: newReviewList }
        : {
            namespace: "hydrogen_reviews",
            key: "product_reviews",
            value: newReviewList,
            type: "json",
          };

    const variables = { input: { id: productId, metafields: [metafield] } };

    try {
      await admin.graphql(PRODUCT_METAFIELD_MUTATION, { variables });
    } catch (error) {
      console.error("Error updating product reviews:", error);
      // Handle or throw the error based on your use case
    }
  };

  /**
   * Retrieves the metafield definition.
   *
   * @returns {Promise<GetMetafieldDefinitionResult>} The metafield definitions.
   */
  const getMetafieldDefinition =
    async (): Promise<GetMetafieldDefinitionResult> => {
      try {
        const response = await admin.graphql(METAFIELD_DEFINITION_QUERY);
        const json = await response.json();
        return json.data?.metafieldDefinitions.edges;
      } catch (error) {
        console.error("Error getting metafield definition:", error);
        // Handle or throw the error based on your use case
        return null; // Or however you wish to handle the error
      }
    };

  return {
    updateProductReviews,
    getMetafieldDefinition,
  };
};
