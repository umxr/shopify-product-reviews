import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { PageLayout } from "~/components/page-layout";
import db from "../db.server";
import { UserTable } from "~/components/users-table";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Page } from "@shopify/polaris";
import { useCallback } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const dbUsers = await db.user.findMany();
  const users = dbUsers.map((user) => {
    return {
      ...user,
      id: user.id.toString(),
    };
  });

  return json({
    session,
    users,
  });
};

export default function Index() {
  const { users } = useLoaderData<typeof loader>();

  const navigate = useNavigate();

  const onAction = useCallback(() => {
    navigate("/app/users/new");
  }, [navigate]);

  return (
    <Page
      title="Users"
      primaryAction={{
        content: "Create new user",
        onAction,
      }}
    >
      <UserTable users={users} />
    </Page>
  );
}
