import { redirect } from "next/navigation";

export default async function WorkspaceIndex({ params }: PageProps<"/w/[workspace]">) {
  const { workspace } = await params;
  redirect(`/w/${workspace}/overview`);
}
