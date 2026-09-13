"use client";

import { useState } from "react";
import p from "./Stranice.module.css";

/** Kopira kratko povezavo. Na http (lokalno) clipboard API ne obstaja, zato rezerva. */
export default function KopirajDugme({ tekst }: { tekst: string }) {
  const [kopirano, setKopirano] = useState(false);

  async function kopiraj() {
    try {
      await navigator.clipboard.writeText(tekst);
    } catch {
      const polje = document.createElement("textarea");
      polje.value = tekst;
      document.body.append(polje);
      polje.select();
      document.execCommand("copy");
      polje.remove();
    }
    setKopirano(true);
    setTimeout(() => setKopirano(false), 2000);
  }

  return (
    <button type="button" className={`${p.kopiraj} ${kopirano ? p.kopirano : ""}`} onClick={kopiraj} aria-live="polite">
      {kopirano ? "Kopirano ✓" : "Kopiraj"}
    </button>
  );
}
