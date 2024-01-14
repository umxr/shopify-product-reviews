import { json, type LoaderFunctionArgs } from "@remix-run/node";
import {
  Badge,
  IndexTable,
  LegacyCard,
  Link,
  Page,
  Text,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { flattenEdges } from "~/utils/flattenEdges";
import type { Product } from "~/types/product";
import type { Tone } from "@shopify/polaris/build/ts/src/components/Badge";
import { useCallback } from "react";

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
    const productsData = await response.json();
    const pagination = productsData.data.products.pageInfo;
    const formattedProducts = flattenEdges(
      productsData.data.products
    ) as Product[];

    console.log("pagination", {
      pagination: {
        ...pagination,
        first: numProductsForward,
        last: numProductsBackward,
      },
    });

    return json({
      products: formattedProducts,
      pagination: {
        ...pagination,
        first: numProductsForward,
        last: numProductsBackward,
      },
      session,
    });
  } catch (error) {
    throw new Response("Error fetching products", { status: 500 });
  }
};

export default function Index() {
  const { products, pagination } = useLoaderData<typeof loader>();
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

  return (
    <Page title="Reviews">
      <LegacyCard>
        <IndexTable
          selectable={false}
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
          {products.map(({ id, title, status, handle }, index) => {
            const formattedStatus =
              status.charAt(0) + status.slice(1).toLowerCase();
            const url = `app/products/${handle}`;

            return (
              <IndexTable.Row id={id} key={id} position={index}>
                <IndexTable.Cell>
                  <Link dataPrimaryLink url={url}>
                    <Text fontWeight="bold" as="span">
                      {title}
                    </Text>
                  </Link>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge tone={statusMap[status]}>{formattedStatus}</Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>{1}</IndexTable.Cell>
              </IndexTable.Row>
            );
          })}
        </IndexTable>
      </LegacyCard>
    </Page>
  );
}
