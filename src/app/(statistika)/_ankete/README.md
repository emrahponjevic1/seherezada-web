# Ankete (`/anketa`)

Anonimne ankete za ekipu, na šest jezika. Radnik otvori `seherezada.net/anketa`,
izabere jezik i popuni. Rezultati su u panelu: **`/statistika/ankete`**.

```
_ankete/
  definicije/          jedna datoteka = jedna anketa (pitanja na 6 jezika)
  registar.ts          spisak svih anketa + koja je na golom /anketa (AKTUELNA)
  tipovi.ts            vrste pitanja: skala (1–5), izbor (jedan od ponuđenih), tekst
  tekst.ts             dugmad i poruke obrasca na 6 jezika (iste za sve ankete)
  AnketaStranica.tsx   ekran 1: izbor jezika · ekran 2: anketa
  Obrazac.tsx          obrazac u pregledniku
  akcije.ts            slanje — server sve ponovo provjeri (provjera.ts)
  shema.ts             tabela ankete_odgovori
  upiti.ts             čitanje za panel
anketa/                /anketa i /anketa/<slug> (stranica za radnike)
statistika/ankete/     rezultati u panelu + CSV za Excel
```

## Nova anketa

1. Kopiraj datoteku iz `definicije/`, promijeni `slug`, `naziv` i pitanja.
2. Dopiši je u `SVE_ANKETE` u `registar.ts`.
3. Ako treba da je otvara goli `seherezada.net/anketa`, upiši njen slug u `AKTUELNA`.
   Svaka anketa uvijek radi i na `/anketa/<slug>`.
4. Staru anketu zatvori sa `zatvorena: true` — rezultati ostaju.

Ankete se namjerno ne prave kroz panel: moraju biti prevedene na šest jezika,
a obrazac za prevode bi bio komplikovaniji od same ankete.

## Pravila koja se ne krše

- **ID pitanja i odgovora** (`zadovoljstvo`, `da`, `cesto` …) se ne mijenja dok
  anketa prima odgovore — u bazi su odgovori spremljeni pod njim, ne pod tekstom.
  Zato se odgovori na njemačkom i turskom sabiraju zajedno. Tekst pitanja se
  smije ispraviti kad god.
- Kad se pitanja sadržajno promijene, povećaj `verzija`; panel tada kaže
  koliko je odgovora iz stare verzije.
- **Anonimnost:** tabela nema IP adresu, preglednik, otisak ni sat — samo datum,
  jezik i odgovore. Ne dodavati ništa od toga: anketa obećava 100 % anonimnost.
- **Ne dira QR sistem:** `shema.ts` pravi samo `ankete_odgovori` i ne poziva
  `pripraviQrTabele()`. Tabele `qr_kodovi`, `qr_skeniranja` i `link_stranice`
  ostaju netaknute — kodovi su odštampani.

## Zaštita od smeća

Skriveno polje-zamka za robote, provjera svakog odgovora na serveru (nepoznata
pitanja otpadaju, ocjene van skale otpadaju, tekst se skraćuje na 4000 znakova),
`noindex` u `next.config.ts`. „Već poslano“ pamti samo telefon (localStorage) i
nudi „Popuni za drugu osobu“, jer ekipa može dijeliti tablet u lokalu.

## Kako obrisati

1. Obriši `_ankete/`, `anketa/` i `statistika/ankete/`.
2. `src/proxy.ts`: iz matchera ukloni `|anketa` (ostalo NE dirati).
3. `next.config.ts`: ukloni dva bloka za `/anketa`.
4. `_qr/Bocnik.tsx`: ukloni stavku „Ankete“, u `_qr/Okvir.module.css` vrati `.dolje` na 4 kolone.
5. U Supabaseu po želji: `drop table ankete_odgovori;`
