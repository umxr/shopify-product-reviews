import type { ProductReview } from "~/components/product-review-form";
import {
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_PRODUCT_BY_ID_QUERY,
} from "~/gql/product";
import type {
  GetProductByHandleQuery,
  GetProductByIdQuery,
} from "~/types/admin.generated";
import type { Maybe, Metafield } from "~/types/admin.types";

type GetProductByHandleInput = string;
type GetProductByHandleResult = {
  product: GetProductByHandleQuery["productByHandle"];
  metafield: Maybe<Pick<Metafield, "id" | "key" | "namespace" | "value">>;
  reviews: ProductReview[];
};

type GetProductByIdInput = string;
type GetProductByIdResult = {
  product: GetProductByIdQuery["product"];
  metafield: Maybe<Pick<Metafield, "id" | "key" | "namespace" | "value">>;
  reviews: ProductReview[];
};

export const createProductHandler = (admin) => {
  const getProductByHandle = async (
    handle: GetProductByHandleInput
  ): Promise<GetProductByHandleResult> => {
    const productRequest = await admin.graphql(GET_PRODUCT_BY_HANDLE_QUERY, {
      variables: {
        handle,
      },
    });

    const productJson = await productRequest.json();
    const metafield = productJson.data.productByHandle?.metafield ?? null;
    delete productJson.data.productByHandle.metafield;

    return {
      product: productJson.data.productByHandle,
      metafield,
      reviews: metafield ? JSON.parse(metafield.value) : [],
    };
  };
  const getProductById = async (
    id: GetProductByIdInput
  ): Promise<GetProductByIdResult> => {
    const productRequest = await admin.graphql(GET_PRODUCT_BY_ID_QUERY, {
      variables: {
        id,
      },
    });

    const productJson = await productRequest.json();
    const metafield = productJson.data.product?.metafield ?? null;
    delete productJson.data.product.metafield;

    return {
      product: productJson.data.product,
      metafield,
      reviews: metafield ? JSON.parse(metafield.value) : [],
    };
  };

  return {
    getProductById,
    getProductByHandle,
  };
};
