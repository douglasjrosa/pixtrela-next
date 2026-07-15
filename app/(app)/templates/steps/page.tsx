import { redirect } from "next/navigation";

export default function LegacyTemplatesStepsRedirect() {
  redirect("/settings/steps");
}
