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
query getProduct($handle: String!) {
  productByHandle(handle: $handle) {
    id
    title
    description
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
  query getProducts($numProducts: Int!, $cursor: String) {
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
  query getProducts($numProducts: Int!, $cursor: String) {
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
  {
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
