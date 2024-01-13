import { Badge, IndexTable, LegacyCard, Link, Text } from "@shopify/polaris";
import type { Tone } from "@shopify/polaris/build/ts/src/components/Badge/types";
import type { Product } from "~/types/product";

type ProductTableProps = {
  products: Product[];
};

const statusMap: Record<Product["status"], Tone> = {
  ACTIVE: "success",
  ARCHIVED: "new",
  DRAFT: "info",
};

export const ProductTable = ({ products }: ProductTableProps) => {
  const resourceName = {
    singular: "product",
    plural: "products",
  };

  const rowMarkup = products.map(({ id, title, status, handle }, index) => {
    const formattedStatus = status.charAt(0) + status.slice(1).toLowerCase();
    const url = `app/products/${handle}`;

    return (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <Link dataPrimaryLink url={url}>
            <Text fontWeight="bold" as="span">
              {title}
            </Text>
          </Link>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={statusMap[status]}>{formattedStatus}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>{1}</IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <LegacyCard>
      <IndexTable
        selectable={false}
        resourceName={resourceName}
        itemCount={products.length}
        headings={[
          { title: "Title" },
          {
            title: "Status",
          },
          { title: "Review Count" },
        ]}
        pagination={{
          hasNext: true,
        }}
      >
        {rowMarkup}
      </IndexTable>
    </LegacyCard>
  );
};
