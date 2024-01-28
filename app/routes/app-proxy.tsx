import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { RequestMethod } from "~/actions";
import { createActionHandlers } from "~/actions/handle";
import { authenticate } from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { liquid } = await authenticate.public.appProxy(request);

  return liquid("Hello {{shop.name}}");
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.public.appProxy(request);
  const { handlePostRequest } = createActionHandlers(admin);
  switch (request.method) {
    case RequestMethod.POST:
      return await handlePostRequest(request);
    default:
      return new Response(null, { status: 405 }); // Method Not Allowed
  }
}
