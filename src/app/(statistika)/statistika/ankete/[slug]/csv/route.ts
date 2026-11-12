import { imaBazu } from "@/app/(statistika)/_qr/baza";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import { anketaPoSlugu, svaPitanja } from "@/app/(statistika)/_ankete/registar";
import { pripraviAnketeTabele } from "@/app/(statistika)/_ankete/shema";
import { odgovoriAnkete } from "@/app/(statistika)/_ankete/upiti";

// Izvoz vseh odgovorov ene ankete za Excel: vrstica = en izpolnjen obrazec,
// stolpec = eno vprašanje. Pri izbiri je napisan bosanski odgovor, ne ID.
// Podpičje in BOM, ker evropski Excel drugače vse zbaše v en stolpec.

export const runtime = "nodejs";

const datumFmt = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Ljubljana", dateStyle: "short" });

function polje(v: unknown) {
  let t = v == null ? "" : String(v);
  // Celica, ki se začne z =, +, - ali @, bi jo Excel izvedel kot formulo.
  if (/^[=+\-@]/.test(t)) t = `'${t}`;
  return /[";\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await jePrijavljen())) return new Response("Nisi prijavljen.", { status: 401 });
  if (!imaBazu()) return new Response("Baza nije povezana.", { status: 503 });

  const anketa = anketaPoSlugu((await params).slug);
  if (!anketa) return new Response("Anketa ne postoji.", { status: 404 });

  await pripraviAnketeTabele();
  const redovi = await odgovoriAnkete(anketa.slug);
  const pitanja = svaPitanja(anketa);

  const glava = ["datum", "jezik", "verzija", ...pitanja.map((p) => p.pitanje.bs)];
  const linije = [
    glava.map(polje).join(";"),
    ...redovi.map((x) =>
      [
        datumFmt.format(x.datum),
        x.jezik,
        x.verzija,
        ...pitanja.map((p) => {
          const v = x.odgovori[p.id];
          if (p.vrsta === "izbor") return p.opcije.find((o) => o.id === v)?.tekst.bs ?? "";
          return v ?? "";
        }),
      ]
        .map(polje)
        .join(";")
    ),
  ];

  return new Response("﻿" + linije.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="anketa-${anketa.slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
