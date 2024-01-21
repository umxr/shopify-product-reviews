import type { ProductReview } from "~/components/product-review-form";
import { generateUUID } from "~/utils/generate-uuid";
import type { CSVRow, ParsedProduct } from "./types";

export const parseProductResult = (
  products: Record<string, CSVRow[]>
): ParsedProduct[] => {
  const results: ParsedProduct[] = [];
  Object.keys(products).forEach((handle) => {
    const product = {
      handle,
      name: products[handle][0].name,
      message: products[handle][0].message,
      rating: products[handle][0].rating,
    };
    results.push(product);
  });

  return results;
};

export const validateCSVRow = (
  row: CSVRow,
  rowIndex: number,
  validationErrors: string[]
): boolean => {
  let isValid = true;

  // Validate Handle (dash-separated format)
  const handleRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!row.handle || !handleRegex.test(row.handle)) {
    validationErrors.push(
      `Row ${rowIndex}: Invalid 'Handle' (should be dash-separated, received '${row.handle}').`
    );
    isValid = false;
  }

  // Validate Name
  if (!row.name || typeof row.name !== "string" || row.name.trim() === "") {
    validationErrors.push(`Row ${rowIndex}: 'Name' is missing or empty.`);
    isValid = false;
  }

  // Validate Message
  if (
    !row.message ||
    typeof row.message !== "string" ||
    row.message.length > 200
  ) {
    validationErrors.push(
      `Row ${rowIndex}: 'Message' is either missing or exceeds 200 characters.`
    );
    isValid = false;
  }

  // Validate Review
  const rating = parseInt(row.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    validationErrors.push(
      `Row ${rowIndex}: 'Rating' should be a number between 1 and 5 (received '${row.rating}').`
    );
    isValid = false;
  }

  return isValid;
};

export const constructProductReviews = (
  products: ParsedProduct[]
): ProductReview[] => {
  const reviews: ProductReview[] = [];
  products.forEach((product) => {
    const review: ProductReview = {
      id: generateUUID(),
      message: product.message,
      name: product.name,
      rating: parseInt(product.rating),
    };
    reviews.push(review);
  });

  return reviews;
};

export const convertReviewsToCSV = (reviews: ProductReview[]): string => {
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
