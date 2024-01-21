import type { ProductReview } from "~/components/product-review-form";
import {
  FORWARD_PAGINATION_QUERY,
  BACKWARD_PAGINATION_QUERY,
} from "~/gql/product";
import type { Product } from "~/types/admin.types";

type GetPaginationQueryInput = URLSearchParams;
type GetPaginationQueryResult = {
  query: string;
  variables: Record<string, any>;
};

type GraphqlQueryInput = {
  query: string;
  variables?: Record<string, any>;
};
type GraphqlQueryResult = any;

type FormatProductsDataInput = Product[];
type FormatProductsDataResult = Product & {
  metafield: ProductReview[];
};

export function formatProductsData(
  data: FormatProductsDataInput
): FormatProductsDataResult[] {
  return data.map((product) => {
    const metafield = product.metafield
      ? JSON.parse(product.metafield.value)
      : [];
    return { ...product, metafield };
  });
}

export const createAppHandler = (admin) => {
  const getPaginationQuery = (
    searchParams: GetPaginationQueryInput
  ): GetPaginationQueryResult => {
    const numProductsForward = Number(searchParams.get("first")) || 10;
    const cursorForward = searchParams.get("after") || null;
    const numProductsBackward = Number(searchParams.get("last")) || 10;
    const cursorBackward = searchParams.get("before") || null;

    if (cursorForward) {
      return {
        query: FORWARD_PAGINATION_QUERY,
        variables: { numProducts: numProductsForward, cursor: cursorForward },
      };
    } else if (cursorBackward) {
      return {
        query: BACKWARD_PAGINATION_QUERY,
        variables: { numProducts: numProductsBackward, cursor: cursorBackward },
      };
    } else {
      return {
        query: FORWARD_PAGINATION_QUERY,
        variables: { numProducts: numProductsForward, cursor: null },
      };
    }
  };

  const graphqlQuery = async (
    input: GraphqlQueryInput
  ): Promise<GraphqlQueryResult> => {
    const { query, variables = {} } = input;
    return admin.graphql(query, { variables });
  };

  return {
    getPaginationQuery,
    graphqlQuery,
  };
};
