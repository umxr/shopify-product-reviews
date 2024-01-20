import {
  ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Badge,
  Banner,
  BlockStack,
  IndexTable,
  LegacyCard,
  Link,
  List,
  Page,
  Text,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { flattenEdges } from "~/utils/flattenEdges";
import type { Product } from "~/types/product";
import type { Tone } from "@shopify/polaris/build/ts/src/components/Badge";
import { useCallback, useEffect } from "react";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Pagination parameters
  const numProductsForward = Number(searchParams.get("first")) || 10;
  const cursorForward = searchParams.get("after") || null;
  const numProductsBackward = Number(searchParams.get("last")) || 10;
  const cursorBackward = searchParams.get("before") || null;

  // Forward Pagination Query
  const forwardPaginationQuery = `query getProducts($numProducts: Int!, $cursor: String) {
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
  }`;

  // Backward Pagination Query
  const backwardPaginationQuery = `query getProducts($numProducts: Int!, $cursor: String) {
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
  }`;

  const productMetafieldDefinitionQuery = `{
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
  }`;

  let query, variables;
  if (cursorForward) {
    query = forwardPaginationQuery;
    variables = { numProducts: numProductsForward, cursor: cursorForward };
  } else if (cursorBackward) {
    query = backwardPaginationQuery;
    variables = { numProducts: numProductsBackward, cursor: cursorBackward };
  } else {
    // Default to forward pagination with no cursor
    query = forwardPaginationQuery;
    variables = { numProducts: numProductsForward, cursor: null };
  }

  try {
    const response = await admin.graphql(query, { variables });
    const metafieldDefinitionResponse = await admin.graphql(
      productMetafieldDefinitionQuery
    );
    const productsData = await response.json();
    const metafieldDefinitionData = await metafieldDefinitionResponse.json();
    const pagination = productsData.data.products.pageInfo;
    const formattedProducts = flattenEdges(
      productsData.data.products
    ) as Product[];
    const formattedProductsWithMetafields = formattedProducts.map((product) => {
      const metafield = product.metafield
        ? JSON.parse(product.metafield.value)
        : [];
      return {
        ...product,
        metafield,
      };
    });

    const hasMetafieldDefinition =
      metafieldDefinitionData.data?.metafieldDefinitions.edges.length > 0;

    return json({
      products: formattedProductsWithMetafields,
      pagination: {
        ...pagination,
        first: numProductsForward,
        last: numProductsBackward,
      },
      session,
      hasMetafieldDefinition,
    });
  } catch (error) {
    console.log("error", error);
    throw new Response("Error fetching products", { status: 500 });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const type = formData.get("type");

  if (type === "create_metafield_definition") {
    const mutation = `mutation createMetafieldDefinition {
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

    try {
      await admin.graphql(mutation);
      return json({
        ok: true,
      });
    } catch (error) {
      console.log("error", error);
      return json({
        ok: false,
      });
    }
  }
};

export default function Index() {
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const { products, pagination, hasMetafieldDefinition } =
    useLoaderData<typeof loader>();
  const [_, setSearchParams] = useSearchParams();
  const statusMap: Record<Product["status"], Tone> = {
    ACTIVE: "success",
    ARCHIVED: "new",
    DRAFT: "info",
  };

  const navigatePage = useCallback(
    (cursor: string, isNext: boolean) => {
      const params = new URLSearchParams();
      if (isNext) {
        params.set("after", cursor);
        params.delete("before");
        params.set("first", pagination.first.toString());
        params.delete("last");
      } else {
        params.set("before", cursor);
        params.delete("after");
        params.set("last", pagination.last.toString());
        params.delete("first");
      }
      setSearchParams(params);
    },
    [pagination.first, pagination.last, setSearchParams]
  );

  const createMetafieldDefinition = useCallback(() => {
    const data = {
      type: "create_metafield_definition",
    };
    submit(data, { method: "post" });
  }, [submit]);

  useEffect(() => {
    if (actionData && actionData.ok === true) {
      shopify.toast.show("Metafield definition created successfully");
    } else if (actionData && actionData.ok === false) {
      shopify.toast.show("Metafield definition creation failed", {
        isError: true,
      });
    }
  }, [actionData]);

  return (
    <Page title="Reviews">
      <BlockStack gap="500">
        {!hasMetafieldDefinition && (
          <Banner
            title="We've noticed you're missing a metafield definition"
            action={{
              content: "Create Metafield",
              onAction: createMetafieldDefinition,
            }}
            tone="warning"
          >
            <Text as="p">
              The Hydrogen Reviews app requires a metafield definition to be
              created before you can start using it.
            </Text>
          </Banner>
        )}
        <LegacyCard>
          <IndexTable
            selectable={false}
            loading={navigation.state === "loading"}
            resourceName={{
              singular: "product",
              plural: "products",
            }}
            itemCount={products.length}
            headings={[
              { title: "Title" },
              {
                title: "Status",
              },
              { title: "Review Count" },
            ]}
            pagination={{
              hasNext: pagination.hasNextPage,
              hasPrevious: pagination.hasPreviousPage,
              onNext: () => navigatePage(pagination.endCursor, true),
              onPrevious: () => navigatePage(pagination.startCursor, false),
            }}
          >
            {products.map(({ id, title, status, handle, metafield }, index) => {
              const formattedStatus =
                status.charAt(0) + status.slice(1).toLowerCase();

              return (
                <IndexTable.Row id={id} key={id} position={index}>
                  <IndexTable.Cell>
                    <Link dataPrimaryLink url={handle}>
                      <Text fontWeight="bold" as="span">
                        {title}
                      </Text>
                    </Link>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Badge tone={statusMap[status]}>{formattedStatus}</Badge>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{metafield.length}</IndexTable.Cell>
                </IndexTable.Row>
              );
            })}
          </IndexTable>
        </LegacyCard>
      </BlockStack>
    </Page>
  );
}
