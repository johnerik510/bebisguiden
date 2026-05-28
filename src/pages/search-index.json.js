export async function GET() {
  const pages = import.meta.glob('./**/*.astro', { eager: true });

  const categoryPages = [
    { title: 'Bilbarnstolar', description: 'Bästa bilbarnstolarna 2026. Bakåtvända, framåtvända och ISOFIX-modeller testade och rankade.', url: '/bilbarnstolar/', category: 'Kategori' },
    { title: 'Barnvagnar', description: 'Bästa barnvagnarna 2026. Duovagnar, sittvagnar, joggingvagnar och lättviktsvagnar testade.', url: '/barnvagnar/', category: 'Kategori' },
    { title: 'Babyvakter', description: 'Bästa babyvakterna 2026. WiFi, kamera, app och DECT-modeller testade.', url: '/babyvakter/', category: 'Kategori' },
    { title: 'Bärselen', description: 'Bästa bärselarna och babybärarna 2026. Ringslyngor, strukturerade och elastiska.', url: '/barselen/', category: 'Kategori' },
    { title: 'Matstolar', description: 'Bästa matstolarna för baby och barn 2026. Testade och rankade.', url: '/matstolar/', category: 'Kategori' },
    { title: 'Spjälsängar', description: 'Bästa spjälsängarna 2026. Säkerhet, sömn och komfort i fokus.', url: '/spjalsangar/', category: 'Kategori' },
    { title: 'Sovpåsar', description: 'Bästa sövsäckarna för baby 2026. Rätt tog-värde och säkra modeller.', url: '/sovsackar/', category: 'Kategori' },
    { title: 'Blöjor', description: 'Bästa blöjorna för baby 2026. Engångs och tygblöjor testade.', url: '/blojor/', category: 'Kategori' },
    { title: 'Leksaker', description: 'Bästa babyleksakerna 2026. Åldersanpassade och stimulerande leksaker.', url: '/leksaker/', category: 'Kategori' },
    { title: 'Badkar', description: 'Bästa babybadkaren 2026. Säkra och praktiska modeller testade.', url: '/badkar/', category: 'Kategori' },
    { title: 'Amning', description: 'Guider och produkter för amning. Bröstpumpar, amningskuddar och nappflaskor.', url: '/amning/', category: 'Kategori' },
    { title: 'Babykläder', description: 'Guide till babykläder. Vad behöver du och vad är värt pengarna?', url: '/babyklader/', category: 'Kategori' },
    { title: 'Säkerhet', description: 'Babysäkerhet i hemmet. Babygrindar, hörnskydd och barnsäkring.', url: '/sakerhet/', category: 'Kategori' },
    { title: 'Sterilisatorer', description: 'Bästa sterilisatorerna 2026. Ånga och UV-modeller testade.', url: '/sterilisatorer/', category: 'Kategori' },
    { title: 'Lära-gå-stolar', description: 'Bästa lära-gå-stolarna 2026. Säkra och stimulerande modeller.', url: '/lara-ga-stol/', category: 'Kategori' },
    { title: 'Babysitters', description: 'Bästa babysitters och bouncers 2026.', url: '/babysitter/', category: 'Kategori' },
    { title: 'Märken', description: 'Guide till de bästa babymärkena. Bugaboo, Britax Römer, Stokke och fler.', url: '/marken/', category: 'Kategori' },
    { title: 'Guider', description: 'Alla guider om graviditet, förlossning och de första åren med baby.', url: '/guider/', category: 'Guider' },
    { title: 'Alla kategorier', description: 'Komplett översikt över alla produktkategorier på Bebisguiden.', url: '/kategorier/', category: 'Kategori' },
  ];

  const articleItems = [];

  for (const [path, mod] of Object.entries(pages)) {
    const meta = mod.articleMeta;
    if (!meta || !meta.title) continue;

    const url = path
      .replace('./', '/')
      .replace('/index.astro', '/')
      .replace('.astro', '/');

    // Skip root index and system pages
    if (url === '/' || url.includes('rss') || url.includes('404')) continue;

    articleItems.push({
      title: meta.title,
      description: meta.description || '',
      url,
      category: meta.category || '',
    });
  }

  const all = [...categoryPages, ...articleItems];

  return new Response(JSON.stringify(all), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
