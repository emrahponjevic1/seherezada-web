import { imaBazu } from "@/app/(statistika)/_qr/baza";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import { jedanKod, zadnjaSkeniranja } from "@/app/(statistika)/_qr/upiti";

// Izvoz vseh skeniranj enega koda za Excel. Podpičje in BOM, ker evropski
// Excel drugače vse zbaše v en stolpec in pokvari šumnike.

export const runtime = "nodejs";

const vrijemeFmt = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Ljubljana",
  dateStyle: "short",
  timeStyle: "medium",
});

function polje(v: unknown) {
  let t = v == null ? "" : String(v);
  // Celica, ki se začne z =, +, - ali @, bi jo Excel izvedel kot formulo.
  if (/^[=+\-@]/.test(t)) t = `'${t}`;
  return /[";\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await jePrijavljen())) return new Response("Nisi prijavljen.", { status: 401 });
  if (!imaBazu()) return new Response("Baza nije povezana.", { status: 503 });

  const id = Number((await params).id);
  const kod = Number.isInteger(id) ? await jedanKod(id) : null;
  if (!kod) return new Response("Kod ne postoji.", { status: 404 });

  const redovi = await zadnjaSkeniranja(id, null, true);
  const glava = ["vrijeme", "drzava", "regija", "grad", "uredjaj", "proizvodjac", "model", "os", "os_verzija", "preglednik", "jezik", "bot"];
  const linije = [
    glava.join(";"),
    ...redovi.map((r) =>
      [
        vrijemeFmt.format(r.vrijeme),
        r.drzava,
        r.regija,
        r.grad,
        r.uredjaj,
        r.proizvodjac,
        r.model,
        r.os,
        r.os_verzija,
        r.preglednik,
        r.jezik,
        r.bot ? "da" : "ne",
      ]
        .map(polje)
        .join(";")
    ),
  ];

  return new Response("﻿" + linije.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="qr-${kod.slug}-skeniranja.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
