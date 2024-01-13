import type { User } from "@prisma/client";
import { useNavigate } from "@remix-run/react";
import {
  EmptyState,
  LegacyCard,
  IndexTable,
  Link,
  Text,
  useBreakpoints,
} from "@shopify/polaris";
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
  return (
    <LegacyCard>
      <IndexTable
        condensed={useBreakpoints().smDown}
        resourceName={{
          singular: "user",
          plural: "users",
        }}
        selectable={false}
        itemCount={users.length}
        headings={[{ title: "Name" }, { title: "Email" }]}
      >
        {users.map(({ id, email, name }, index) => {
          const url = `/app/users/${id}`;
          return (
            <IndexTable.Row id={id} key={id} position={index}>
              <IndexTable.Cell>
                <Link dataPrimaryLink url={url}>
                  <Text fontWeight="bold" as="span">
                    {name}
                  </Text>
                </Link>
              </IndexTable.Cell>
              <IndexTable.Cell>{email}</IndexTable.Cell>
            </IndexTable.Row>
          );
        })}
      </IndexTable>
    </LegacyCard>
  );
};
