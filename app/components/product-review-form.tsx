import {
  BlockStack,
  Button,
  ButtonGroup,
  Select,
  TextField,
} from "@shopify/polaris";
import { useCallback, useState } from "react";
import { generateUUID } from "~/utils/generate-uuid";

export type ProductReview = {
  id: string;
  name: string;
  rating: number;
  message: string;
};

type ProductReviewFormProps = {
  onSubmit: (review: ProductReview) => void;
  state: "idle" | "loading" | "submitting";
};

export const ProductReviewForm = ({
  onSubmit,
  state,
}: ProductReviewFormProps) => {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [review, setReview] = useState("5");

  const onNameChange = useCallback((value: string) => {
    setName(value);
  }, []);

  const onMessageChange = useCallback((value: string) => {
    setMessage(value);
  }, []);

  const onReviewChange = useCallback((value: string) => {
    setReview(value);
  }, []);

  const onCancel = useCallback(() => {
    setName("");
    setMessage("");
    setReview("5");
  }, []);

  const onSave = useCallback(() => {
    const data = {
      name,
      message,
      rating: Number(review),
      id: generateUUID(),
    };
    onSubmit(data);
  }, [message, name, onSubmit, review]);

  const ratingOptions = [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "4", value: "4" },
    { label: "5", value: "5" },
  ];

  const isCancelDisabled = !name && !message;
  const isSaveDisabled = !name || !message;

  return (
    <BlockStack gap="300">
      <TextField
        label="Name"
        value={name}
        onChange={onNameChange}
        autoComplete="off"
      />
      <TextField
        label="Message"
        value={message}
        onChange={onMessageChange}
        autoComplete="off"
        multiline={4}
      />
      <Select
        label="Rating"
        options={ratingOptions}
        onChange={onReviewChange}
        value={review}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <ButtonGroup>
          <Button onClick={onCancel} disabled={isCancelDisabled}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={isSaveDisabled}
            onClick={onSave}
            loading={state === "submitting"}
          >
            Save
          </Button>
        </ButtonGroup>
      </div>
    </BlockStack>
  );
};
