import {
  ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import React, { useCallback, useEffect, useState } from "react";
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

    await admin.graphql(
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

    try {
      return json({
        action: "create",
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
    try {
      const reviews = formData.get("reviews");
      const productId = formData.get("productId");
      const metafieldId = formData.get("metafieldId");
      await admin.graphql(
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
                  value: reviews,
                },
              ],
            },
          },
        }
      );
      return json({
        action: "delete",
        status: "success",
      });
    } catch (error) {
      console.log("error", error);
      return json({
        status: "error",
      });
    }
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

  const onReviewDelete = useCallback(() => {
    const updatedReviews = reviews.filter((review: ProductReview) => {
      return !selectedItems!.includes(review.id);
    });
    submit(
      {
        reviews: JSON.stringify([...updatedReviews]),
        productId: product.id,
        metafieldId: metafield?.id,
      },
      {
        method: "DELETE",
      }
    );
    setSelectedItems([]);
  }, [metafield?.id, product.id, reviews, selectedItems, submit]);

  useEffect(() => {
    if (actionData && actionData.status === "success") {
      const message = actionData.action === "create" ? "created" : "deleted";
      shopify.toast.show(`Review ${message} successfully`);
    } else if (actionData && actionData.status === "errro") {
      const message = actionData.action === "create" ? "creating" : "deleting";
      shopify.toast.show(`Review ${message} failed`, {
        isError: true,
      });
    }
  }, [actionData]);

  const resourceName = {
    singular: "review",
    plural: "reviews",
  };

  const bulkActions = [
    {
      content: selectedItems?.length === 1 ? "Delete review" : "Delete reviews",
      onAction: onReviewDelete,
      destructive: true,
    },
  ];

  const averageRating =
    reviews.reduce((acc: number, review: ProductReview) => {
      return acc + Number(review.rating);
    }, 0) / reviews.length;

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
              loading={navigation.state === "loading"}
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
              <Text as="p" variant="headingLg">
                Overall Rating
              </Text>
              <StarRating reviews={averageRating} />
            </BlockStack>
          </Card>
        </BlockStack>
      </InlineGrid>
    </Page>
  );
}
