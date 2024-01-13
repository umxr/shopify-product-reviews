import { Page } from "@shopify/polaris";
import type { ReactNode } from "react";
import { PageTitle } from "./page-title";

type PageLayoutProps = {
  children: ReactNode;
  title?: string;
};

export const PageLayout = ({ children, title }: PageLayoutProps) => {
  if (!title) {
    return <Page>{children}</Page>;
  }

  return (
    <Page>
      <PageTitle title={title} />
      {children}
    </Page>
  );
};
