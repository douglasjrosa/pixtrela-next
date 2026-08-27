import { RibermaxConnectionForm } from "@/components/settings/ribermax-connection-form";
import { getRibermaxConnection } from "@/integrations/ribermax";

import { updateRibermaxConnection } from "./actions";

export default async function SettingsRibermaxIntegrationPage() {
  const connection = (await getRibermaxConnection()) ?? {
    baseUrl: "",
    token: "",
  };

  return (
    <RibermaxConnectionForm
      values={connection}
      action={updateRibermaxConnection}
    />
  );
}
