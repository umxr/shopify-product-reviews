import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(
    request
  );

  if (!admin) {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    throw new Response();
  }

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }

      break;
    case "PRODUCTS_UPDATE":
      const shopifyId = payload.admin_graphql_api_id;
      const product = await db.product.findFirst({
        where: { shopifyId },
      });

      if (!product) {
        await db.product.create({
          data: {
            shopifyId: payload.admin_graphql_api_id,
            name: payload.title,
          },
        });
      } else {
        await db.product.update({
          where: {},
          data: {
            shopifyId: payload.admin_graphql_api_id,
            name: payload.title,
          },
        });
      }

      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
