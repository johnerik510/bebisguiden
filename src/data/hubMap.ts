export const hubs = {
  'halsa-och-symptom': {
    title: 'Bebisens hälsa & symptom',
    href: '/guider/halsa-och-symptom/',
    children: [
      { slug: 'bebis-feber', title: 'Bebis med feber' },
      { slug: 'bebis-forkyld', title: 'Förkyld bebis' },
      { slug: 'bebis-hostad', title: 'Bebis som hostar' },
      { slug: 'bebis-kolik', title: 'Bebis med kolik' },
      { slug: 'bebis-magont', title: 'Magont hos bebis' },
      { slug: 'bebis-diarre', title: 'Diarré hos bebis' },
      { slug: 'bebis-forstoppning', title: 'Förstoppning hos bebis' },
      { slug: 'bebis-spott-upp', title: 'Bebis som spottar upp' },
      { slug: 'bebis-utslag', title: 'Bebis med utslag' },
      { slug: 'bebis-allergier', title: 'Allergier hos bebis' },
      { slug: 'bebis-tandsprickning', title: 'Tandsprickning' },
      { slug: 'bebis-otitis', title: 'Öroninflammation' },
      { slug: 'bebis-gulsot', title: 'Gulsot hos nyfödd' },
    ],
  },
  somn: {
    title: 'Sömn',
    href: '/guider/somn/',
    children: [
      { slug: 'saker-sovmiljo', title: 'Säker sovmiljö' },
      { slug: 'sids-statistik', title: 'SIDS — statistik' },
      { slug: 'bebis-sovschema', title: 'Bebisens sovschema' },
      { slug: 'bebis-sovrutin', title: 'Bebisens sovrutin' },
      { slug: 'bebis-sover-daligt', title: 'Bebis som sover dåligt' },
      { slug: 'nattmatning-sluta', title: 'Sluta med nattmatning' },
    ],
  },
  'mat-och-amning': {
    title: 'Mat & amning',
    href: '/guider/mat-och-amning/',
    children: [
      { slug: 'amma-eller-flaska', title: 'Amma eller flaska?' },
      { slug: 'amning-tips', title: 'Amningstips' },
      { slug: 'nar-borjar-bebis-ata', title: 'När börjar bebisen äta?' },
      { slug: 'bebis-mat-4-manader', title: 'Bebismat — 4 månader' },
      { slug: 'introduktion-fast-foda', title: 'Introduktion till fast föda' },
      { slug: 'blw-guide', title: 'BLW-guide' },
    ],
  },
  utrustning: {
    title: 'Utrustning',
    href: '/guider/utrustning/',
    children: [
      { slug: 'valja-bilbarnstol', title: 'Välja bilbarnstol' },
      { slug: 'bilbarnstol-regler', title: 'Bilbarnstol — regler' },
      { slug: 'bakatvand-hur-lange', title: 'Bakåtvänd — hur länge?' },
      { slug: 'valja-barnvagn', title: 'Välja barnvagn' },
      { slug: 'valja-syskonvagn', title: 'Välja syskonvagn' },
      { slug: 'barnvagn-flyg', title: 'Barnvagn på flyget' },
      { slug: 'valja-babyvakt', title: 'Välja babyvakt' },
      { slug: 'valja-barsele', title: 'Välja bärsele' },
      { slug: 'valja-matstol', title: 'Välja matstol' },
    ],
  },
  forberedelser: {
    title: 'Förberedelser',
    href: '/guider/forberedelser/',
    children: [
      { slug: 'bebis-checklista', title: 'Bebis — checklista' },
      { slug: 'packlista-sjukhuset', title: 'Packlista till sjukhuset' },
      { slug: 'vad-behover-nyfodd', title: 'Vad behöver en nyfödd?' },
      { slug: 'graviditetsveckor', title: 'Graviditetsveckor' },
    ],
  },
} as const;

export type HubSlug = keyof typeof hubs;

const slugToHub = new Map<string, HubSlug>();
for (const [hubSlug, hub] of Object.entries(hubs)) {
  for (const child of hub.children) {
    if (!slugToHub.has(child.slug)) slugToHub.set(child.slug, hubSlug as HubSlug);
  }
}

export function findHubForSlug(slug: string) {
  const hubSlug = slugToHub.get(slug);
  if (!hubSlug) return null;
  return { hubSlug, ...hubs[hubSlug] };
}

export function getSlugFromPathname(pathname: string): string | null {
  const m = pathname.match(/^\/guider\/([^/]+)\/?$/);
  if (!m) return null;
  return decodeURIComponent(m[1]);
}
