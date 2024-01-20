import { json, type LoaderFunctionArgs } from "@remix-run/node";
import React, { useState } from "react";
import type { ResourceListProps } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import {
  Avatar,
  ResourceItem,
  ResourceList,
  Text,
  Box,
  Page,
  InlineGrid,
  BlockStack,
  Card,
  SkeletonDisplayText,
  Bleed,
  Divider,
  SkeletonBodyText,
} from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { StarRating } from "~/components/star-rating";

const SkeletonLabel = (props) => {
  return (
    <Box
      background="bg-fill-tertiary"
      minHeight="1rem"
      maxWidth="5rem"
      borderRadius="base"
      {...props}
    />
  );
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const handle = params.handle;

  try {
    const productRequest = await admin.graphql(
      `#graphql
      query getProduct($handle: String!) {
        productByHandle(handle: $handle) {
          id
          title
          description
          handle
          metafield(namespace: "hydrogen_reviews", key: "product_reviews") {
            key
            namespace
            value
          }
        }
      }`,
      {
        variables: {
          handle,
        },
      }
    );

    const productJson = await productRequest.json();
    const metafield = productJson.data.productByHandle?.metafield;
    delete productJson.data.productByHandle.metafield;

    return json({
      product: productJson.data.productByHandle,
      reviews: metafield ? JSON.parse(metafield.value) : [],
    });
  } catch (error) {
    return json({
      product: null,
      reviews: [],
    });
  }
};

export default function Index() {
  const { product, reviews } = useLoaderData<typeof loader>();

  const [selectedItems, setSelectedItems] = useState<
    ResourceListProps["selectedItems"]
  >([]);

  const resourceName = {
    singular: "review",
    plural: "reviews",
  };

  const bulkActions = [
    {
      content: "Delete reviews",
      onAction: () => console.log("Todo: implement bulk add tags"),
      destructive: true,
    },
  ];

  return (
    <Page backAction={{ content: "Home", url: "/app" }} title={product.title}>
      <InlineGrid columns={{ xs: 1, md: "2fr 1fr" }} gap="400">
        <BlockStack gap="400">
          <Card roundedAbove="sm">
            <BlockStack gap="400">
              <SkeletonLabel />
              <Box border="divider" borderRadius="base" minHeight="2rem" />
              <SkeletonLabel maxWidth="8rem" />
              <Box border="divider" borderRadius="base" minHeight="20rem" />
            </BlockStack>
          </Card>
          <Card roundedAbove="sm" padding="0">
            <ResourceList
              resourceName={resourceName}
              items={reviews}
              bulkActions={bulkActions}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
              renderItem={(item) => {
                const { id, name, rating, message } = item;
                const media = <Avatar customer size="md" name={name} />;

                return (
                  <ResourceItem
                    id={id}
                    url="#"
                    media={media}
                    accessibilityLabel={`View details for ${name}`}
                  >
                    <h3
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text fontWeight="bold" as="span">
                        {name}
                      </Text>
                      <StarRating reviews={3} />
                    </h3>
                    <div>{message}</div>
                  </ResourceItem>
                );
              }}
            />
          </Card>
        </BlockStack>
        <BlockStack gap={{ xs: "400", md: "200" }}>
          <Card roundedAbove="sm">
            <BlockStack gap="400">
              <SkeletonDisplayText size="small" />
              <Box border="divider" borderRadius="base" minHeight="2rem" />
              <Box>
                <Bleed marginInline={{ xs: 400, sm: 500 }}>
                  <Divider />
                </Bleed>
              </Box>
              <SkeletonLabel />
              <Divider />
              <SkeletonBodyText />
            </BlockStack>
          </Card>
        </BlockStack>
      </InlineGrid>
    </Page>
  );
}
