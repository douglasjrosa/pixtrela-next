import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ documentId: string }>;
}

/** Subtasks now live on the template form at /templates. */
export default async function LegacyTemplateSubtasksPage(_props: PageProps) {
  redirect("/templates");
}
