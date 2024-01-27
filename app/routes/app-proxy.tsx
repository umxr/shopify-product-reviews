import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { authenticate } from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { liquid } = await authenticate.public.appProxy(request);

  return liquid("Hello {{shop.name}}");
}

export async function action({ request }: ActionFunctionArgs) {
  const method = request.method;
  if (method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const payload = await request.json();
  return json(payload);
}
