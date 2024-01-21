import type {
  UpdateProductReviewsInput,
  UpdateProductReviewsResult,
} from "~/api/metafield";
import { createMetafieldHandler } from "~/api/metafield";
import { createProductHandler } from "~/api/product";
import type { ProductReview } from "~/components/product-review-form";
import type { ParsedProduct, CSVRow } from "./types";
import {
  constructProductReviews,
  validateCSVRow,
  parseProductResult,
} from "./util";
import { EXPECTED_HEADERS } from "./const";

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
    const importResults: string[] = [];
    for (const key of keys) {
      const reviewsToImport = constructProductReviews(products[key]);
      const error = await handleProductUpdate(
        key,
        reviewsToImport,
        updateProductReviews
      );
      if (error) {
        importErrors.push(error);
      } else {
        importResults.push(`Successfully imported reviews for '${key}'`);
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
      suess: "Upload Success",
      details: importResults,
    };

    // You can add a success return here if needed
  };

  const parseAndValidateCSV = async (
    file: ParseAndValidateCSVInput
  ): Promise<ParseAndValidateCSVResult> => {
    const text = await file.text();
    const rows = text.split("\n");
    let validationErrors: string[] = [];
    let isHeaderValid = true;
    let groupedData: Record<string, CSVRow[]> = {};

    // Check headers
    const headers = rows[0].split(",");
    const missingHeaders = EXPECTED_HEADERS.filter(
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

  return {
    uploadProducts,
    parseAndValidateCSV,
  };
};
