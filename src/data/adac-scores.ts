/**
 * ADAC Kindersitztest-betyg per bilbarnstol.
 *
 * NOLLTOLERANS: varje entry är manuellt verifierad mot produktens faktiska
 * testsida på adac.de vid inmatningstillfället (sourceUrl + verifiedDate).
 * Betygen får ALDRIG uppskattas, extrapoleras eller skrivas från minnet.
 * ADAC använder tysk betygsskala där LÄGRE är bättre: 0,6 bäst - 5,5 sämst.
 *
 * Skalsteg (ADAC:s egna gränser):
 *   0,6-1,5 mycket bra (sehr gut) · 1,6-2,5 bra (gut) ·
 *   2,6-3,5 tillfredsställande (befriedigend) · 3,6-4,5 tillräcklig (ausreichend) ·
 *   4,6-5,5 otillräcklig (mangelhaft)
 */
import { betyg } from '../lib/format';

export interface AdacSubScore {
  /** Delkriterium på svenska, t.ex. "Frontalkrock" */
  label: string;
  score: number;
}

export interface AdacScore {
  /** Nyckel som sidorna slår upp på, t.ex. 'britax-dualfix-5z' */
  key: string;
  /** EXAKT testad konfiguration som den står på ADAC-sidan */
  testedConfiguration: string;
  testYear: number;
  /** ADAC Urteil, t.ex. 1.6 */
  overall: number;
  sicherheit: number;
  bedienung: number;
  ergonomie: number;
  schadstoffe: number;
  /** Delkriterier per kategori - bara om de faktiskt lästs av från ADAC-sidan */
  subScores?: Partial<Record<'sicherheit' | 'bedienung' | 'ergonomie' | 'schadstoffe', AdacSubScore[]>>;
  sourceUrl: string;
  /** Datum då betygen verifierades mot sourceUrl (YYYY-MM-DD) */
  verifiedDate: string;
  /** true om den testade konfigurationen är exakt produkten vi säljer.
   *  false = variant (t.ex. testad med specifik bas eller föregångarmodell) */
  exactMatch: boolean;
  /** Läsarvänlig not när konfigurationen avviker, t.ex. "Testad tillsammans med FamilyFix 360 Pro-basen" */
  configNote?: string;
}

/** Svensk omdömesord för ett ADAC-betyg (avrundat till 1 decimal, ADAC:s gränser) */
export function adacWord(score: number): string {
  const s = Math.round(score * 10) / 10;
  if (s <= 1.5) return 'Mycket bra';
  if (s <= 2.5) return 'Bra';
  if (s <= 3.5) return 'Tillfredsställande';
  if (s <= 4.5) return 'Tillräcklig';
  return 'Otillräcklig';
}

/** Skalfärg för ett ADAC-betyg - mappad till bebisguidens varma semantik */
export function adacColor(score: number): string {
  const s = Math.round(score * 10) / 10;
  if (s <= 1.5) return '#35604a'; // mossgrön (= --color-safe)
  if (s <= 2.5) return '#6d8a3f'; // olivgrön
  if (s <= 3.5) return '#b45309'; // amber (= --color-warning)
  if (s <= 4.5) return '#a3441c'; // bränd orange
  return '#9e2a2b';               // tegelröd (= --color-danger)
}

/** Svensk sifferformatering: 1.6 -> "1,6". Använder sitens gemensamma helper. */
export function adacFmt(score: number): string {
  return betyg(score);
}

export const adacScores: AdacScore[] = [
  {
    key: 'britax-dualfix-5z',
    testedConfiguration: 'Britax Römer Dualfix 5Z + Flex Base 5Z',
    testYear: 2023,
    overall: 2.4,
    sicherheit: 2.0,
    bedienung: 2.7,
    ergonomie: 2.3,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/britax-roemer/britax-roemer-dualfix-5z-plus-flex-base-5z-id-824/',
    verifiedDate: '2026-07-27',
    exactMatch: false,
    configNote: 'Testad med Flex Base 5Z. ADAC:s test 2026 med Vario Base 5Z gav Tillfredsställande (3,2).',
  },
  {
    key: 'maxi-cosi-pebble-360-pro-2',
    testedConfiguration: 'Maxi-Cosi Pebble 360 Pro2',
    testYear: 2024,
    overall: 2.2,
    sicherheit: 1.5,
    bedienung: 2.8,
    ergonomie: 2.0,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/maxi-cosi/maxi-cosi-pebble-360-pro2-id-842/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
    configNote: 'Testad utan bas. Med FamilyFix 360 Pro-basen: samma totalbetyg (2,2).',
  },
  {
    key: 'cybex-sirona-t',
    testedConfiguration: 'Cybex Sirona T + Base T',
    testYear: 2023,
    overall: 2.3,
    sicherheit: 1.7,
    bedienung: 2.9,
    ergonomie: 1.9,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/cybex/cybex-sirona-t-plus-base-t-id-814/',
    verifiedDate: '2026-07-27',
    exactMatch: false,
    configNote: 'Testad tillsammans med Base T.',
  },
  {
    key: 'doona-i',
    testedConfiguration: 'Doona i',
    testYear: 2024,
    overall: 2.4,
    sicherheit: 1.4,
    bedienung: 3.2,
    ergonomie: 1.7,
    schadstoffe: 2.4,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/doona/doona-i-id-870/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
    configNote: 'Testad bältesmonterad. Med Doona i Isofix-basen: totalbetyg 1,7.',
  },
  {
    key: 'besafe-izi-modular-rf-x1',
    testedConfiguration: 'BeSafe iZi Modular RF X1 + iZi Modular i-Size Base',
    testYear: 2022,
    overall: 1.7,
    sicherheit: 1.2,
    bedienung: 2.4,
    ergonomie: 1.9,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/besafe/besafe-izi-modular-rf-x1-plus-izi-modular-i-size-base-id-769/',
    verifiedDate: '2026-07-27',
    exactMatch: false,
    configNote: 'Testad tillsammans med iZi Modular i-Size-basen.',
  },
  {
    key: 'cybex-cloud-t',
    testedConfiguration: 'Cybex Cloud T + Base T',
    testYear: 2023,
    overall: 1.7,
    sicherheit: 1.3,
    bedienung: 2.2,
    ergonomie: 1.9,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/cybex/cybex-cloud-t-plus-base-t-id-812/',
    verifiedDate: '2026-07-27',
    exactMatch: false,
    configNote: 'Testad med Base T - delat bästa totalbetyg i ADAC:s testomgång 2023. Bältesmonterad utan bas: 2,1.',
  },
  {
    key: 'britax-baby-safe-isense',
    testedConfiguration: 'Britax Römer Baby-Safe iSense',
    testYear: 2021,
    overall: 2.1,
    sicherheit: 1.6,
    bedienung: 2.6,
    ergonomie: 1.7,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/tests/kindersicherheit/kindersitztest/details/730/britax-romer-baby-safe-isense/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
    configNote: 'Testad bältesmonterad. Med Flex Base iSense: 2,5.',
  },
  {
    key: 'britax-baby-safe-5z2',
    testedConfiguration: 'Britax Römer Baby-Safe 5Z2',
    testYear: 2023,
    overall: 2.5,
    sicherheit: 1.8,
    bedienung: 3.0,
    ergonomie: 1.6,
    schadstoffe: 1.6,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/britax-roemer/britax-roemer-baby-safe-5z2-id-823/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
    configNote: 'Testad bältesmonterad. Med Flex Base 5Z: 2,4.',
  },
  {
    key: 'britax-baby-safe-core',
    testedConfiguration: 'Britax Römer Baby-Safe Core',
    testYear: 2024,
    overall: 1.8,
    sicherheit: 1.5,
    bedienung: 2.2,
    ergonomie: 1.6,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/britax-roemer/britax-roemer-baby-safe-core-id-868/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
    configNote: 'Testad bältesmonterad utan bas. Kombon med Baby-Safe Core-basen fick betydligt sämre resultat: Tillfredsställande (2,6) med säkerhetsdelbetyget 2,9.',
  },
  {
    key: 'joie-i-spin-xl',
    testedConfiguration: 'Joie i-Spin XL',
    testYear: 2024,
    overall: 3.0,
    sicherheit: 2.4,
    bedienung: 3.2,
    ergonomie: 2.8,
    schadstoffe: 1.6,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/joie/joie-i-spin-xl-id-853/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
  },
  {
    key: 'joie-i-spin-360',
    testedConfiguration: 'Joie i-Spin 360',
    testYear: 2019,
    overall: 1.8,
    sicherheit: 1.7,
    bedienung: 1.9,
    ergonomie: 1.8,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/joie/joie-i-spin-360-id-640/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
  },
  {
    key: 'maxi-cosi-pebble-360-pro',
    testedConfiguration: 'Maxi-Cosi Pebble 360 Pro',
    testYear: 2023,
    overall: 4.6,
    sicherheit: 1.5,
    bedienung: 2.8,
    ergonomie: 2.0,
    schadstoffe: 4.6,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/maxi-cosi/maxi-cosi-pebble-360-pro-id-836/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
    configNote: 'Underkänd enbart på skadliga ämnen i klädseln (4,6) trots mycket bra krocksäkerhet (1,5). Efterträdaren Pebble 360 Pro 2 åtgärdade detta och fick Bra (2,2) 2024.',
  },
  {
    key: 'cybex-anoris-t',
    testedConfiguration: 'Cybex Anoris T i-Size',
    testYear: 2022,
    overall: 1.5,
    sicherheit: 1.2,
    bedienung: 1.8,
    ergonomie: 1.9,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/cybex/cybex-anoris-t-i-size-id-749/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
    configNote: 'Bästa betygsbandet (Mycket bra). Efterträdaren Anoris T2 fick 2,8 år 2025 pga miljöskadliga ämnen i Comfort-tyget.',
  },
  {
    key: 'cybex-anoris-t2',
    testedConfiguration: 'Cybex Anoris T2 i-Size',
    testYear: 2025,
    overall: 2.8,
    sicherheit: 1.3,
    bedienung: 1.7,
    ergonomie: 2.6,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/cybex/cybex-anoris-t2-i-size-id-894/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
    configNote: 'Totalbetyget nedgraderades enbart pga PFAS i den testade Comfort-klädseln (miljöskadliga ämnen 4,1) - enligt Cybex utgick den klädseln i början av 2025. Krocksäkerheten fick 1,3. Föregångaren Anoris T fick 1,5 totalt (2022).',
  },
  {
    key: 'axkid-minikid-4-pro',
    testedConfiguration: 'Axkid Minikid 4 Pro',
    testYear: 2026,
    overall: 3.6,
    sicherheit: 2.8,
    bedienung: 3.8,
    ergonomie: 2.8,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/axkid/axkid-minikid-4-pro-id-941/',
    verifiedDate: '2026-07-27',
    exactMatch: false,
    configNote: 'Betyget dras ned av komplicerad bältesmontering (Hantering 3,8), inte av krockresultatet. Stolen är godkänd i det frivilliga svenska Plus Test.',
  },
  {
    key: 'maxi-cosi-pearl-360',
    testedConfiguration: 'Maxi-Cosi Pearl 360 + FamilyFix 360 Base',
    testYear: 2022,
    overall: 2.1,
    sicherheit: 2.1,
    bedienung: 2.3,
    ergonomie: 2.0,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/maxi-cosi/maxi-cosi-pearl-360-plus-familyfix-360-base-id-757/',
    verifiedDate: '2026-07-27',
    exactMatch: false,
    configNote: 'Testad med FamilyFix 360-basen, stolens monteringssätt. Pearl 360 Pro med Pro-basen fick också 2,1 (2023).',
  },
  {
    key: 'britax-dualfix-m-plus',
    testedConfiguration: 'Britax Römer Dualfix M Plus',
    testYear: 2023,
    overall: 2.3,
    sicherheit: 2.1,
    bedienung: 2.6,
    ergonomie: 2.1,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/britax-roemer/britax-roemer-dualfix-m-plus-id-797/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
  },
  {
    key: 'recaro-kio',
    testedConfiguration: 'Recaro Kio + Avan/Kio Base',
    testYear: 2022,
    overall: 2.3,
    sicherheit: 2.0,
    bedienung: 2.7,
    ergonomie: 2.0,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/recaro/recaro-kio-plus-avan-kio-base-id-766/',
    verifiedDate: '2026-07-27',
    exactMatch: false,
    configNote: 'Testad med Avan/Kio-basen, stolens enda monteringssätt.',
  },
  {
    key: 'britax-kidfix-m',
    testedConfiguration: 'Britax Römer Kidfix M i-Size',
    testYear: 2022,
    overall: 2.0,
    sicherheit: 2.4,
    bedienung: 1.6,
    ergonomie: 1.9,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/britax-roemer/britax-roemer-kidfix-m-i-size-id-745/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
  },
  {
    key: 'joie-i-trillo-fx',
    testedConfiguration: 'Joie i-Trillo FX',
    testYear: 2025,
    overall: 2.3,
    sicherheit: 2.5,
    bedienung: 2.1,
    ergonomie: 2.3,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/joie/joie-i-trillo-fx-id-899/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
  },
  {
    key: 'britax-kidfix-pro-m',
    testedConfiguration: 'Britax Römer Kidfix Pro M',
    testYear: 2025,
    overall: 2.7,
    sicherheit: 3.1,
    bedienung: 1.9,
    ergonomie: 2.0,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/britax-roemer/britax-roemer-kidfix-pro-m-id-900/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
  },
  {
    key: 'cybex-aton-b2',
    testedConfiguration: 'Cybex Aton B2 i-Size',
    testYear: 2022,
    overall: 1.9,
    sicherheit: 1.7,
    bedienung: 2.2,
    ergonomie: 1.7,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/cybex/cybex-aton-b2-i-size-id-751/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
  },
  {
    key: 'joie-i-level-pro',
    testedConfiguration: 'Joie i-Level Pro',
    testYear: 2025,
    overall: 2.3,
    sicherheit: 2.3,
    bedienung: 2.4,
    ergonomie: 2.2,
    schadstoffe: 1.0,
    sourceUrl: 'https://www.adac.de/rund-ums-fahrzeug/ausstattung-technik-zubehoer/kindersitze/kindersitztest/marken/joie/joie-i-level-pro-id-901/',
    verifiedDate: '2026-07-27',
    exactMatch: true,
  },
  // ================= EJ TESTADE av ADAC (verifierat 2026-07-27) =================
  // Axkid One 3: ej testad. Bara Axkid One (2,2, maj 2021) och Axkid One+ (2,1, 2021).
  // Cybex Pallas B2 i-Size: ej testad (hela varumärkesindexet genomsökt). Föregångaren
  //   Pallas B-Fix fick 2,4 (maj 2020).
  // BeSafe iZi Turn B i-Size: ej testad. Syskonmodellen iZi Twist B (2,4, 2020) är en
  //   ANNAN produkt (sidorotation, ej 360) - betyget får inte lånas.
  // Joie Every Stage (R44-versionen): ej testad. Efterträdaren Every Stage R129 fick
  //   3,1 (okt 2023).
  // BeSafe iZi Modular i-Size (toddler): testad 2016 med bas (2,4); X1-revisionen 2020
  //   fick 2,0 - lägg in först när det är klarlagt vilken revision som säljs.
];

export function adacFor(key: string): AdacScore | undefined {
  return adacScores.find((s) => s.key === key);
}
