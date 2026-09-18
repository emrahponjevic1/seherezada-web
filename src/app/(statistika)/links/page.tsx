import { redirect } from "next/navigation";
import { SITE_URL } from "@/data/site";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import { pripraviQrTabele } from "@/app/(statistika)/_qr/shema";
import { glavnaStranica } from "@/app/(statistika)/_linkovi/upiti";

// ---------------------------------------------------------------------------
// GOLI /links
//
// Nalepka ima natisnjen naslov s slugom, tu pa pristane, kdor naslov natipka
// na pamet. Pošljemo ga na stran, ki je označena kot glavna; če take ni, na
// naslovnico — nikoli na napako.
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

export default async function GlavnaStranicaSaLinkovima() {
  try {
    if (imaBazu()) {
      await pripraviQrTabele();
      const glavna = await glavnaStranica();
      if (glavna) redirect(`/links/${glavna.slug}`);
    }
  } catch (e) {
    // redirect() javi svojo napako, ki je ne smemo pogoltniti.
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    console.error("LINKTREE: glavne strani ni bilo mogoče prebrati", e);
  }
  redirect(SITE_URL);
}
