import type { ActionFunctionArgs } from "@remix-run/node";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import db from "../db.server";

import { authenticate } from "~/shopify.server";
import {
  useActionData,
  useNavigate,
  useSubmit,
  useLoaderData,
  redirect,
} from "@remix-run/react";
import { useCallback, useState } from "react";
import {
  Bleed,
  BlockStack,
  Box,
  Card,
  Divider,
  InlineGrid,
  Page,
  TextField,
  Text,
  Select,
  InlineStack,
  Thumbnail,
  Link,
} from "@shopify/polaris";
import type { ProductWithImage } from "~/types/product";
import { DeleteMinor } from "@shopify/polaris-icons";
import { validateReview } from "~/models/review.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  invariant(params.id, "No review id provided");
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query getProduct($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        status
        handle
        featuredImage {
          altText,
          url
        }
        onlineStoreUrl
      }
    }`,
    { variables: { handle: params.handle } }
  );

  const responseJson = await response.json();

  const shopifyProduct: ProductWithImage = responseJson.data.productByHandle;
  const users = (await db.user.findMany()).map((user) => ({
    ...user,
    id: user.id.toString(),
  }));

  if (params.id === "new") {
    return json({
      product: shopifyProduct,
      users,
      review: {
        productId: shopifyProduct.id,
        userId: users[0].id,
        title: "test",
        content: "really good",
        rating: 5,
      },
    });
  }

  const review = await db.review.findFirst({
    where: { id: Number(params.id) },
  });

  invariant(review, "No review found");

  return json({
    product: shopifyProduct,
    users,
    review: {
      id: review.id.toString(),
      productId: review.productId,
      userId: review.userId?.toString() ?? "",
      title: review.title,
      content: review.content,
      rating: review.rating,
    },
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await authenticate.admin(request);

  const data = {
    ...Object.fromEntries(await request.formData()),
  };

  if (data.action === "delete") {
    await db.review.delete({ where: { id: Number(params.id) } });
    return redirect("/app/users");
  }

  const errors = validateReview(data);

  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const review =
    params.id === "new"
      ? await db.review.create({
          data: {
            title: data.title as string,
            content: data.content as string,
            rating: Number(data.rating),
            userId: Number(data.userId),
            productId: Number(data.productId),
          },
        })
      : await db.review.update({ where: { id: Number(params.id) }, data });

  return redirect(`/app/products/${params.handle}/reviews/${review.id}`);
};

export default function ProductReviewPage() {
  const errors = useActionData()?.errors || {};
  const nav = useNavigate();
  const submit = useSubmit();
  const { review, product, users } = useLoaderData<typeof loader>();
  const [formState, setFormState] = useState(review);
  const [cleanFormState, setCleanFormState] = useState(review);

  const handleSave = useCallback(() => {
    const data = {
      productId: formState.productId,
      userId: formState.userId,
      title: formState.title,
      content: formState.content,
      rating: formState.rating,
    };

    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }, [formState, submit]);

  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const productId = product.id.split("/").pop();

  return (
    <Page
      backAction={{
        content: product.title,
        url: `/app/products/${product.handle}`,
      }}
      title={review?.id ? "Edit review" : "New review"}
      primaryAction={{
        content: "Save",
        loading: isSaving,
        disabled: !isDirty || isSaving || isDeleting,
        onAction: handleSave,
      }}
      secondaryActions={[
        {
          content: "Delete",
          loading: isDeleting,
          disabled: !review.id || !review || isSaving || isDeleting,
          icon: DeleteMinor,
          destructive: true,
          outline: true,
          accessibilityLabel: "Delete review",
          onAction: () => {
            submit({ action: "delete" }, { method: "post" });
          },
        },
      ]}
    >
      <InlineGrid columns={{ xs: 1, md: "2fr 1fr" }} gap="400">
        <BlockStack gap="400">
          <Card roundedAbove="sm">
            <BlockStack gap="400">
              <TextField
                id="title"
                label="Title"
                autoComplete="off"
                value={formState.title}
                onChange={(title) => setFormState({ ...formState, title })}
                error={errors.title}
              />
              <TextField
                id="content"
                label="Content"
                autoComplete="off"
                value={formState.content}
                multiline={4}
                onChange={(content) => setFormState({ ...formState, content })}
                error={errors.content}
              />
            </BlockStack>
          </Card>
          <Card roundedAbove="sm">
            <BlockStack gap="400">
              <Select
                id="rating"
                label="Rating"
                value={formState.rating.toString()}
                onChange={(rating) => setFormState({ ...formState, rating })}
                options={[
                  { label: "1", value: "1" },
                  { label: "2", value: "2" },
                  { label: "3", value: "3" },
                  { label: "4", value: "4" },
                  { label: "5", value: "5" },
                ]}
                error={errors.rating}
              />
              <Select
                id="userId"
                label="User"
                value={formState.userId}
                onChange={(userId) => setFormState({ ...formState, userId })}
                options={users.map((user) => ({
                  label: user.name as string,
                  value: user.id.toString(),
                }))}
                error={errors.content}
              />
            </BlockStack>
          </Card>
        </BlockStack>
        <BlockStack gap={{ xs: "400", md: "200" }}>
          <Card roundedAbove="sm">
            <BlockStack gap="400">
              <Text Text variant="headingLg" as="p">
                Product
              </Text>
              <Box>
                <Bleed marginInline={{ xs: 400, sm: 500 }}>
                  <Divider />
                </Bleed>
              </Box>
              <Box>
                <InlineStack gap={"400"} blockAlign="center">
                  <Thumbnail
                    source={
                      product.featuredImage?.url ??
                      "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?format=webp"
                    }
                    alt={product.featuredImage?.altText ?? ""}
                  />
                  <Link
                    dataPrimaryLink
                    url={`shopify:admin/products/${productId}`}
                  >
                    <Text fontWeight="bold" as="span">
                      {product.title}
                    </Text>
                  </Link>
                </InlineStack>
              </Box>
            </BlockStack>
          </Card>
        </BlockStack>
      </InlineGrid>
    </Page>
  );
}
