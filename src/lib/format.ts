/**
 * Svensk talformatering.
 *
 * `toFixed()` ger engelskt decimaltecken ("4.5") och `toLocaleString()` utan
 * locale följer byggserverns inställning, vilket ger engelskt format på de
 * flesta CI-maskiner. Båda är därför bannade i källkoden (quality-gate check 19).
 * All formatering kapslas här i stället, så att en ändring bara behöver göras
 * på ett ställe och aldrig kan glida isär mellan komponenter.
 */

/** Betyg med en decimal: 4.5 -> "4,5". Heltal behåller decimalen: 5 -> "5,0". */
export function betyg(v: number): string {
  return v.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Tal med valfritt antal decimaler och svenskt tusentalsavgränsare. */
export function tal(v: number, decimaler = 0): string {
  return v.toLocaleString('sv-SE', {
    minimumFractionDigits: decimaler,
    maximumFractionDigits: decimaler,
  });
}

/** Heltal, t.ex. antal jämförda produkter. */
export function heltal(v: number): string {
  return Math.round(v).toLocaleString('sv-SE');
}
