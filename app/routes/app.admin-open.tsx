import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Card, EmptyState, Page, Spinner } from "@shopify/polaris";
import { useEffect } from "react";
import { createProductHandler } from "~/api/product";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const productId = url.searchParams.get("id");
  const productGraphId = `gid://shopify/Product/${productId}`;
  const { getProductById } = createProductHandler(admin);

  try {
    const { product } = await getProductById(productGraphId);
    return json({
      product,
      found: product ? true : false,
    });
  } catch (error) {
    console.error("Error fetching product", error);
    return json({
      found: false,
      product: null,
    });
  }
};

export default function Index() {
  const { found, product } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const title = found
    ? "Opening Product in Hydrogen Reviews..."
    : "Product not found";
  const handle = product?.handle;

  useEffect(() => {
    if (found) {
      navigate(`/app/${handle}`);
    }
  }, [found, handle, navigate]);

  return (
    <Page title={title}>
      {found ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "50vh",
          }}
        >
          <Spinner accessibilityLabel="Loading" size="large" />
        </div>
      ) : (
        <Card>
          <EmptyState
            heading="Product not found"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>
              We couldn't find a product with that ID. Please trying opening the
              product from the Shopify admin.
            </p>
          </EmptyState>
        </Card>
      )}
    </Page>
  );
}
