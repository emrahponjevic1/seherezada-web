"use client";

import { useEffect, useRef } from "react";
import type { QrStil } from "@/app/(statistika)/_qr/stil";
import { stilZaCrtanje } from "./logo";
import { opcijeQr } from "./opcije";
import s from "@/app/(statistika)/_qr/Statistika.module.css";

/** Majhen predogled koda v seznamu. Knjižnica se naloži šele v brskalniku. */
export default function QrSlicica({
  podaci,
  stil,
  velicina = 64,
}: {
  podaci: string;
  stil: QrStil;
  velicina?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const kljuc = JSON.stringify(stil);

  useEffect(() => {
    let ziv = true;
    (async () => {
      const [{ default: QRCodeStyling }, stil] = await Promise.all([
        import("qr-code-styling"),
        stilZaCrtanje(JSON.parse(kljuc)),
      ]);
      if (!ziv || !ref.current) return;
      ref.current.replaceChildren();
      new QRCodeStyling(opcijeQr(stil, podaci, velicina, "svg")).append(ref.current);
    })();
    return () => {
      ziv = false;
    };
  }, [kljuc, podaci, velicina]);

  return <div ref={ref} className={s.slicica} style={{ width: velicina, height: velicina }} aria-hidden="true" />;
}
