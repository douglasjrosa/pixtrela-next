import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ documentId: string }>;
}

export default async function LegacyTemplateDetailRedirect({
  params,
}: PageProps) {
  const { documentId } = await params;
  redirect(`/templates/tasks/${documentId}`);
}
