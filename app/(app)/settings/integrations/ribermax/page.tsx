import { RibermaxConnectionForm } from "@/components/settings/ribermax-connection-form";
import { getRibermaxConnection } from "@/integrations/ribermax";

import {
  testRibermaxConnection,
  updateRibermaxConnection,
} from "./actions";

export default async function SettingsRibermaxIntegrationPage() {
  const connection = await getRibermaxConnection();
  const values = connection ?? { baseUrl: "", token: "" };

  return (
    <RibermaxConnectionForm
      values={values}
      hasSavedConnection={connection !== null}
      saveAction={updateRibermaxConnection}
      testAction={testRibermaxConnection}
    />
  );
}
