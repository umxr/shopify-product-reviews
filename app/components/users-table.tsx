import type { User } from "@prisma/client";
import { useNavigate } from "@remix-run/react";
import { EmptyState, LegacyCard } from "@shopify/polaris";
import { useCallback } from "react";

type UserTableProps = {
  users: User[];
};

export const UserTable = ({ users }: UserTableProps) => {
  const navigate = useNavigate();

  const onAction = useCallback(() => {
    navigate("/app/users/new");
  }, [navigate]);

  if (users.length === 0) {
    return (
      <LegacyCard sectioned>
        <EmptyState
          heading="Manage your users"
          action={{ content: "Add user", onAction }}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Add users to your store</p>
        </EmptyState>
      </LegacyCard>
    );
  }
  return <div>Hello</div>;
};
