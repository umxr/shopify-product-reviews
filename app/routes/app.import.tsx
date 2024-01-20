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
} from "@shopify/polaris";
import { UndoMajor, NoteMinor, TickMinor } from "@shopify/polaris-icons";
import { useState, useCallback } from "react";

import { useActionData, useSubmit } from "@remix-run/react";
import { parseAndValidateCSV } from "~/actions/csv";

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
  return json(result);
};

export default function Import() {
  const submit = useSubmit();
  const actionData = useActionData();
  const [file, setFile] = useState<File>();

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

  const onFileValidate = useCallback(() => {
    const formData = new FormData();
    formData.append("csv", file as File);
    submit(formData, {
      method: "POST",
      encType: "multipart/form-data",
    });
    shopify.toast.show("Uploading file...");
  }, [file, submit]);

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
                <Button onClick={onFileValidate}>Validate</Button>
                <Button
                  icon={TickMinor}
                  variant="primary"
                  disabled={isImportDisbled}
                >
                  Import
                </Button>
              </ButtonGroup>
            </div>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
