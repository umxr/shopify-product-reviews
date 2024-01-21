import invariant from "tiny-invariant";
import {
  UpdateProductReviewsInput,
  UpdateProductReviewsResult,
  createMetafieldHandler,
} from "~/api/metafield";
import { createProductHandler } from "~/api/product";
import { ProductReview } from "~/components/product-review-form";
import { generateUUID } from "~/utils/generate-uuid";

export type CSVRow = {
  handle: string;
  name: string;
  message: string;
  rating: string;
};

export type ParsedProduct = {
  handle: string;
  name: string;
  message: string;
  rating: string;
};

export const expectedHeaders = ["handle", "name", "message", "rating"];

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

type ParseAndValidateCSVInput = File;
type ParseAndValidateCSVErrorResult = {
  status: "error";
  error: string;
  details: string[];
};
type ParseAndValidateCSVSuccessResult = {
  status: "success";
  products: ParsedProduct[];
  products_raw: Record<string, CSVRow[]>;
};
type ParseAndValidateCSVResult =
  | ParseAndValidateCSVErrorResult
  | ParseAndValidateCSVSuccessResult;

export const parseAndValidateCSV = async (
  file: ParseAndValidateCSVInput
): Promise<ParseAndValidateCSVResult> => {
  const text = await file.text();
  const rows = text.split("\n");
  let validationErrors: string[] = [];
  let isHeaderValid = true;
  let groupedData: Record<string, CSVRow[]> = {};

  // Check headers
  const headers = rows[0].split(",");
  const missingHeaders = expectedHeaders.filter(
    (header) => !headers.includes(header)
  );
  if (missingHeaders.length > 0) {
    validationErrors.push(`Missing headers: ${missingHeaders.join(", ")}`);
    isHeaderValid = false;
  } else {
    // Validate and group each row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].split(",");
      const rowData = row.reduce((acc, current, index) => {
        acc[headers[index]] = current;
        return acc;
      }, {});

      const rowIsValid = validateCSVRow(rowData, i + 1, validationErrors);
      if (rowIsValid) {
        // Group by handle
        const handle = rowData.handle;
        if (!groupedData[handle]) {
          groupedData[handle] = [];
        }
        groupedData[handle].push(rowData);
      }
    }
  }

  if (!isHeaderValid || validationErrors.length > 0) {
    return {
      status: "error",
      error: "Validation errors in CSV file.",
      details: validationErrors,
    };
  }

  return {
    status: "success",
    products: parseProductResult(groupedData),
    products_raw: groupedData,
  };
};

const constructProductReviews = (
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

export const createActionHandlers = (admin: any) => {
  const getProductByHandle = createProductHandler(admin).getProductByHandle;
  const updateProductReviews =
    createMetafieldHandler(admin).updateProductReviews;
  const handleProductUpdate = async (
    key: string,
    reviewsToImport: ProductReview[],
    updateProductReviews: (
      input: UpdateProductReviewsInput
    ) => Promise<UpdateProductReviewsResult>
  ) => {
    try {
      const { metafield, product, reviews } = await getProductByHandle(key);
      await updateProductReviews({
        metafieldId: metafield?.id as string,
        productId: product?.id as string,
        reviews: [...reviews, ...reviewsToImport],
      });
      return null;
    } catch (error) {
      return `Error updating product with handle '${key}'`;
    }
  };

  const uploadProducts = async (products: Record<string, CSVRow[]>) => {
    const keys = Object.keys(products);
    if (keys.length === 0) {
      return {
        status: "error",
        error: "Upload Errors",
        details: ["No products to upload."],
      };
    }

    const importErrors: string[] = [];
    for (const key of keys) {
      const reviewsToImport = constructProductReviews(products[key]);
      const error = await handleProductUpdate(
        key,
        reviewsToImport,
        updateProductReviews
      );
      if (error) {
        importErrors.push(error);
      }
    }

    if (importErrors.length > 0) {
      return {
        status: "error",
        error: "Upload Errors",
        details: importErrors,
      };
    }

    return {
      status: "success",
    };

    // You can add a success return here if needed
  };

  return {
    uploadProducts,
  };
};
