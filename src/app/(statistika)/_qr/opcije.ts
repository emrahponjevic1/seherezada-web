import type { Options } from "qr-code-styling";
import type { QrStil } from "@/app/(statistika)/_qr/stil";

/** Pretvori naš shranjeni stil v nastavitve knjižnice qr-code-styling. */
export function opcijeQr(
  stil: QrStil,
  podaci: string,
  velicina: number,
  tip: "svg" | "canvas",
  bijelaPozadina = false
): Options {
  const barva = stil.gradijent
    ? {
        gradient: {
          type: stil.tipGradijenta,
          rotation: (stil.rotacija * Math.PI) / 180,
          colorStops: [
            { offset: 0, color: stil.bojaTacaka },
            { offset: 1, color: stil.bojaTacaka2 },
          ],
        },
      }
    : { color: stil.bojaTacaka };

  // JPEG nima prosojnosti — prosojno ozadje bi postalo črno in kod neberljiv.
  const pozadina = stil.providnaPozadina && !bijelaPozadina ? "transparent" : stil.providnaPozadina ? "#ffffff" : stil.bojaPozadine;

  return {
    width: velicina,
    height: velicina,
    type: tip,
    data: podaci,
    margin: Math.round((velicina * stil.margina) / 100),
    qrOptions: { errorCorrectionLevel: stil.korekcija },
    image: stil.logo ?? undefined,
    imageOptions: {
      imageSize: stil.velicinaLoga,
      margin: Math.round((velicina * stil.marginaLoga) / 300),
      hideBackgroundDots: stil.sakrijTackeIzaLoga,
      crossOrigin: "anonymous",
    },
    dotsOptions: { type: stil.oblikTacaka, ...barva },
    cornersSquareOptions: { type: stil.oblikOkvira, color: stil.bojaOkvira },
    cornersDotOptions: { type: stil.oblikSredine, color: stil.bojaSredine },
    backgroundOptions: { color: pozadina },
  };
}
