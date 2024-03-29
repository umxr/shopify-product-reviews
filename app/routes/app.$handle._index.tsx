import type { ActionFunctionArgs } from "@remix-run/node";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import React, { useCallback, useEffect, useState } from "react";
import type { ResourceListProps } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import {
  Avatar,
  ResourceItem,
  ResourceList,
  Text,
  Page,
  InlineGrid,
  BlockStack,
  Card,
  EmptyState,
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
import { createActionHandlers } from "~/actions/handle";
import { RequestMethod } from "~/actions";
import { ExportMinor } from "@shopify/polaris-icons";
import { createProductHandler } from "~/api/product";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const handle = params.handle;
  if (!handle) {
    console.error("Missing handle for GET request");
    return json(
      {
        error: "Missing handle for GET request",
      },
      {
        status: 404,
      }
    );
  }

  try {
    const { getProductByHandle } = createProductHandler(admin);
    const result = await getProductByHandle(handle);
    return json(result);
  } catch (error) {
    console.error("Failed to load product", error);
    return json(
      {
        product: null,
        reviews: [],
        metafield: null,
        error: "Failed to load product",
      },
      {
        status: 500,
      }
    );
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const { handlePostRequest, handleDeleteRequest } =
    createActionHandlers(admin);

  switch (request.method) {
    case RequestMethod.POST:
      return await handlePostRequest(formData);
    case RequestMethod.DELETE:
      return await handleDeleteRequest(formData);
    default:
      return new Response(null, { status: 405 }); // Method Not Allowed
  }
};

export default function Index() {
  const actionData = useActionData();
  const { product, reviews, metafield } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [exporting, setExporting] = useState(false);

  const productId = product?.id;
  const metafieldId = metafield?.id;

  const [selectedItems, setSelectedItems] = useState<
    ResourceListProps["selectedItems"]
  >([]);

  const onReviewCreate = useCallback(
    (data: ProductReview) => {
      submit(
        {
          ...data,
          reviews: JSON.stringify([...reviews]),
          productId,
          metafieldId,
        },
        {
          method: "POST",
        }
      );
    },
    [metafieldId, productId, reviews, submit]
  );

  const onReviewDelete = useCallback(() => {
    const updatedReviews = reviews.filter((review: ProductReview) => {
      return selectedItems ? !selectedItems.includes(review.id) : true;
    });
    submit(
      {
        reviews: JSON.stringify([...updatedReviews]),
        productId,
        metafieldId,
      },
      {
        method: "DELETE",
      }
    );
    setSelectedItems([]);
  }, [metafieldId, productId, reviews, selectedItems, submit]);

  const onReviewsExport = useCallback(async () => {
    setExporting(true);
    try {
      const response = await fetch(`${product.handle}/csv`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${product.handle}-reviews.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error during CSV download:", error);
    } finally {
      setExporting(false);
    }
  }, [product.handle]);

  useEffect(() => {
    if (actionData && actionData.status === "success") {
      const message = actionData.action === "create" ? "created" : "deleted";
      shopify.toast.show(`Review ${message} successfully`);
    } else if (actionData && actionData.status === "error") {
      const message = actionData.action === "create" ? "creating" : "deleting";
      shopify.toast.show(`Review ${message} failed`, {
        isError: true,
      });
    }
  }, [actionData]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, review) => acc + Number(review.rating), 0) /
        reviews.length
      : 0;

  return (
    <Page
      backAction={{ content: "Home", url: "/app" }}
      title={product.title}
      secondaryActions={[
        {
          content: "Export",
          icon: ExportMinor,
          accessibilityLabel: "Export reviews",
          onAction: onReviewsExport,
          loading: exporting,
        },
      ]}
    >
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
              emptyState={
                reviews.length === 0 ? (
                  <EmptyState heading="This product has no reviews" image={""}>
                    <Text as="p">
                      Once a customer leaves a review, it will show up here.
                    </Text>
                  </EmptyState>
                ) : null
              }
              resourceName={{
                singular: "review",
                plural: "reviews",
              }}
              items={reviews}
              bulkActions={[
                {
                  content:
                    selectedItems?.length === 1
                      ? "Delete review"
                      : "Delete reviews",
                  onAction: onReviewDelete,
                  destructive: true,
                },
              ]}
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
              {reviews.length > 0 ? (
                <StarRating reviews={averageRating} />
              ) : (
                <Text as="p">No reviews</Text>
              )}
            </BlockStack>
          </Card>
        </BlockStack>
      </InlineGrid>
    </Page>
  );
}
