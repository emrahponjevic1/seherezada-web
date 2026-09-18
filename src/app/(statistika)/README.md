# QR kodovi, linktree stranice i statistika (`/statistika`)

Sve što pripada QR sistemu nalazi se u ovom folderu. `(statistika)` je route
grupa: zagrade znače da se ime foldera ne pojavljuje u URL-u.

```
(statistika)/
  _qr/                  logika kodova (prijava, baza, dizajner, grafikoni, CSS)
  _linkovi/             logika stranica s linkovima (urednik, izgled, upiti)
  statistika/           /statistika — lista kodova, novi kod, detalji, CSV
    linkovi/            /statistika/linkovi — kreiranje i uređivanje linktreeja
    budilica/           /statistika/budilica — dnevni poziv da Supabase ne zaspi
  links/                /links/<slug> — stranica s linkovima koju vidi gost
  q/[slug]/             kratki linkovi (seherezada.net/q/...)
```

Folderi `_qr` i `_linkovi` su privatni (donja crta): Next.js od njih ne pravi
stranice.

## Kako radi

- **Kreiranje koda:** na `/statistika/novi` upišeš naziv, izabereš odredište
  (vanjski link ili svoju stranicu s linkovima), način i izgled. Slika se
  preuzima kao PNG/SVG/JPG/WebP.
- **Način „S brojanjem“:** QR vodi na `seherezada.net/q/<slug>`. Server pročita
  odredište iz baze, odmah preusmjeri gosta (302) i tek onda zapiše skeniranje.
- **Način „Direktno“:** QR vodi pravo na odredište; skeniranja se ne broje.
- **Stranica s linkovima:** na `/statistika/linkovi/nova` napraviš linktree —
  naslov, boja, značka Otvoreno/Zatvoreno i dugmad, sve na jednom ekranu i sve
  se sprema jednim klikom. Gost je vidi na `/links/<slug>`.
- **Statistika:** po danima, satima, danima u sedmici, državi, gradu, jeziku,
  vrsti uređaja, OS-u, pregledniku, proizvođaču i modelu; CSV izvoz.
- **Privatnost:** IP adrese se ne spremaju (samo dnevni anonimni otisak), botovi i
  pregledi linkova (WhatsApp i sl.) se ne broje.

## Dugme je kod

Dugme na stranici s linkovima **nije zasebna vrsta zapisa** — to je red u
`qr_kodovi` kojemu je postavljen `stranica_id`. Ima svoj kratki link, pa klik
na njega prolazi kroz isti `/q/<slug>` i upisuje se u `qr_skeniranja`. Zato
dugme odmah dobija svu statistiku koju kod već ima, bez ijednog novog upita
ili grafikona.

Posljedica koju treba imati na umu: **„sva skeniranja“ više nije jednoznačno.**
Bez razlikovanja bi glavne brojke na `/statistika` počele brojati i klikove.
Zato `_qr/upiti.ts` radi s opsegom:

| Opseg | Znači |
| --- | --- |
| `"kodovi"` | samo pravi QR kodovi (dugmad imaju `stranica_id`) |
| `{ kod: 7 }` | jedan kod **ili** jedno dugme |
| `{ stranica: 3 }` | svi klikovi na dugmad jedne stranice |

Tri kolone koje se lako pomiješaju:

| Kolona | Znači |
| --- | --- |
| `qr_kodovi.stranica_id` | ovaj red je **dugme na** toj stranici |
| `qr_kodovi.vodi_na` | ovaj **kod vodi na** tu stranicu |
| `qr_skeniranja.stranica_id` | koja je stranica bila otvorena **u tom skeniranju** |

Zadnja postoji da prebacivanje koda s jednog linktreeja na drugi ne preseli
stara skeniranja novoj stranici.

## Odredišta dugmadi

- **Vanjski link** — `https://…`
- **Naša stranica po jeziku gosta** — čuva se kao `interno:/meni`, a `/q/…` ga
  pri kliku prevede prema `accept-language`: Nijemac ide na `/de/speisekarte`,
  Turčin na `/tr/menu`. Tabela prijevoda je `src/i18n/routing.ts` — ne prepisuje
  se ovdje.
- **Poziv** — `tel:+386…`

## Jezici na `/links`

Ova stranica **ne ide kroz next-intl**: sva vidljiva besedila upisuje vlasnik u
panelu, pa ih u `messages/<jezik>.json` nema. Jezik se bira iz `accept-language`
telefona (`_linkovi/tekst.ts`), a `?jezik=de` ga mijenja ručno. Hrvatski i srpski
dobijaju BHS. Jedina besedila koja ne piše vlasnik su na znački
Otvoreno/Zatvoreno i stoje u `_linkovi/znacka.ts`.

Ako prijevoda nema, prikazuje se privzeti jezik, a ako ni njega — osnovni natpis
dugmeta. Namjerno se **ne** uzima „prvi koji postoji“: gumb s upisanim samo
njemačkim prijevodom bi tada Englezu pokazao njemački natpis.

## Baza (Supabase)

Baza je potrebna za QR kodove, skeniranja i stranice s linkovima.
**Javne stranice spletišča ne čitaju iz baze** — `/links/<slug>` je jedina
iznimka i pri kvaru baze pokaže rezervnu karticu, nikad grešku.

- Spajanje preko `POSTGRES_URL` (Vercelova Supabase integracija) ili `DATABASE_URL`.
- Tabele (`qr_kodovi`, `qr_skeniranja`, `link_stranice`, `admin_prijave`) se prave
  same pri prvom otvaranju `/statistika`, sve s uključenim **Row Level Security bez
  pravila** — Supabaseov javni API ih ne može ni čitati ni mijenjati.
- Besplatni Supabase pauzira projekat nakon 7 dana bez aktivnosti; zato Vercel
  Cron (`vercel.json`) jednom dnevno otvori `/statistika/budilica`. Radi samo na
  produkciji.

## Varijable okruženja

| Varijabla | Čemu služi |
| --------- | ---------- |
| `POSTGRES_URL` ili `DATABASE_URL` | Supabase Postgres |
| `ADMIN_GESLO` | lozinka za `/statistika` (ime je ostalo od ranije); promjena odjavi sve uređaje |
| `CRON_SECRET` | štiti `/statistika/budilica` |
| `QR_BAZNI_URL` | samo lokalno: da kodovi i interni linkovi vode na računar u kućnoj mreži |

Na Vercel probnoj verziji (Preview) kratki linkovi automatski vode na probni link
grane, a dizajner upozorava da se takav kod ne štampa.

## Sakrivanje od pretraživača

- `next.config.ts` šalje `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`
  za `/statistika` i `/q/`, a `noindex, follow` za `/links` — sadržaj tamo
  podvaja prave stranice sajta, pa bi se u Googleu takmičili međusobno.
- Te putanje **namjerno nisu** u `robots.txt`: `Disallow` bi Googleu zabranio da
  pročita `noindex`, a svakome bi otkrio adresu statistike.
- Nijedna javna stranica, sitemap ni `llms.txt` ne linkuju na `/statistika`.

## Kako sve obrisati

1. Obriši ovaj folder `src/app/(statistika)/`.
2. `src/proxy.ts`: iz matchera ukloni `|q/|statistika|links`.
3. `next.config.ts`: ukloni blokove headera za `/statistika`, `/q/` i `/links`.
4. `vercel.json`: ukloni cron `/statistika/budilica` (regija `fra1` može ostati).
5. `package.json`: ukloni `postgres`, `qr-code-styling`, `ua-parser-js`
   i `@types/ua-parser-js`.
6. `.env.example`: ukloni `DATABASE_URL`, `ADMIN_GESLO` i `CRON_SECRET`.
7. `messages/*.json`: iz `zasebnost` ukloni `qrNaslov` i `qrOpis` (6 jezika),
   te pripadajući odlomak u `src/components/legal/ZasebnostPageContent.tsx`.
