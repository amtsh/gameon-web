import type { Metadata } from "next";
import {
  buildSharedGameMetadata,
  SharedGamePage,
} from "@/lib/shared-game/shared-game-page";

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  return buildSharedGameMetadata(token);
}

export default async function CanonicalSharedGamePage({ params }: Props) {
  const { token } = await params;
  return <SharedGamePage slug={token} />;
}
