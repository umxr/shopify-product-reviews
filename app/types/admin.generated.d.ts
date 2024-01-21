/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import * as AdminTypes from './admin.types.d.ts';

export type UpdateProductMutationVariables = AdminTypes.Exact<{
  input: AdminTypes.ProductInput;
}>;


export type UpdateProductMutation = { productUpdate?: AdminTypes.Maybe<{ product?: AdminTypes.Maybe<(
      Pick<AdminTypes.Product, 'id'>
      & { metafield?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'key' | 'namespace' | 'value'>> }
    )>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type GetProductByHandleQueryVariables = AdminTypes.Exact<{
  handle: AdminTypes.Scalars['String']['input'];
}>;


export type GetProductByHandleQuery = { productByHandle?: AdminTypes.Maybe<(
    Pick<AdminTypes.Product, 'id' | 'title' | 'handle'>
    & { metafield?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'id' | 'key' | 'namespace' | 'value'>> }
  )> };

export type GetProductsByFowardPaginationQueryVariables = AdminTypes.Exact<{
  numProducts: AdminTypes.Scalars['Int']['input'];
  cursor?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
}>;


export type GetProductsByFowardPaginationQuery = { products: { edges: Array<{ node: (
        Pick<AdminTypes.Product, 'id' | 'title' | 'status' | 'handle'>
        & { metafield?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'key' | 'namespace' | 'value'>> }
      ) }>, pageInfo: Pick<AdminTypes.PageInfo, 'startCursor' | 'endCursor' | 'hasNextPage' | 'hasPreviousPage'> } };

export type GetProductsByBackwardPaginationQueryVariables = AdminTypes.Exact<{
  numProducts: AdminTypes.Scalars['Int']['input'];
  cursor?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
}>;


export type GetProductsByBackwardPaginationQuery = { products: { edges: Array<{ node: (
        Pick<AdminTypes.Product, 'id' | 'title' | 'status' | 'handle'>
        & { metafield?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'key' | 'namespace' | 'value'>> }
      ) }>, pageInfo: Pick<AdminTypes.PageInfo, 'startCursor' | 'endCursor' | 'hasPreviousPage' | 'hasNextPage'> } };

export type GetMetafieldDefinitionQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type GetMetafieldDefinitionQuery = { metafieldDefinitions: { edges: Array<{ node: (
        Pick<AdminTypes.MetafieldDefinition, 'name'>
        & { type: Pick<AdminTypes.MetafieldDefinitionType, 'name'> }
      ) }> } };

export type CreateMetafieldDefinitionMutationVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type CreateMetafieldDefinitionMutation = { metafieldDefinitionCreate?: AdminTypes.Maybe<{ createdDefinition?: AdminTypes.Maybe<Pick<AdminTypes.MetafieldDefinition, 'id'>>, userErrors: Array<Pick<AdminTypes.MetafieldDefinitionCreateUserError, 'field' | 'message'>> }> };

interface GeneratedQueryTypes {
  "#graphql\nquery getProductByHandle($handle: String!) {\n  productByHandle(handle: $handle) {\n    id\n    title\n    handle\n    metafield(namespace: \"hydrogen_reviews\", key: \"product_reviews\") {\n      id,\n      key\n      namespace\n      value\n    }\n  }\n}": {return: GetProductByHandleQuery, variables: GetProductByHandleQueryVariables},
  "#graphql\n  query getProductsByFowardPagination($numProducts: Int!, $cursor: String) {\n    products (first: $numProducts, after: $cursor) {\n      edges {\n        node {\n          id\n          title\n          status\n          handle\n          metafield(namespace: \"hydrogen_reviews\", key: \"product_reviews\") {\n            key\n            namespace\n            value\n          }\n        }\n      },\n      pageInfo {\n        startCursor,\n        endCursor,\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n": {return: GetProductsByFowardPaginationQuery, variables: GetProductsByFowardPaginationQueryVariables},
  "#graphql\n  query getProductsByBackwardPagination($numProducts: Int!, $cursor: String) {\n    products (last: $numProducts, before: $cursor) {\n      edges {\n        node {\n          id\n          title\n          status\n          handle\n          metafield(namespace: \"hydrogen_reviews\", key: \"product_reviews\") {\n            key\n            namespace\n            value\n          }\n        }\n      },\n      pageInfo {\n        startCursor,\n        endCursor,\n        hasPreviousPage\n        hasNextPage\n      }\n    }\n  }\n": {return: GetProductsByBackwardPaginationQuery, variables: GetProductsByBackwardPaginationQueryVariables},
  "#graphql\n  query getMetafieldDefinition{\n    metafieldDefinitions(namespace: \"hydrogen_reviews\", ownerType: PRODUCT, first: 1) {\n      edges {\n        node {\n          name\n          type {\n            name\n          }\n        }\n      }\n    }\n  }\n": {return: GetMetafieldDefinitionQuery, variables: GetMetafieldDefinitionQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\nmutation updateProduct($input: ProductInput!) {\n  productUpdate(input: $input) {\n    product {\n      id\n      metafield(namespace: \"hydrogen_reviews\", key: \"product_reviews\") {\n        key\n        namespace\n        value\n      }\n    }\n    userErrors {\n      field\n      message\n    }\n  }\n}": {return: UpdateProductMutation, variables: UpdateProductMutationVariables},
  "#graphql\nmutation createMetafieldDefinition {\n  metafieldDefinitionCreate(\n    definition: {namespace: \"hydrogen_reviews\", key: \"product_reviews\", name: \"Product Reviews\", ownerType: PRODUCT, type: \"json\"}\n  ) {\n    createdDefinition {\n      id\n    }\n    userErrors {\n      field\n      message\n    }\n  }\n}": {return: CreateMetafieldDefinitionMutation, variables: CreateMetafieldDefinitionMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
