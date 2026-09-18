"use client";

import { useEffect, useState } from "react";
import { openState, type OpenState } from "@/lib/hours";
import type { LocaleCode } from "@/data/site";
import { ZNACKA, sUro } from "./znacka";
import s from "./Stranica.module.css";

/**
 * ZNAČKA ODPRTO / ZAPRTO
 *
 * Stanje se izračuna v brskalniku gosta, ne na strežniku: stran je lahko
 * predpomnjena, izračun s strežnika pa bi čez nekaj minut lagal. Do izračuna
 * je značka nevidna, a zavzame prostor — postavitev ne poskoči.
 *
 * Ista logika kot na spletišču (src/lib/hours.ts), samo besedila so tu, ker
 * ta stran ne teče skozi next-intl.
 */
export default function ZnackaUzivo({
  hours,
  jezik,
}: {
  hours: { day: string; time: string }[];
  jezik: LocaleCode;
}) {
  const [stanje, setStanje] = useState<OpenState | null>(null);
  const t = ZNACKA[jezik] ?? ZNACKA.sl;

  useEffect(() => {
    const osvjezi = () => setStanje(openState(hours));
    osvjezi();
    const ura = setInterval(osvjezi, 60_000);
    return () => clearInterval(ura);
  }, [hours]);

  if (!stanje) {
    return (
      <span className={`${s.znacka} ${s.znackaPrazna}`} aria-hidden="true">
        <span className={s.tackaZiva}>
          <span className={s.tacka} />
        </span>
        {t.odprto}
      </span>
    );
  }

  if (stanje.open) {
    return (
      <span className={s.znacka} aria-live="polite">
        <span className={s.tackaZiva}>
          <span className={s.puls} />
          <span className={s.tacka} />
        </span>
        <span>
          <b>{t.odprto}</b>
          {stanje.closesAt && <span className={s.znackaDodatak}> · {sUro(t.doUre, stanje.closesAt)}</span>}
        </span>
      </span>
    );
  }

  return (
    <span className={`${s.znacka} ${s.znackaZatvoreno}`} aria-live="polite">
      <span className={s.tackaZiva}>
        <span className={s.tacka} />
      </span>
      <span>
        <b>{t.zaprto}</b>
        {stanje.opensAt && <span className={s.znackaDodatak}> · {sUro(t.odUre, stanje.opensAt)}</span>}
      </span>
    </span>
  );
}
