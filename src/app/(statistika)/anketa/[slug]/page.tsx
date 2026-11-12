import AnketaStranica from "@/app/(statistika)/_ankete/AnketaStranica";

// seherezada.net/anketa/<slug> — bilo katera anketa iz registar.ts.

export const dynamic = "force-dynamic";

export default async function AnketaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ jezik?: string }>;
}) {
  const [{ slug }, { jezik }] = await Promise.all([params, searchParams]);
  return <AnketaStranica slug={slug} jezik={jezik} osnova={`/anketa/${slug}`} />;
}
