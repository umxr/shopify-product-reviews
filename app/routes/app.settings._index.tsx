import type { ActionFunctionArgs } from "@remix-run/node";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import {
  BlockStack,
  Box,
  Card,
  Divider,
  InlineGrid,
  Page,
  TextField,
  useBreakpoints,
  Text,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { flattenEdges } from "~/utils/flattenEdges";
import type { Product } from "~/types/product";
import { ProductWebhookConnection } from "~/components/product-webhook-connection";
import { useCallback, useState } from "react";
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useSubmit,
} from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query getAppWebhooks {
      webhookSubscriptions(first: 10) {
        edges {
          node {
            topic
          }
        }
      }
    }
  `
  );

  const webhooks = await response.json();
  const formattedWebhooks = flattenEdges(webhooks.data.webhookSubscriptions);
  const productUpdateWebook = formattedWebhooks.find(
    (webhook) => webhook.topic === "PRODUCTS_UPDATE"
  );
  const hasProductUpdateWebhookEnabled = !!productUpdateWebook;

  return json({
    hasProductUpdateWebhookEnabled,
    webhook: productUpdateWebook,
    session,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const enabled = formData.get("enabled") === "true";

  try {
    if (enabled) {
      await admin.graphql(
        `#graphql
        mutation {
          webhookSubscriptionCreate(
            topic: PRODUCTS_UPDATE
            webhookSubscription: {format: JSON, callbackUrl: "https://sole-tons-brisbane-check.trycloudflare.com/webhooks"}
          ) {
            userErrors {
              field
              message
            }
            webhookSubscription {
              topic
              id
            }
          }
        }
      `
      );
      return json({
        ok: true,
      });
    } else {
      const webhookId = formData.get("webhookId");
      await admin.graphql(
        `#graphql
        mutation deleteProductUpdateWebhook($id: ID!) {
          webhookSubscriptionDelete(id: $id) {
            deletedWebhookSubscriptionId
            userErrors {
              field
              message
            }
          }
        }
      `,
        {
          variables: {
            id: webhookId,
          },
        }
      );

      return json({
        ok: true,
      });
    }
  } catch (error) {
    console.log(error);
    return json({
      ok: false,
      error,
    });
  }
};

export default function Index() {
  const { hasProductUpdateWebhookEnabled, webhook } =
    useLoaderData<typeof loader>();
  const actionData = useActionData();
  const nav = useNavigate();
  const submit = useSubmit();

  const handleAction = useCallback(() => {
    const data = {
      enabled: !hasProductUpdateWebhookEnabled,
      webhookId: webhook?.id,
    };
    submit(data, { method: "post" });
  }, [hasProductUpdateWebhookEnabled, submit, webhook?.id]);

  console.log("hasProductUpdateWebhookEnabled", hasProductUpdateWebhookEnabled);
  console.log("webhook", webhook);
  console.log("actionData", actionData);
  const isSubmitting = nav.state === "submitting";

  return (
    <Page title="Settings" divider>
      <BlockStack gap={{ xs: "800", sm: "400" }}>
        <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
          <Box
            as="section"
            paddingInlineStart={{ xs: 400, sm: 0 }}
            paddingInlineEnd={{ xs: 400, sm: 0 }}
          >
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Product Syncing
              </Text>
              <Text as="p" variant="bodyMd">
                Sync your products with our app automatically
              </Text>
            </BlockStack>
          </Box>
          <ProductWebhookConnection
            enabled={hasProductUpdateWebhookEnabled}
            onAction={handleAction}
          />
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}
