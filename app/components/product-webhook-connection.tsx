import { AccountConnection } from "@shopify/polaris";

type ProductWebhookConnectionProps = {
  enabled: boolean;
  onAction: () => void;
};

export const ProductWebhookConnection = ({
  enabled,
  onAction,
}: ProductWebhookConnectionProps) => {
  const accountName = "Webhook";
  const buttonText = enabled ? "Disable" : "Enable";
  const details = enabled ? "Connected" : "Disconnected";
  const terms = enabled ? null : (
    <p>
      By clicking <strong>Enable</strong>, you allow us to sync your products to
      our app.
    </p>
  );

  return (
    <AccountConnection
      accountName={accountName}
      connected={enabled}
      title="product/update webhook"
      action={{
        content: buttonText,
        onAction,
      }}
      details={details}
      termsOfService={terms}
    />
  );
};
