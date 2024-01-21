import { json } from "@remix-run/node";
import { createMetafieldHandler } from "~/api/metafield";
import { PRODUCT_METAFIELD_MUTATION } from "~/gql/product";

export const createActionHandlers = (admin) => {
  const handlePostRequest = async (formData: FormData) => {
    let reviews;
    try {
      reviews = JSON.parse(formData.get("reviews") ?? "[]");
    } catch (error) {
      console.error("Error parsing reviews for POST request:", error);
      return json(
        { error: "Invalid review data in POST request" },
        { status: 400 }
      );
    }

    try {
      const { updateProductReviews } = createMetafieldHandler(admin);
      const { name, message, rating, id, productId, metafieldId } =
        Object.fromEntries(formData);
      const newReviewList = [
        ...reviews,
        {
          name,
          message,
          rating,
          id,
        },
      ];
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
      console.error("Failed to create review", error);
      return json(
        {
          status: "error",
          error: "Failed to create review",
        },
        {
          status: 500,
        }
      );
    }
  };

  const handleDeleteRequest = async (formData: FormData) => {
    let reviews;
    try {
      reviews = JSON.parse(formData.get("reviews") ?? "[]");
    } catch (error) {
      console.error("Error parsing reviews for DELETE request:", error);
      return json(
        { error: "Invalid review data in DELETE request" },
        { status: 400 }
      );
    }

    try {
      const { productId, metafieldId } = Object.fromEntries(formData);
      await admin.graphql(PRODUCT_METAFIELD_MUTATION, {
        variables: {
          input: {
            id: productId,
            metafields: [
              {
                id: metafieldId,
                value: JSON.stringify(reviews),
              },
            ],
          },
        },
      });
      return json({
        action: "delete",
        status: "success",
      });
    } catch (error) {
      console.error("Failed to delete review", error);
      return json(
        {
          status: "error",
          error: "Failed to delete review",
        },
        {
          status: 500,
        }
      );
    }
  };

  return {
    handlePostRequest,
    handleDeleteRequest,
  };
};
