/**
 * Bedömningskriterierna, en enda källa för hela siten.
 *
 * Både headern (trust-raden) och startsidans metodikband räknar ur den här
 * listan, så antalet aldrig kan hamna i otakt med verkligheten. Kriterierna
 * MÅSTE spegla /sa-testar-vi/. Ändrar du dem här, ändra även den sidan.
 */
export const kriterier = [
  'Säkerhet',
  'Användarvänlighet',
  'Komfort',
  'Kvalitet',
  'Pris och värde',
] as const;

export const antalKriterier = kriterier.length;
