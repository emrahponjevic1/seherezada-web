"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { obrisiKod } from "@/app/(statistika)/_qr/akcije";
import s from "@/app/(statistika)/_qr/Statistika.module.css";

export default function ObrisiKod({ id, naziv, skeniranja }: { id: number; naziv: string; skeniranja: number }) {
  const router = useRouter();
  const [radi, start] = useTransition();

  function obrisi() {
    const upit =
      `Obrisati „${naziv}“` +
      (skeniranja > 0 ? ` i svih ${skeniranja} zabilježenih skeniranja` : "") +
      "?\n\nOvo se ne može vratiti. Odštampani kodovi s kratkim linkom će voditi na naslovnicu.";
    if (!confirm(upit)) return;
    start(async () => {
      const r = await obrisiKod(id);
      if (r.greska) {
        alert(r.greska);
        return;
      }
      router.push("/statistika/kodovi");
      router.refresh();
    });
  }

  return (
    <button type="button" className={s.dugmeOpasno} onClick={obrisi} disabled={radi}>
      {radi ? "Brišem…" : "Obriši kod"}
    </button>
  );
}
