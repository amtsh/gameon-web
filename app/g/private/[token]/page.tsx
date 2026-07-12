import { redirect } from "next/navigation";
import { buildRedirectPath } from "@/lib/shared-game/build-redirect-path";
import { sportEventSharePath } from "@/lib/share-token";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Private invite alias — redirects to the canonical /g/{token} URL. */
export default async function PrivateSharedGameAliasPage({
  params,
  searchParams,
}: Props) {
  const { token } = await params;
  const query = await searchParams;
  redirect(buildRedirectPath(sportEventSharePath(token), query));
}
