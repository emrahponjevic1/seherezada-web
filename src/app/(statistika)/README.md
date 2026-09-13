# QR kodovi i statistika (`/statistika`)

Sve što pripada QR sistemu nalazi se u ovom folderu. `(statistika)` je route
grupa: zagrade znače da se ime foldera ne pojavljuje u URL-u.

```
(statistika)/
  _qr/                  sva logika i komponente (prijava, baza, dizajner, grafikoni, CSS)
  statistika/           /statistika — lista kodova, novi kod, detalji, CSV
    budilica/           /statistika/budilica — dnevni poziv da Supabase ne zaspi
  q/[slug]/             kratki linkovi QR kodova (seherezada.net/q/...)
```

Folder `_qr` je privatan (donja crta): Next.js od njega ne pravi stranice.

## Kako radi

- **Kreiranje koda:** na `/statistika/novi` upišeš naziv i link, izabereš način
  i uređuješ izgled (boje, oblici, logo). Slika se preuzima kao PNG/SVG/JPG/WebP.
- **Način „S brojanjem“:** QR vodi na `seherezada.net/q/<slug>`. Server pročita
  odredište iz baze, odmah preusmjeri gosta (302) i tek onda zapiše skeniranje.
- **Način „Direktno“:** QR vodi pravo na odredište; skeniranja se ne broje.
- **Statistika:** po danima, satima, danima u sedmici, državi, gradu, jeziku,
  vrsti uređaja, OS-u, pregledniku, proizvođaču i modelu; CSV izvoz.
- **Privatnost:** IP adrese se ne spremaju (samo dnevni anonimni otisak), botovi i
  pregledi linkova (WhatsApp i sl.) se ne broje.

## Baza (Supabase)

Baza je potrebna samo za QR kodove i skeniranja. **Javna stranica ne čita iz baze.**

- Spajanje preko `POSTGRES_URL` (Vercelova Supabase integracija) ili `DATABASE_URL`.
- Tabele (`qr_kodovi`, `qr_skeniranja`, `admin_prijave`) se prave same pri prvom
  otvaranju `/statistika`, sve s uključenim **Row Level Security bez pravila** —
  Supabaseov javni API ih ne može ni čitati ni mijenjati.
- Besplatni Supabase pauzira projekat nakon 7 dana bez aktivnosti; zato Vercel
  Cron (`vercel.json`) jednom dnevno otvori `/statistika/budilica`. Radi samo na
  produkciji.

## Varijable okruženja

| Varijabla | Čemu služi |
| --------- | ---------- |
| `POSTGRES_URL` ili `DATABASE_URL` | Supabase Postgres |
| `ADMIN_GESLO` | lozinka za `/statistika` (ime je ostalo od ranije); promjena odjavi sve uređaje |
| `CRON_SECRET` | štiti `/statistika/budilica` |
| `QR_BAZNI_URL` | samo lokalno: da kodovi vode na računar u kućnoj mreži |

Na Vercel probnoj verziji (Preview) kratki linkovi automatski vode na probni link
grane, a dizajner upozorava da se takav kod ne štampa.

## Sakrivanje od pretraživača

- `next.config.ts` šalje `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`
  za `/statistika` i `/q/`.
- Te putanje **namjerno nisu** u `robots.txt`: `Disallow` bi Googleu zabranio da
  pročita `noindex`, a svakome bi otkrio adresu statistike.
- Nijedna javna stranica, sitemap ni `llms.txt` ne linkuju na `/statistika`.

## Kako sve obrisati

1. Obriši ovaj folder `src/app/(statistika)/`.
2. `src/proxy.ts`: iz matchera ukloni `|q/|statistika`.
3. `next.config.ts`: ukloni blokove headera za `/statistika` i `/q/`.
4. `vercel.json`: ukloni cron `/statistika/budilica` (regija `fra1` može ostati).
5. `package.json`: ukloni `postgres`, `qr-code-styling`, `ua-parser-js`
   i `@types/ua-parser-js`.
6. `.env.example`: ukloni `DATABASE_URL`, `ADMIN_GESLO` i `CRON_SECRET`.
