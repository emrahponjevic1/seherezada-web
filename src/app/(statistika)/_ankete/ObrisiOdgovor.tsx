"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { obrisiOdgovor } from "./panelAkcije";
import s from "@/app/(statistika)/_qr/Statistika.module.css";

/** Briše en izpolnjen obrazec, po potrditvi. Potem gre na `nakon`. */
export default function ObrisiOdgovor({
  slug,
  id,
  redniBroj,
  nakon,
  malo,
}: {
  slug: string;
  id: number;
  redniBroj: number;
  nakon: string;
  /** Manjši gumb za seznam. */
  malo?: boolean;
}) {
  const router = useRouter();
  const [radi, start] = useTransition();

  function obrisi() {
    if (!confirm(`Obrisati odgovor br. ${redniBroj}?\n\nSvi njegovi odgovori nestaju iz rezultata. Ovo se ne može vratiti.`)) return;
    start(async () => {
      const r = await obrisiOdgovor(slug, id);
      if (r.greska) {
        alert(r.greska);
        return;
      }
      router.push(nakon);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className={s.dugmeOpasno}
      onClick={obrisi}
      disabled={radi}
      style={malo ? { minHeight: 36, padding: "0.35rem 0.8rem", fontSize: "0.82rem" } : undefined}
    >
      {radi ? "Brišem…" : "Obriši"}
    </button>
  );
}
