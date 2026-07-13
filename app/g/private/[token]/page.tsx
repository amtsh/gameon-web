import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildRedirectPath } from "@/lib/shared-game/build-redirect-path";
import { buildPrivateSharedGameMetadata } from "@/lib/shared-game/resolve-event";
import { sportEventSharePath } from "@/lib/share-token";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  return buildPrivateSharedGameMetadata(token);
}

/** Private invite alias — redirects to the canonical /g/{token} URL. */
export default async function PrivateSharedGameAliasPage({
  params,
  searchParams,
}: Props) {
  const { token } = await params;
  const query = await searchParams;
  redirect(buildRedirectPath(sportEventSharePath(token), query));
}
