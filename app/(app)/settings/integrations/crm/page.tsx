import { CrmConnectionForm } from "@/components/settings/crm-connection-form";
import { getCrmWebhookSecret } from "@/integrations/crm/settings/repo";

import { testCrmConnection, updateCrmConnection } from "./actions";

export default async function SettingsCrmIntegrationPage() {
  const secret = await getCrmWebhookSecret();
  const values = { webhookSecret: secret ?? "" };

  return (
    <CrmConnectionForm
      values={values}
      hasSavedConnection={secret !== null}
      saveAction={updateCrmConnection}
      testAction={testCrmConnection}
    />
  );
}
