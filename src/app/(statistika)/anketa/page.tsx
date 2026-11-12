import AnketaStranica from "@/app/(statistika)/_ankete/AnketaStranica";
import { AKTUELNA } from "@/app/(statistika)/_ankete/registar";

// seherezada.net/anketa — odpre anketo, ki je v registar.ts zapisana kot AKTUELNA.

export const dynamic = "force-dynamic";

export default async function AktuelnaAnketaPage({
  searchParams,
}: {
  searchParams: Promise<{ jezik?: string }>;
}) {
  const { jezik } = await searchParams;
  return <AnketaStranica slug={AKTUELNA} jezik={jezik} osnova="/anketa" />;
}
