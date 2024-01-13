import type { ActionFunctionArgs } from "@remix-run/node";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import {
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useSubmit,
} from "@remix-run/react";
import invariant from "tiny-invariant";
import {
  Bleed,
  BlockStack,
  Box,
  Card,
  Divider,
  InlineGrid,
  Text,
  Page,
  TextField,
} from "@shopify/polaris";
import { useState } from "react";
import { validateUser } from "~/modles/user.server";
import { DeleteMinor } from "@shopify/polaris-icons";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  invariant(params.id, "No user id provided");

  if (params.id === "new") {
    return json({
      user: {
        name: "",
        email: "",
      },
    });
  }

  const user = await db.user.findFirst({
    where: { id: Number(params.id) },
  });

  invariant(user, "No user found");

  return json({
    ...user,
    id: user.id.toString(),
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const data = {
    ...Object.fromEntries(await request.formData()),
    shop,
  };

  if (data.action === "delete") {
    await db.user.delete({ where: { id: Number(params.id) } });
    return redirect("/app/users");
  }

  const errors = validateUser(data);

  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const qrCode =
    params.id === "new"
      ? await db.user.create({ data })
      : await db.user.update({ where: { id: Number(params.id) }, data });

  return redirect(`/app/users/${qrCode.id}`);
};

export default function User() {
  const errors = useActionData()?.errors || {};
  const nav = useNavigate();
  const submit = useSubmit();
  const user = useLoaderData<typeof loader>();
  const [formState, setFormState] = useState(user);
  const [cleanFormState, setCleanFormState] = useState(user);

  function handleSave() {
    const data = {
      name: formState.name,
      email: formState.email,
    };

    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }

  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  return (
    <Page
      backAction={{ content: "users", url: "/app/users" }}
      title={user?.id ? `Edit ${user.name}` : "Create new user"}
      primaryAction={{
        content: "Save",
        loading: isSaving,
        disabled: !isDirty || isSaving || isDeleting,
        onAction: handleSave,
      }}
      secondaryActions={[
        // {
        //   content: "Duplicate",
        //   icon: DuplicateMinor,
        //   accessibilityLabel: "Secondary action label",
        //   onAction: () => alert("Duplicate action"),
        // },
        // {
        //   content: "Archive",
        //   icon: ArchiveMinor,
        //   accessibilityLabel: "Secondary action label",
        //   onAction: () => alert("Archive action"),
        // },
        {
          content: "Delete",
          loading: isDeleting,
          disabled: !user.id || !user || isSaving || isDeleting,
          icon: DeleteMinor,
          destructive: true,
          outline: true,
          accessibilityLabel: "Delete user",
          onAction: () => {
            submit({ action: "delete" }, { method: "post" });
          },
        },
      ]}
    >
      <InlineGrid columns={{ xs: 1, md: "2fr 1fr" }} gap="400">
        <BlockStack gap="400">
          <Card roundedAbove="sm">
            <BlockStack gap="400">
              <TextField
                id="name"
                label="Name"
                autoComplete="off"
                value={formState.name}
                onChange={(name) => setFormState({ ...formState, name })}
                error={errors.name}
              />
              <TextField
                id="email"
                label="Email"
                autoComplete="off"
                value={formState.email}
                onChange={(email) => setFormState({ ...formState, email })}
                error={errors.email}
              />
            </BlockStack>
          </Card>
        </BlockStack>
        <BlockStack gap={{ xs: "400", md: "200" }}>
          <Card roundedAbove="sm">
            <BlockStack gap="400">
              <Text Text variant="headingLg" as="p">
                Recent Reviews
              </Text>
              <Box>
                <Bleed marginInline={{ xs: 400, sm: 500 }}>
                  <Divider />
                </Bleed>
              </Box>
              <Text as="p">User has not left any reviews yet. </Text>
            </BlockStack>
          </Card>
        </BlockStack>
      </InlineGrid>
    </Page>
  );

  //   <Page>
  //     <ui-title-bar title={user?.id ? "Edit User" : "Create new user"}>
  //       <button variant="breadcrumb" onClick={() => navigate("/app")}>
  //         Users
  //       </button>
  //     </ui-title-bar>
  //     <Layout>
  //       <Layout.Section>
  //         <BlockStack gap="500">
  //           {/* [START title] */}
  //           <Card>
  //             <BlockStack gap="500">
  //               <TextField
  //                 id="name"
  //                 label="Name"
  //                 autoComplete="off"
  //                 value={formState.name}
  //                 onChange={(name) => setFormState({ ...formState, name })}
  //                 error={errors.name}
  //               />
  //               <TextField
  //                 id="email"
  //                 label="Email"
  //                 autoComplete="off"
  //                 value={formState.email}
  //                 onChange={(email) => setFormState({ ...formState, email })}
  //                 error={errors.email}
  //               />
  //             </BlockStack>
  //           </Card>
  //         </BlockStack>
  //       </Layout.Section>
  //       <Layout.Section>
  //         <PageActions
  //           secondaryActions={[
  //             {
  //               content: "Delete",
  //               loading: isDeleting,
  //               disabled: !user.id || !user || isSaving || isDeleting,
  //               destructive: true,
  //               outline: true,
  //               onAction: () =>
  //                 submit({ action: "delete" }, { method: "post" }),
  //             },
  //           ]}

  //         />
  //       </Layout.Section>
  //     </Layout>
  //   </Page>
  // );
}
