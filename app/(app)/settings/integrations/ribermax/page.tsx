import { RibermaxBoxTemplateRatesForm } from "@/components/settings/ribermax-box-template-rates-form";
import { getOrCreateBoxTemplateRates } from "@/integrations/ribermax";

import { updateRibermaxBoxTemplateRates } from "./actions";

export default async function SettingsRibermaxIntegrationPage() {
  const rates = await getOrCreateBoxTemplateRates();

  return (
    <RibermaxBoxTemplateRatesForm
      values={rates}
      action={updateRibermaxBoxTemplateRates}
    />
  );
}
