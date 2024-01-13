type ValidateReviewArgs = {
  productId: string;
  title: string;
  content: string;
  rating: number;
};

export function validateReview(data: ValidateReviewArgs) {
  const errors: Record<string, string> = {};

  if (!data.productId) {
    errors.productId = "Product ID is required";
  }

  if (!data.title) {
    errors.title = "Title is required";
  }

  if (!data.content) {
    errors.content = "Content is required";
  }

  if (!data.rating) {
    errors.rating = "Rating is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}
