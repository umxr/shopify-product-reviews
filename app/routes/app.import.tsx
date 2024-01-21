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

import { useActionData, useSearchParams, useSubmit } from "@remix-run/react";
import type { ParsedProduct } from "~/actions/csv";
import { parseAndValidateCSV, parseProductResult } from "~/actions/csv";
import { RequestMethod } from "~/actions";

const TOPIC = {
  VALIDATE: "VALIDATE",
  IMPORT: "IMPORT",
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

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const valid = searchParams.get("valid") === "true";

  console.log("searchParams", searchParams);
  console.log("valid", valid);

  switch (request.method) {
    case RequestMethod.POST:
      const file = formData.get("csv") as File;

      if (!valid) {
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
          ...result,
          topic: TOPIC.VALIDATE,
          topic_status: RESULT.SUCCESS,
        });
      }

      return json({
        status: "success",
        topic: TOPIC.IMPORT,
        topic_status: RESULT.SUCCESS,
      });

    default:
      return new Response("Method not allowed", { status: 405 });
  }
};

export default function Import() {
  const submit = useSubmit();
  const actionData = useActionData<ActionData>() as
    | ActionDataError
    | ActionDataSuccess
    | undefined;
  const [searchParams, setSearchParams] = useSearchParams();
  const [file, setFile] = useState<File>();
  const [importPreviewProducts, setImportPreviewProducts] = useState<
    ParsedProduct[]
  >([]);

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
    shopify.toast.show("Uploading file...", {
      duration: 3000,
    });
  }, [file, submit]);

  const handleFileImport = useCallback(() => {
    const formData = new FormData();
    formData.append("csv", file as File);
    submit(formData, {
      method: "POST",
      encType: "multipart/form-data",
    });
    shopify.toast.show("Importing products...", {
      duration: 3000,
    });
  }, [file, submit]);

  const runFileImport = useCallback(() => {
    const isValid = searchParams.get("valid") === "true";
    isValid ? handleFileImport() : handleFileValidate();
  }, [handleFileImport, handleFileValidate, searchParams]);

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
      setImportPreviewProducts(actionData?.products);
      const params = new URLSearchParams();
      params.set("valid", "true");
      setSearchParams(params);
    }
  }, [
    actionData?.products,
    actionData?.status,
    actionData?.topic,
    actionData?.topic_status,
    setSearchParams,
  ]);

  const isCancelDisabled = !file;
  const isImportDisbled = !file;

  console.log(actionData);

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
                  onClick={runFileImport}
                >
                  Import
                </Button>
              </ButtonGroup>
            </div>
          </BlockStack>
        </Card>
        {importPreviewProducts.length > 0 && (
          <Banner title="Import Preview" tone="info">
            <DataTable
              columnContentTypes={["text", "text", "text", "text"]}
              headings={["Handle", "Name", "Message", "Rating"]}
              rows={importPreviewProducts.map((product) => [
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
