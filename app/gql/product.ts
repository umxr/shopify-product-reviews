export const PRODUCT_METAFIELD_MUTATION = `#graphql
mutation updateProduct($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      metafield(namespace: "hydrogen_reviews", key: "product_reviews") {
        key
        namespace
        value
      }
    }
    userErrors {
      field
      message
    }
  }
}`;

export const GET_PRODUCT_QUERY = `#graphql
query getProductByHandle($handle: String!) {
  productByHandle(handle: $handle) {
    id
    title
    handle
    metafield(namespace: "hydrogen_reviews", key: "product_reviews") {
      id,
      key
      namespace
      value
    }
  }
}`;

export const FORWARD_PAGINATION_QUERY = `#graphql
  query getProductsByFowardPagination($numProducts: Int!, $cursor: String) {
    products (first: $numProducts, after: $cursor) {
      edges {
        node {
          id
          title
          status
          handle
          metafield(namespace: "hydrogen_reviews", key: "product_reviews") {
            key
            namespace
            value
          }
        }
      },
      pageInfo {
        startCursor,
        endCursor,
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const BACKWARD_PAGINATION_QUERY = `#graphql
  query getProductsByBackwardPagination($numProducts: Int!, $cursor: String) {
    products (last: $numProducts, before: $cursor) {
      edges {
        node {
          id
          title
          status
          handle
          metafield(namespace: "hydrogen_reviews", key: "product_reviews") {
            key
            namespace
            value
          }
        }
      },
      pageInfo {
        startCursor,
        endCursor,
        hasPreviousPage
        hasNextPage
      }
    }
  }
`;

export const METAFIELD_DEFINITION_QUERY = `#graphql
  query getMetafieldDefinition{
    metafieldDefinitions(namespace: "hydrogen_reviews", ownerType: PRODUCT, first: 1) {
      edges {
        node {
          name
          type {
            name
          }
        }
      }
    }
  }
`;

export const METAFIELD_DEFINITION_MUTATION = `#graphql
mutation createMetafieldDefinition {
  metafieldDefinitionCreate(
    definition: {namespace: "hydrogen_reviews", key: "product_reviews", name: "Product Reviews", ownerType: PRODUCT, type: "json"}
  ) {
    createdDefinition {
      id
    }
    userErrors {
      field
      message
    }
  }
}`;
