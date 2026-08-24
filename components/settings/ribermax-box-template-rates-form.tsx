import { getTranslations } from "next-intl/server";

import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAX_BOX_TEMPLATE_RATE_SECONDS,
  MIN_BOX_TEMPLATE_RATE_SECONDS,
} from "@/integrations/ribermax/settings/schema";
import type { RibermaxBoxTemplateRates } from "@/integrations/ribermax/settings/schema";

export async function RibermaxBoxTemplateRatesForm({
  values,
  action,
}: {
  values: RibermaxBoxTemplateRates;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const tCommon = await getTranslations("common");
  const t = await getTranslations("settings.ribermax");
  const formKey = [
    values.cutSeconds,
    values.adhesiveSeconds,
    values.fastenerSeconds,
  ].join(":");

  return (
    <form key={formKey} action={action} className="max-w-md space-y-4">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">{t("ratesHelp")}</p>

      <div className="space-y-2">
        <Label htmlFor="cutSeconds">{t("cutSeconds")}</Label>
        <Input
          id="cutSeconds"
          name="cutSeconds"
          type="number"
          min={MIN_BOX_TEMPLATE_RATE_SECONDS}
          max={MAX_BOX_TEMPLATE_RATE_SECONDS}
          step={1}
          defaultValue={values.cutSeconds}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="adhesiveSeconds">{t("adhesiveSeconds")}</Label>
        <Input
          id="adhesiveSeconds"
          name="adhesiveSeconds"
          type="number"
          min={MIN_BOX_TEMPLATE_RATE_SECONDS}
          max={MAX_BOX_TEMPLATE_RATE_SECONDS}
          step={1}
          defaultValue={values.adhesiveSeconds}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fastenerSeconds">{t("fastenerSeconds")}</Label>
        <Input
          id="fastenerSeconds"
          name="fastenerSeconds"
          type="number"
          min={MIN_BOX_TEMPLATE_RATE_SECONDS}
          max={MAX_BOX_TEMPLATE_RATE_SECONDS}
          step={1}
          defaultValue={values.fastenerSeconds}
          required
        />
      </div>

      <FormSubmitButton label={tCommon("save")} />
    </form>
  );
}
