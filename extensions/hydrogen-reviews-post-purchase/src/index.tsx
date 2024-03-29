/**
 * Extend Shopify Checkout with a custom Post Purchase user experience.
 * This template provides two extension points:
 *
 *  1. ShouldRender - Called first, during the checkout process, when the
 *     payment page loads.
 *  2. Render - If requested by `ShouldRender`, will be rendered after checkout
 *     completes
 */

import {
  extend,
  render,
  BlockStack,
  CalloutBanner,
  Heading,
  Image,
  Layout,
  TextContainer,
  View,
  useExtensionInput,
  Form,
  FormLayout,
  Select,
  TextField,
  Spinner,
  Button,
  Banner,
  Text,
} from "@shopify/post-purchase-ui-extensions-react";
import { useEffect, useState, useCallback } from "react";
import type { GetProductByIdQuery } from "~/types/admin.generated";
import type { Maybe, Metafield } from "~/types/admin.types";

const APP_URL = "https://strings-ignored-smooth-review.trycloudflare.com";

type Status = "idle" | "success" | "error" | "loading";

/**
 * Entry point for the `ShouldRender` Extension Point.
 *
 * Returns a value indicating whether or not to render a PostPurchase step, and
 * optionally allows data to be stored on the client for use in the `Render`
 * extension point.
 */
extend("Checkout::PostPurchase::ShouldRender", async ({ storage }) => {
  // For local development, always show the post-purchase page
  return { render: true };
});

/**
 * Entry point for the `Render` Extension Point
 *
 * Returns markup composed of remote UI components.  The Render extension can
 * optionally make use of data stored during `ShouldRender` extension point to
 * expedite time-to-first-meaningful-paint.
 */
render("Checkout::PostPurchase::Render", () => <App />);

// Top-level React component
export function App() {
  const { inputData } = useExtensionInput();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [rating, setRating] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<{
    product: GetProductByIdQuery["product"];
    metafield: Maybe<Pick<Metafield, "id" | "key" | "namespace" | "value">>;
  } | null>(null);
  const [productFetchStatus, setProductFetchStatus] =
    useState<Status>("loading");
  const [reviewSubmitStatus, setReviewSubmitStatus] = useState<Status>("idle");

  const primaryProduct = inputData.initialPurchase.lineItems[0].product;

  const handleNameChange = useCallback((value) => setName(value), []);
  const handleNameBlur = useCallback(() => {
    if (!name) {
      setNameError("Please enter your name");
    } else {
      setNameError("");
    }
  }, [name]);
  const handleRatingChange = useCallback((value) => {
    if (!value) {
      setRatingError("Please select a rating");
    } else {
      setRatingError("");
    }
    setRating(value);
  }, []);
  const handleMessageChange = useCallback((value) => setMessage(value), []);
  const handleMessageBlur = useCallback(() => {
    if (!message) {
      setMessageError("Please enter a message");
    } else {
      setMessageError("");
    }
  }, [message]);

  const resetForm = useCallback(() => {
    setName("");
    setRating("");
    setMessage("");
    setNameError("");
    setRatingError("");
    setMessageError("");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!name || !rating || !message) return null;
    try {
      setReviewSubmitStatus("loading");
      const submitRequest = await fetch(`${APP_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${inputData.token}`,
        },
        body: JSON.stringify({
          productId: primaryProduct.id,
          name,
          rating,
          message,
        }),
      });
      await submitRequest.json();
      setReviewSubmitStatus("success");
      resetForm();
    } catch (error) {
      console.error("Error submitting review", error);
      setReviewSubmitStatus("error");
    }
  }, [inputData.token, message, name, primaryProduct.id, rating, resetForm]);

  useEffect(() => {
    (async () => {
      try {
        setProductFetchStatus("loading");
        const response = await fetch(`${APP_URL}/api/product`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${inputData.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: primaryProduct.id,
          }),
        });
        const data = await response.json();
        setSelectedProduct(data);
        setProductFetchStatus("success");
      } catch (error) {
        console.error("Error fetching product", error);
        setProductFetchStatus("error");
      }
    })();
  }, [inputData.token, primaryProduct.id]);

  const isSubmitDisabled = !name || !rating || !message;

  const product = selectedProduct?.product;

  console.log("selectedProduct", selectedProduct);

  if (productFetchStatus === "loading") {
    return (
      <BlockStack spacing="loose">
        <CalloutBanner title="Just a moment...">
          We'd love to hear your thoughts on the product you just purchased.
        </CalloutBanner>
        <Layout>
          <Spinner size="small" />
        </Layout>
      </BlockStack>
    );
  }

  if (productFetchStatus === "error") {
    return (
      <BlockStack spacing="loose">
        <Banner status="critical">
          <Text>
            There was an error fetching the product. Please try again later.
          </Text>
        </Banner>
      </BlockStack>
    );
  }

  return (
    <BlockStack spacing="loose">
      <CalloutBanner title="Leave some feedback">
        We’d love to hear your thoughts on the product you just purchased.
      </CalloutBanner>
      <Layout
        maxInlineSize={0.95}
        media={[
          { viewportSize: "small", sizes: [1, 30, 1] },
          { viewportSize: "medium", sizes: [300, 30, 0.5] },
          { viewportSize: "large", sizes: [400, 30, 0.33] },
        ]}
      >
        <View>
          <Image source={product?.featuredImage?.url} />
        </View>
        <View />
        <BlockStack spacing="xloose">
          <TextContainer>
            <Heading>{product?.title}</Heading>
          </TextContainer>
          {reviewSubmitStatus === "success" && (
            <Banner status="success">
              <Text>Thank you for your review!</Text>
            </Banner>
          )}
          <Form onSubmit={handleSubmit}>
            <FormLayout>
              <TextField
                value={name}
                onChange={handleNameChange}
                label="Name"
                type="text"
                name="name"
                required
                onBlur={handleNameBlur}
                error={nameError}
              />
              <Select
                label="Rating"
                options={[
                  {
                    label: "Select a rating",
                    value: "",
                  },
                  {
                    label: "1",
                    value: "1",
                  },
                  {
                    label: "2",
                    value: "2",
                  },
                  {
                    label: "3",
                    value: "3",
                  },
                  {
                    label: "4",
                    value: "4",
                  },
                  {
                    label: "5",
                    value: "5",
                  },
                ]}
                name="rating"
                onChange={handleRatingChange}
                error={ratingError}
                value={rating}
                required
              />
              <TextField
                value={message}
                onChange={handleMessageChange}
                label="Message"
                type="text"
                name="message"
                multiline
                required
                onBlur={handleMessageBlur}
                error={messageError}
              />
              <Button
                disabled={isSubmitDisabled}
                submit
                loading={reviewSubmitStatus === "loading"}
              >
                Submit
              </Button>
            </FormLayout>
          </Form>
        </BlockStack>
      </Layout>
    </BlockStack>
  );
}
