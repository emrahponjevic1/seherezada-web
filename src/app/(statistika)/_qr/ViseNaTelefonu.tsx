"use client";

import { useState } from "react";
import s from "./Statistika.module.css";
import p from "./Stranice.module.css";

/**
 * Na računalniku vsebina vedno vidna. Na telefonu skrita za enim gumbom,
 * da stran ostane kratka in pregledna (glej .vise v Stranice.module.css).
 */
export default function ViseNaTelefonu({ oznaka, children }: { oznaka: string; children: React.ReactNode }) {
  const [otvoreno, setOtvoreno] = useState(false);

  return (
    <div className={p.vise} data-otvoreno={otvoreno ? "da" : undefined}>
      <button
        type="button"
        className={`${s.dugmeSporedno} ${p.viseDugme}`}
        onClick={() => setOtvoreno((o) => !o)}
        aria-expanded={otvoreno}
      >
        {otvoreno ? "Prikaži manje" : oznaka}
      </button>
      <div className={p.viseSadrzaj}>{children}</div>
    </div>
  );
}
