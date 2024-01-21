import type { ActionFunctionArgs } from "@remix-run/node";
import {
  json,
  unstable_createFileUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import {
  BlockStack,
  Card,
  Page,
  Text,
  DropZone,
  InlineStack,
  Thumbnail,
  Button,
  ButtonGroup,
  Banner,
  DataTable,
} from "@shopify/polaris";
import { UndoMajor, NoteMinor, TickMinor } from "@shopify/polaris-icons";
import { useState, useCallback, useEffect } from "react";

import { useActionData, useSubmit } from "@remix-run/react";
import type { ParsedProduct } from "~/actions/csv";
import { parseAndValidateCSV, parseProductResult } from "~/actions/csv";

const TOPIC = {
  VALIDATE: "VALIDATE",
} as const;

const RESULT = {
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
} as const;

type ActionDataError = {
  status: "error";
  error: string;
  details: string[];
};

type ActionDataSuccess = {
  status: "success";
  products: ParsedProduct[]; // Assuming ParsedProduct is defined elsewhere
  topic: typeof TOPIC.VALIDATE;
  topic_status: typeof RESULT.SUCCESS;
};

type ActionData = ActionDataError | ActionDataSuccess;

export const action = async ({ request }: ActionFunctionArgs) => {
  const uploadHandler = unstable_createFileUploadHandler();
  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  const file = formData.get("csv") as File;

  if (file && file.type !== "text/csv") {
    return json({ error: "Invalid file type." }, { status: 400 });
  }

  const result = await parseAndValidateCSV(file);
  if (result.status === "error") {
    return json({
      ...result,
      topic: TOPIC.VALIDATE,
      topic_status: RESULT.ERROR,
    });
  }
  return json({
    products: parseProductResult(result.products),
    topic: TOPIC.VALIDATE,
    topic_status: RESULT.SUCCESS,
  });
};

export default function Import() {
  const submit = useSubmit();
  const actionData = useActionData<ActionData>() as
    | ActionDataError
    | ActionDataSuccess
    | undefined;
  const [file, setFile] = useState<File>();
  const [isImportValid, setImportValid] = useState(false);

  const handleDropZoneDrop = useCallback(
    (_dropFiles: File[], acceptedFiles: File[], _rejectedFiles: File[]) => {
      const file = acceptedFiles[0];

      if (file && file.type === "text/csv") {
        setFile(file);
      } else {
        shopify.toast.show("Only CSV files are allowed.", {
          isError: true,
        });
      }
    },
    []
  );

  const handleFileValidate = useCallback(() => {
    const formData = new FormData();
    formData.append("csv", file as File);
    submit(formData, {
      method: "POST",
      encType: "multipart/form-data",
    });
    shopify.toast.show("Uploading file...");
  }, [file, submit]);

  const handleFileImport = useCallback(() => {
    !isImportValid ? handleFileValidate() : console.log("importing");
  }, [handleFileValidate, isImportValid]);

  const onFileClear = useCallback(() => {
    setFile(undefined);
  }, []);

  const fileUpload = !file && <DropZone.FileUpload actionHint="Accepts .csv" />;

  const uploadedFiles = file && (
    <BlockStack gap="400">
      <InlineStack>
        <Thumbnail size="small" alt={file.name} source={NoteMinor} />
        <div>
          {file.name}{" "}
          <Text variant="bodySm" as="p">
            {file.size} bytes
          </Text>
        </div>
      </InlineStack>
    </BlockStack>
  );

  useEffect(() => {
    if (
      actionData?.status === "success" &&
      actionData?.topic === TOPIC.VALIDATE &&
      actionData?.topic_status === RESULT.SUCCESS
    ) {
      setImportValid(true);
      console.log("passed validation");
      console.log(actionData?.products);
    }
  }, [
    actionData?.products,
    actionData?.status,
    actionData?.topic,
    actionData?.topic_status,
  ]);

  const isCancelDisabled = !file;
  const isImportDisbled = !file;

  console.log("actionData", actionData);

  return (
    <Page
      backAction={{
        content: "Home",
        url: "/app",
      }}
      title="Import Reviews"
    >
      <BlockStack gap="400">
        {actionData?.status === "error" &&
          actionData?.details?.length === 1 && (
            <Banner title={actionData.error} tone="critical">
              <p>{actionData?.details[0]}</p>
            </Banner>
          )}
        {actionData?.status === "error" && actionData?.details?.length > 1 && (
          <Banner title={actionData.error} tone="critical">
            <DataTable
              columnContentTypes={["text"]}
              headings={["Error"]}
              rows={actionData.details.map((detail) => [detail])}
            />
          </Banner>
        )}
        <Card roundedAbove="sm">
          <BlockStack gap="400">
            <DropZone onDrop={handleDropZoneDrop} variableHeight>
              {uploadedFiles}
              {fileUpload}
            </DropZone>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <ButtonGroup>
                <Button
                  icon={UndoMajor}
                  disabled={isCancelDisabled}
                  onClick={onFileClear}
                >
                  Clear
                </Button>
                <Button
                  icon={TickMinor}
                  variant="primary"
                  disabled={isImportDisbled}
                  onClick={handleFileImport}
                >
                  Import
                </Button>
              </ButtonGroup>
            </div>
          </BlockStack>
        </Card>
        {actionData?.status === "success" &&
          actionData?.topic === TOPIC.VALIDATE &&
          actionData?.topic_status === RESULT.SUCCESS && (
            <Banner title="Import Preview" tone="info">
              <DataTable
                columnContentTypes={["text", "text", "text", "text"]}
                headings={["Handle", "Name", "Message", "Rating"]}
                rows={actionData?.products
                  .slice(0, 3)
                  .map((product) => [
                    product.handle,
                    product.name,
                    product.message,
                    product.rating,
                  ])}
              />
            </Banner>
          )}
      </BlockStack>
    </Page>
  );
}
