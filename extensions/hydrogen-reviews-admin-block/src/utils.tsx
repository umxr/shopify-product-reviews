export async function makeGraphQLQuery(
  query: string,
  variables: Record<string, any>
) {
  const graphQLQuery = {
    query,
    variables,
  };

  const res = await fetch("shopify:admin/api/graphql.json", {
    method: "POST",
    body: JSON.stringify(graphQLQuery),
  });

  if (!res.ok) {
    console.error("Network error");
  }

  return await res.json();
}

export async function getProductById(productId: string) {
  try {
    const product = await makeGraphQLQuery(
      `
      query getProductById($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          featuredImage {
            url
          }
          metafield(namespace: "hydrogen_reviews", key: "product_reviews") {
            id,
            key
            namespace
            value
          }
        }
      }
    `,
      { id: productId }
    );
    const metafield = product.data.product?.metafield ?? null;
    delete product.data.product.metafield;

    return {
      product: product.data.product,
      metafield,
      reviews: metafield ? JSON.parse(metafield.value) : [],
    };
  } catch (error) {
    console.error("Error fetching product info", error);
    return null;
  }
}
