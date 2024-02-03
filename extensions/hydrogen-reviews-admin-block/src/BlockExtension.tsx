import {
  reactExtension,
  useApi,
  AdminBlock,
  BlockStack,
  Text,
  Heading,
} from "@shopify/ui-extensions-react/admin";
import { useEffect, useState } from "react";
import { getProductById } from "./utils";

// The target used here must match the target used in the extension's toml file (./shopify.extension.toml)
const TARGET = "admin.product-details.block.render";

export default reactExtension(TARGET, () => <App />);

type Status = "idle" | "success" | "error" | "loading";

function App() {
  const [status, setStatus] = useState<Status>("loading");
  const [reviews, setReviews] = useState<any[]>([]);
  // The useApi hook provides access to several useful APIs like i18n and data.
  const {
    extension: { target },
    i18n,
    data,
  } = useApi(TARGET);

  useEffect(() => {
    (async function getProductInfo() {
      try {
        const productId = data.selected[0].id;
        const { reviews } = await getProductById(productId);
        setReviews(reviews);
        setStatus("success");
      } catch (error) {
        console.log("Error fetching product info", error);
        setStatus("error");
      }
    })();
  }, [data.selected]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, review) => acc + Number(review.rating), 0) /
        reviews.length
      : 0;

  if (status === "loading") {
    return (
      <AdminBlock title="Product Reviews">
        <BlockStack>
          <Text>Loading...</Text>
        </BlockStack>
      </AdminBlock>
    );
  }

  return (
    // The AdminBlock component provides an API for setting the title of the Block extension wrapper.
    <AdminBlock title="Product Reviews">
      <BlockStack>
        <Heading size={3}>
          {i18n.translate("average_rating", { target })}
        </Heading>
        <Text>{`${averageRating}/5`} Stars</Text>
      </BlockStack>
    </AdminBlock>
  );
}
