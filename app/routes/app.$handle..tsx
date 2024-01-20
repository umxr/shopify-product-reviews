import {
  ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import React, { useCallback, useState } from "react";
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
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { StarRating } from "~/components/star-rating";
import type { ProductReview } from "~/components/product-review-form";
import { ProductReviewForm } from "~/components/product-review-form";

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
            id,
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
      metafield,
      reviews: metafield ? JSON.parse(metafield.value) : [],
    });
  } catch (error) {
    return json({
      product: null,
      reviews: [],
      metafield: null,
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  if (request.method === "POST") {
    const reviews = JSON.parse(formData.get("reviews"));
    const name = formData.get("name");
    const message = formData.get("message");
    const rating = formData.get("rating");
    const id = formData.get("id");
    const productId = formData.get("productId");
    const metafieldId = formData.get("metafieldId");

    const updatedReviews = JSON.stringify([
      ...reviews,
      {
        name,
        message,
        rating,
        id,
      },
    ]);

    const productUpdateRequest = await admin.graphql(
      `#graphql
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
      }`,
      {
        variables: {
          input: {
            id: productId,
            metafields: [
              {
                id: metafieldId,
                value: updatedReviews,
              },
            ],
          },
        },
      }
    );

    const productUpdateJson = await productUpdateRequest.json();

    try {
      return json({
        productUpdateJson,
        status: "success",
      });
    } catch (error) {
      console.log("error", error);
      return json({
        status: "error",
      });
    }
  }

  if (request.method === "DELETE") {
    return json(formData);
  }

  return new Response(null, {
    status: 304,
  });
};

export default function Index() {
  const actionData = useActionData();
  const { product, reviews, metafield } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();

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

  const onReviewCreate = useCallback(
    (data: ProductReview) => {
      submit(
        {
          ...data,
          reviews: JSON.stringify([...reviews]),
          productId: product.id,
          metafieldId: metafield?.id,
        },
        {
          method: "POST",
        }
      );
    },
    [metafield?.id, product.id, reviews, submit]
  );

  return (
    <Page backAction={{ content: "Home", url: "/app" }} title={product.title}>
      <InlineGrid columns={{ xs: 1, md: "2fr 1fr" }} gap="400">
        <BlockStack gap="400">
          <Card roundedAbove="sm">
            <ProductReviewForm
              onSubmit={onReviewCreate}
              state={navigation.state}
            />
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
                      <StarRating reviews={Number(rating)} />
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
