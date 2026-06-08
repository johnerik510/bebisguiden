// AUTO-GENERATED from Adtraction product feeds. DO NOT EDIT MANUALLY.
// Source: /tmp/lookups/bebis_*.json (parsed from /tmp/feeds/bebis_*.xml)
// Generated: 2026-05-12
// Total entries: 260859
// Feed-files: addrevenue.json (19602), jollyroom.json (54430), babysam.json (27603), baby_v.json (6392), leksaksaff_ren.json (11134), partykungen.json (39414), babyland.json (6351), stor_liten.json (4988), polarn_o_pyret.json (706), xplora.json (17)
// Bookbeat borttagen 2026-05-14, ej relevant för bebis-niche.
// strolee.json (14) tillagd 2026-06-08, Addrevenue-feed a=988093 (Strolee shoppingvagn + tillbehör). Manuellt inlagd, ej via build-script (skulle annars radera övriga feeds som saknar lookup i /tmp).
//
// To regenerate:
//   1. Download new feeds to /tmp/feeds/bebis_<brand>.xml
//   2. node /Users/axeljonemyr/Documents/scripts/parse-all-feeds.mjs
//   3. node /Users/axeljonemyr/Documents/scripts/build-feed-matches.mjs bebis /Users/axeljonemyr/Documents/bebisguiden/src/data/feed-matches.ts

import f1 from './feed-matches/addrevenue.json' with { type: 'json' };
import f2 from './feed-matches/jollyroom.json' with { type: 'json' };
import f3 from './feed-matches/babysam.json' with { type: 'json' };
import f4 from './feed-matches/baby_v.json' with { type: 'json' };
import f5 from './feed-matches/leksaksaff_ren.json' with { type: 'json' };
import f6 from './feed-matches/partykungen.json' with { type: 'json' };
import f7 from './feed-matches/babyland.json' with { type: 'json' };
import f8 from './feed-matches/stor_liten.json' with { type: 'json' };
import f9 from './feed-matches/polarn_o_pyret.json' with { type: 'json' };
import f10 from './feed-matches/xplora.json' with { type: 'json' };
import f11 from './feed-matches/strolee.json' with { type: 'json' };

export interface FeedMatch {
  title: string;
  brand: string;
  price: string;
  sku: string;
  productUrl: string;
  trackedUrl: string;
  image: string;
  feedSource: string;
}

export const FEED_MATCHES: Record<string, FeedMatch> = Object.assign(
  {} as Record<string, FeedMatch>,
  f1 as Record<string, FeedMatch>,
  f2 as Record<string, FeedMatch>,
  f3 as Record<string, FeedMatch>,
  f4 as Record<string, FeedMatch>,
  f5 as Record<string, FeedMatch>,
  f6 as Record<string, FeedMatch>,
  f7 as Record<string, FeedMatch>,
  f8 as Record<string, FeedMatch>,
  f9 as Record<string, FeedMatch>,
  f10 as Record<string, FeedMatch>,
  f11 as Record<string, FeedMatch>,
);

export function findFeedMatch(brand: string, title: string): FeedMatch | undefined {
  return FEED_MATCHES[`${brand}||${title}`];
}

export function findByBrand(brand: string): FeedMatch[] {
  return Object.values(FEED_MATCHES).filter((m) => m.brand === brand);
}

export function findByTitleSubstring(brand: string, titleFragment: string): FeedMatch[] {
  const lower = titleFragment.toLowerCase();
  return Object.values(FEED_MATCHES).filter(
    (m) => m.brand === brand && m.title.toLowerCase().includes(lower)
  );
}
