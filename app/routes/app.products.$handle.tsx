import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";
import {
  Box,
  Card,
  Layout,
  Link,
  List,
  EmptyState,
  Text,
  BlockStack,
  LegacyCard,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import type { Product } from "~/types/product";
import invariant from "tiny-invariant";
import db from "../db.server";
import { PageTitle } from "~/components/page-title";
import { PageLayout } from "~/components/page-layout";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  invariant(params.handle, "No product handle provided");

  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query getProduct($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        status
        handle
      }
    }`,
    { variables: { handle: params.handle } }
  );

  const responseJson = await response.json();

  const shopifyProduct: Product = responseJson.data.productByHandle;

  invariant(shopifyProduct, "No product found");

  const dbProduct = await db.product.findFirst({
    where: { shopifyId: shopifyProduct.id },
    include: { reviews: true },
  });

  return json({
    shopifyProduct,
    product: dbProduct,
    session,
  });
};

const NoReviews = () => {
  return (
    <LegacyCard sectioned>
      <EmptyState
        heading="Manage your product reviews"
        action={{ content: "Add review" }}
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>
          Add reviews to your products to build trust with your customers and
          boost sales.
        </p>
      </EmptyState>
    </LegacyCard>
  );
};

export default function ProductPage() {
  const { shopifyProduct, product } = useLoaderData<typeof loader>();
  if (!product) {
    return (
      <PageLayout title={shopifyProduct.title}>
        <NoReviews />
      </PageLayout>
    );
  }
  return (
    <PageLayout title={shopifyProduct.title}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="p" variant="bodyMd">
                The app template comes with an additional page which
                demonstrates how to create multiple pages within app navigation
                using{" "}
                <Link
                  url="https://shopify.dev/docs/apps/tools/app-bridge"
                  target="_blank"
                  removeUnderline
                >
                  App Bridge
                </Link>
                .
              </Text>
              <Text as="p" variant="bodyMd">
                To create your own page and have it show up in the app
                navigation, add a page inside <Code>app/routes</Code>, and a
                link to it in the <Code>&lt;ui-nav-menu&gt;</Code> component
                found in <Code>app/routes/app.jsx</Code>.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </PageLayout>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <Box
      as="span"
      padding="025"
      paddingInlineStart="100"
      paddingInlineEnd="100"
      background="bg-surface-active"
      borderWidth="025"
      borderColor="border"
      borderRadius="100"
    >
      <code>{children}</code>
    </Box>
  );
}
