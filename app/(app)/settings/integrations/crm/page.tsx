import { CrmConnectionForm } from "@/components/settings/crm-connection-form";
import { getCrmWebhookSecret } from "@/integrations/crm/settings/repo";

import { updateCrmConnection } from "./actions";

export default async function SettingsCrmIntegrationPage() {
  const secret = (await getCrmWebhookSecret()) ?? "";

  return (
    <CrmConnectionForm
      values={{ webhookSecret: secret }}
      action={updateCrmConnection}
    />
  );
}
