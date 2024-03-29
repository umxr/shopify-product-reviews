import type { ActionFunctionArgs } from "@remix-run/node";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import {
  Badge,
  Banner,
  BlockStack,
  Card,
  IndexTable,
  Link,
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
import { METAFIELD_DEFINITION_MUTATION } from "~/gql/product";
import { createAppHandler, formatProductsData } from "~/api/app";
import { createMetafieldHandler } from "~/api/metafield";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);

  const { getPaginationQuery, graphqlQuery } = createAppHandler(admin);
  const { getMetafieldDefinition } = createMetafieldHandler(admin);
  const { query, variables } = getPaginationQuery(url.searchParams);

  try {
    const productsResponse = await graphqlQuery({
      query,
      variables,
    });
    const metafields = await getMetafieldDefinition();

    const productsData = await productsResponse.json();

    const pagination = productsData.data.products.pageInfo;
    const formattedProducts = formatProductsData(
      flattenEdges(productsData.data.products)
    );

    return json({
      products: formattedProducts,
      pagination: {
        ...pagination,
        first: variables.numProducts,
        last: variables.numProducts,
      },
      session,
      hasMetafieldDefinition: metafields && metafields.length > 0,
    });
  } catch (error) {
    console.error("Error fetching products", error);
    throw new Response("Error fetching products", { status: 500 });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const type = formData.get("type");

  if (type === "create_metafield_definition") {
    try {
      await admin.graphql(METAFIELD_DEFINITION_MUTATION);
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
        <Card roundedAbove="sm" padding="0">
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
        </Card>
      </BlockStack>
    </Page>
  );
}
