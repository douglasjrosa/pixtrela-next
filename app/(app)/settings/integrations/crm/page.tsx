import { CrmConnectionForm } from "@/components/settings/crm-connection-form";
import { getCrmConnection } from "@/integrations/crm/settings/repo";

import { testCrmConnection, updateCrmConnection } from "./actions";

export default async function SettingsCrmIntegrationPage() {
  const connection = await getCrmConnection();
  const values = {
    baseUrl: connection?.baseUrl ?? "",
    webhookSecret: connection?.webhookSecret ?? "",
  };

  return (
    <CrmConnectionForm
      values={values}
      hasSavedConnection={connection !== null}
      saveAction={updateCrmConnection}
      testAction={testCrmConnection}
    />
  );
}
