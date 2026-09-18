// ---------------------------------------------------------------------------
// PROZIREN LOGOTIP IZ LOGOTIPA NA POLNI PODLAGI
//
//   node scripts/prozirni-logo.js
//
// Izvorni public/images/seherezada-logo.png je bel risba na polni bordo
// podlagi, brez alfa kanala. Na oranžnem ozadju strani s povezavami tak
// kvadrat ne pride v poštev, zato tu izluščimo risbo samo.
//
// KAKO
// Risba je čisto bela, podlaga pa temno rdeča, zato prosojnosti ni treba
// ugibati — izračuna se iz zelenega kanala, ki ima največji razmik
// (podlaga 16, risba 255):
//
//   alfa = (zelena - 18) / (255 - 18)
//
// Robovi tako obdržijo mehek prehod, kakršnega ima izvirnik. Ročno brisanje
// podlage (čarobna palica) bi pustilo rdeč rob okoli tankih črt nasmeha in
// repov črk Š in d.
//
// PAST: PODLAGA NI POVSEM ENAKOMERNA
// Štirje koti slike so svetlejši (zelena okoli 40 namesto 16) — logotip ima
// rahel sij v kotih. Prva različica tega skripta je podlago prebrala iz kota
// in zato imela za podlago napačno barvo; rezultat je bil komaj viden šum čez
// vso sliko, ki je pokvaril tudi samodejno rezanje roba.
//
// Zato se najprej odšteje prag: vse pod 12 % gre na nič, ostalo se raztegne
// nazaj na polno. Sij v kotih doseže največ 11 %, prave robne pike pa so
// precej nad tem — med njima je čista ločnica (samo 3.786 pik od milijona
// pade vmes).
//
// Na koncu se odreže prazen rob — izvirnik ima okoli risbe približno četrtino
// praznine, zaradi katere bi bil logotip na strani videti premajhen.
//
// Nastaneta dve datoteki:
//   seherezada-logo-bijeli.png   bela risba  — za temna in barvna ozadja
//   seherezada-logo-bordo.png    bordo risba — za bela in svetla ozadja
// ---------------------------------------------------------------------------

const path = require("node:path");
const sharp = require("sharp");

const IZVOR = path.join(__dirname, "..", "public", "images", "seherezada-logo.png");
const MAPA = path.join(__dirname, "..", "public", "images");

/** Bordo iz znamke; uporabi se za različico na svetlih podlagah. */
const BORDO = [164, 16, 35];

/** Zelena vrednost podlage; iz nje se meri, koliko je piksel "bel". */
const PODLAGA_G = 18;

/** Vse pod tem deležem je sij v kotih, ne risba. */
const PRAG = 0.12;

/** Koliko praznih pikslov pustimo okoli risbe po rezanju. */
const ROB = 8;

async function main() {
  const { data, info } = await sharp(IZVOR).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const razpon = 255 - PODLAGA_G;
  const alfa = new Uint8Array(width * height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const surova = (data[i + 1] - PODLAGA_G) / razpon;
      // Odštej prag in razteg nazaj na polno, da polna risba ostane pri 1.
      const a = (Math.min(1, Math.max(0, surova)) - PRAG) / (1 - PRAG);
      const vrijednost = Math.round(Math.min(1, Math.max(0, a)) * 255);
      alfa[y * width + x] = vrijednost;

      if (vrijednost > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) throw new Error("V sliki ni najti risbe — se je odtenek podlage spremenil?");

  const levo = Math.max(0, minX - ROB);
  const gore = Math.max(0, minY - ROB);
  const sirina = Math.min(width, maxX + 1 + ROB) - levo;
  const visina = Math.min(height, maxY + 1 + ROB) - gore;

  async function zapisi(ime, barva) {
    const slika = Buffer.alloc(sirina * visina * 4);
    for (let y = 0; y < visina; y++) {
      for (let x = 0; x < sirina; x++) {
        const izvor = (y + gore) * width + (x + levo);
        const cilj = (y * sirina + x) * 4;
        slika[cilj] = barva[0];
        slika[cilj + 1] = barva[1];
        slika[cilj + 2] = barva[2];
        slika[cilj + 3] = alfa[izvor];
      }
    }
    const pot = path.join(MAPA, ime);
    await sharp(slika, { raw: { width: sirina, height: visina, channels: 4 } })
      .png({ compressionLevel: 9, palette: false })
      .toFile(pot);
    return pot;
  }

  const bijeli = await zapisi("seherezada-logo-bijeli.png", [255, 255, 255]);
  const bordo = await zapisi("seherezada-logo-bordo.png", BORDO);

  console.log(`Risba najdena: ${maxX - minX + 1} x ${maxY - minY + 1} px od ${width} x ${height}`);
  console.log(`Izrez z robom:  ${sirina} x ${visina} px`);
  console.log(`Zapisano: ${path.basename(bijeli)}, ${path.basename(bordo)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
