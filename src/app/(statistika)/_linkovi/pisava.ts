import { Caveat } from "next/font/google";

// ---------------------------------------------------------------------------
// ROKOPISNA PISAVA ZA SLOGAN — IZJEMA, POTRJENA OD LASTNIKA
//
// CLAUDE.md sicer dovoljuje samo Plus Jakarta Sans. Za en sam napis — slogan
// v podnožju strani s povezavami — je lastnik izrecno odobril izjemo, ker jo
// ima tako tudi predloga, po kateri je stran narejena.
//
// Ena sama definicija, uporabljena na dveh mestih:
//   links/layout.tsx  — stran za gosta
//   Urednik.tsx       — predogled v nadzorni plošči, SAMO okoli telefona
// Prej je bila samo na prvem mestu, zato je predogled slogan kazal v Jakarti
// in se ni ujemal s tem, kar vidi gost. Na javno spletišče ne pride nikoli.
// ---------------------------------------------------------------------------

export const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-caveat",
  display: "swap",
  /*
    preload: false je namerno.

    Caveat nosi en sam napis v podnožju, stane pa okoli 73 KB — skoraj
    polovico vsega, kar stran prenese. S preloadom bi gost čakal nanj, še
    preden bi videl logotip in gumbe. Tako se stran nariše takoj v Jakarti,
    slogan pa dobi svojo pisavo trenutek zatem; display: swap poskrbi, da
    med tem ni praznega mesta.
  */
  preload: false,
});
