#!/usr/bin/env node

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(__dirname, "..");
const REPORT_DIR = path.join(ROOT, "reports");
const COLLECTION_URL = "https://clinton.presidentiallibraries.us/collections/show/84";
const BROWSE_URL =
  "https://clinton.presidentiallibraries.us/items/browse?collection=84&sort_field=Dublin+Core%2CDate&sort_dir=a&page=1";
const NARA_SEARCH_URL = "https://catalog.archives.gov/search?q=%222010-0083-F%22&collectionIdentifier=WJC*";
const CACHE_DIR = path.join(os.tmpdir(), "clinton-europe-presidential-daily-diary");

const VOLUMES = {
  v22: {
    id: "frus1993-00v22",
    label: "Volume XXII",
    title: "Europe: High-Level Contacts",
    url: "https://history.state.gov/historicaldocuments/frus1993-00v22"
  },
  v23: {
    id: "frus1993-00v23",
    label: "Volume XXIII",
    title: "Europe: Policy, 1993-1996",
    url: "https://history.state.gov/historicaldocuments/frus1993-00v23"
  },
  v24: {
    id: "frus1993-00v24",
    label: "Volume XXIV",
    title: "Europe: Policy, 1997-2000",
    url: "https://history.state.gov/historicaldocuments/frus1993-00v24"
  }
};

const MONTHS = {
  JANUARY: 1,
  FEBRUARY: 2,
  MARCH: 3,
  APRIL: 4,
  MAY: 5,
  JUNE: 6,
  JULY: 7,
  AUGUST: 8,
  SEPTEMBER: 9,
  OCTOBER: 10,
  NOVEMBER: 11,
  DECEMBER: 12
};

const SECTION_RULES = [
  {
    section: "Western Europe Bilateral",
    terms: [
      ["John Major", /\bJohn\s+Major\b|\bPrime Minister Major\b/i],
      ["Tony Blair", /\bTony\s+Blair\b|\bPrime Minister Blair\b/i],
      ["United Kingdom", /\bUnited Kingdom\b|\bGreat Britain\b|\bBritish\b|\bBritain\b/i],
      ["Jacques Chirac", /\bJacques\s+Chirac\b|\bPresident Chirac\b/i],
      ["France", /\bFrance\b|\bFrench\b|\bParis\b/i],
      ["Helmut Kohl", /\bHelmut\s+Kohl\b|\bChancellor Kohl\b/i],
      ["Gerhard Schroeder", /\bGerhard\s+Schro(?:e)?der\b|\bChancellor Schro(?:e)?der\b/i],
      ["Germany", /\bGermany\b|\bGerman\b|\bBonn\b|\bBerlin\b/i],
      ["Massimo D'Alema", /\bMassimo\s+D['\u2019]?Alema\b|\bD['\u2019]?Alema\b/i],
      ["Romano Prodi", /\bRomano\s+Prodi\b|\bPrime Minister Prodi\b/i],
      ["Italy", /\bItaly\b|\bItalian\b|\bFlorence\b|\bRome\b/i],
      ["Jose Maria Aznar", /\bJos(?:e|\u00e9)\s+Mar(?:i|\u00ed)a\s+Aznar\b|\bAznar\b/i],
      ["Spain", /\bSpain\b|\bSpanish\b|\bMadrid\b/i],
      ["Bertie Ahern", /\bBertie\s+Ahern\b|\bPrime Minister Ahern\b/i],
      ["John Bruton", /\bJohn\s+Bruton\b|\bPrime Minister Bruton\b/i],
      ["Northern Ireland", /\bNorthern Ireland\b|\bGood Friday Agreement\b|\bTrimble\b|\bSinn Fein\b|\bGerry Adams\b/i],
      ["Ireland", /\bIreland\b|\bIrish\b|\bDublin\b/i],
      ["Greece", /\bGreece\b|\bGreek\b|\bAthens\b|\bSimitis\b/i]
    ]
  },
  {
    section: "NATO and European Security",
    terms: [
      ["NATO", /\bNATO\b|\bNATO-led\b|\bNorth Atlantic Treaty Organization\b/i],
      ["NATO enlargement", /\bNATO enlargement\b|\bNATO expansion\b|\benlargement of NATO\b/i],
      ["Partnership for Peace", /\bPartnership for Peace\b|\bPFP\b/i],
      ["Javier Solana", /\bJavier\s+Solana\b|\bSolana\b/i],
      ["George Robertson", /\bGeorge\s+Robertson\b|\bLord Robertson\b|\bRobertson\b/i],
      ["Supreme Allied Commander Europe", /\bSupreme Allied Commander,?\s+Europe\b|\bSACEUR\b/i],
      ["European security", /\bEuropean security\b|\bEuro-Atlantic\b|\btransatlantic\b/i],
      ["Madrid Summit", /\bMadrid Summit\b/i],
      ["Helsinki Summit", /\bHelsinki Summit\b/i]
    ]
  },
  {
    section: "Balkans and Kosovo",
    terms: [
      ["Bosnia", /\bBosnia\b|\bSarajevo\b|\bDayton\b|\bSFOR\b|\bIFOR\b/i],
      ["Kosovo", /\bKosovo\b|\bKFOR\b|\bPristina\b|\bUrosovec\b|\bFerizaj\b|\bKosovar\b/i],
      ["Serbia/Yugoslavia", /\bSerbia\b|\bSerbian\b|\bYugoslav(?:ia)?\b|\bMilosevic\b/i],
      ["Croatia", /\bCroatia\b|\bCroatian\b|\bTudjman\b/i],
      ["Albania", /\bAlbania\b|\bAlbanian\b/i],
      ["Bulgaria", /\bBulgaria\b|\bBulgarian\b|\bSofia\b|\bSophia\b/i],
      ["Southeastern Europe", /\bSoutheastern Europe\b|\bBalkans\b/i]
    ]
  },
  {
    section: "Central and Eastern Europe",
    terms: [
      ["Poland", /\bPoland\b|\bPolish\b|\bKwasniewski\b|\bWalesa\b|\bWarsaw\b/i],
      ["Czech Republic", /\bCzech\b|\bHavel\b|\bPrague\b/i],
      ["Hungary", /\bHungary\b|\bHungarian\b|\bBudapest\b/i],
      ["Romania", /\bRomania\b|\bRomanian\b|\bBucharest\b|\bConstantinescu\b/i],
      ["Ukraine", /\bUkraine\b|\bUkrainian\b|\bKuchma\b|\bKyiv\b|\bKiev\b/i],
      ["Baltics", /\bBaltic\b|\bLithuania\b|\bLatvia\b|\bEstonia\b|\bVilnius\b|\bRiga\b|\bTallinn\b/i],
      ["Slovakia/Slovenia", /\bSlovak(?:ia)?\b|\bSloven(?:e|ia)\b/i]
    ]
  },
  {
    section: "EU, OSCE, and Summits",
    terms: [
      ["European Union", /\bEuropean Union\b|\bE\.U\.\b|\b EU\b/i],
      ["OSCE/CSCE", /\bOSCE\b|\bCSCE\b/i],
      ["G-7/G-8", /\bG-7\b|\bG7\b|\bG-8\b|\bG8\b|\bGroup of Seven\b|\bGroup of Eight\b/i],
      ["European Council", /\bEuropean Council\b/i],
      ["Progressive Governance", /\bProgressive Governance\b/i]
    ]
  },
  {
    section: "Russia Cross-Reference",
    terms: [
      ["Boris Yeltsin", /\bBoris\s+Yeltsin\b|\bPresident Yeltsin\b/i],
      ["Vladimir Putin", /\bVladimir\s+Putin\b|\bPresident Putin\b|\bPrime Minister Putin\b/i],
      ["Russia", /\bRussia\b|\bRussian\b|\bMoscow\b|\bKremlin\b/i],
      ["Viktor Chernomyrdin", /\bChernomyrdin\b/i],
      ["Yevgeny Primakov", /\bPrimakov\b/i]
    ]
  }
];

const EVENT_RULES = [
  ["telephone call", /\btelephoned\b|\btelephone call\b|\bplaced the following telephone calls\b|\bwas telephoned by\b|\bspoke by telephone\b|\bspoke with\b/i],
  ["meeting", /\bmet with\b|\bparticipated in a meeting\b|\battended a meeting\b|\bmeeting with\b|\bbilateral meeting\b|\bheld a meeting\b/i],
  ["working meal", /\bworking luncheon\b|\bworking lunch\b|\bworking dinner\b|\bdinner with\b|\bluncheon with\b/i],
  ["summit/session", /\bsummit\b|\bconference session\b|\bsession of the\b|\battended Session\b|\bparticipated in Session\b/i]
];

const HIGH_LEVEL_TERMS = [
  /\bPresident\s+(?:Yeltsin|Chirac|Putin|Kuchma|Havel|Kwasniewski|Constantinescu|Tudjman|Milosevic)\b/i,
  /\bPresident of (?:Russia|France|Ukraine|Poland|Romania|Croatia|Serbia|Yugoslavia|the Czech Republic)\b/i,
  /\bPrime Minister\b/i,
  /\bChancellor\b/i,
  /\bTaoiseach\b/i,
  /\bForeign Minister\b/i,
  /\bSecretary General\b/i,
  /\bSupreme Allied Commander\b/i,
  /\bGeneral Secretary\b/i,
  /\bleaders?\b/i
];

const PERSONAL_OR_TROOP_CALL_NOISE =
  /\bmother of\b|\bfather of\b|\bfamily of\b|\bCoast Guard\b|\bCamp Hovey\b|\bInfantry\b|\bBattalion\b|\bLCPL\b|\bSGT\b|\bSgt\.\b|\bMST2\b|\bHHC\b|\bTask Force\b|\bChristmas\b|\bholiday\b/i;

const APPENDIX_HEADING = /^\s*(?:[A-Z][A-Z\s.,'"()-]+)?\bAPPENDIX\b/;

function decodeHtml(value) {
  return `${value || ""}`
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, "\"")
    .replace(/&#8216;|&#8217;|&lsquo;|&rsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&middot;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return decodeHtml(`${value || ""}`.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function uniq(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function isoDate(month, day, year) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateLine(line) {
  const match = line.match(
    /\b(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2})\s*,?\s+(199[3-9]|2000)\b/i
  );
  if (!match) return "";
  return isoDate(MONTHS[match[1].toUpperCase()], Number(match[2]), match[3]);
}

function formatDate(dateString) {
  if (!dateString) return "Date pending";
  const date = new Date(`${dateString}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function volumeFromDate(dateString) {
  const year = Number(dateString?.slice(0, 4));
  if (!year) return [];
  return [year <= 1996 ? VOLUMES.v23 : VOLUMES.v24];
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Clinton-Europe FRUS assister research crawler"
    }
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status}: ${url}`);
  return response.text();
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Clinton-Europe FRUS assister research crawler"
    }
  });
  if (!response.ok) throw new Error(`Download failed ${response.status}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function runWithLimit(tasks, limit = 4) {
  const queue = [...tasks];
  const results = [];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const task = queue.shift();
      results.push(await task());
    }
  });
  await Promise.all(workers);
  return results;
}

function parseBrowseItems(html) {
  return [...html.matchAll(/<h2><a href="\/items\/show\/(\d+)" class="permalink">([\s\S]*?)<\/a><\/h2>/g)]
    .map((match) => ({
      itemId: match[1],
      itemUrl: `https://clinton.presidentiallibraries.us/items/show/${match[1]}`,
      title: stripTags(match[2])
    }));
}

function extractElementTexts(html, label) {
  const marker = new RegExp(`<h3>\\s*${label}\\s*<\\/h3>`, "i");
  const match = marker.exec(html);
  if (!match) return [];
  const rest = html.slice(match.index + match[0].length);
  const nextHeading = rest.search(/<h3>/i);
  const block = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  return [...block.matchAll(/<div class="element-text">([\s\S]*?)<\/div>/g)]
    .map((textMatch) => stripTags(textMatch[1]))
    .filter(Boolean);
}

function parsePdfUrl(html) {
  const viewerMatch = html.match(/viewer\.html\?file=([^"]+?\.pdf)/i);
  if (viewerMatch) return decodeURIComponent(viewerMatch[1]);
  const directMatch = html.match(/https?:\/\/[^"']+?\/files\/original\/[^"']+?\.pdf/i);
  return directMatch ? directMatch[0] : "";
}

function catalogNaid(catalogUrl) {
  return catalogUrl.match(/\/id\/(\d+)/)?.[1] || "";
}

function parseItemPage(html, item) {
  const title = extractElementTexts(html, "Title")[0] || item.title;
  const identifiers = extractElementTexts(html, "Identifier");
  const isPartOf = extractElementTexts(html, "Is Part Of");
  const box = isPartOf.find((value) => /^Box\s+\d+/i.test(value)) || "";
  const catalogUrl = html.match(/https?:\/\/catalog\.archives\.gov\/id\/\d+/i)?.[0] || "";
  const findingAidUrl = html.match(/https?:\/\/clinton\.presidentiallibraries\.us\/items\/show\/\d+/i)?.[0] || "";
  const pdfUrl = parsePdfUrl(html);
  return {
    ...item,
    title,
    identifier: identifiers[0] || "",
    box,
    catalogUrl,
    catalogNaid: catalogNaid(catalogUrl),
    findingAidUrl,
    pdfUrl
  };
}

function pdfCachePath(item) {
  const basename = `${item.itemId}-${path.basename(new URL(item.pdfUrl).pathname)}`;
  return path.join(CACHE_DIR, basename);
}

async function ensurePdf(item) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const filePath = pdfCachePath(item);
  try {
    const stat = await fs.stat(filePath);
    if (stat.size > 0) return filePath;
  } catch {
    // Cache miss.
  }
  const buffer = await fetchBuffer(item.pdfUrl);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

async function pdfText(filePath) {
  const { stdout } = await execFileAsync("pdftotext", ["-layout", filePath, "-"], {
    maxBuffer: 80 * 1024 * 1024
  });
  return stdout;
}

function parseEvents(text) {
  const events = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let currentDate = "";
  let current = null;

  function flush() {
    if (current && current.lines.length) events.push(current);
    current = null;
  }

  for (const line of lines) {
    const date = parseDateLine(line);
    if (date) {
      if (current && current.date && current.date !== date && current.lines.length) flush();
      currentDate = date;
      if (current && !current.date) current.date = date;
    }

    const entryMatch = line.trim().match(/^(\d{4,6})$/);
    if (entryMatch) {
      flush();
      current = {
        entryId: entryMatch[1],
        date: currentDate,
        lines: []
      };
      continue;
    }

    const inlineEntryMatch = line.match(/^\s*(\d{4,6})\s+(.+)$/);
    if (inlineEntryMatch && /^(?:\d{1,2}\s*:|\d{1,2}\s*\?|[PR]\b|The President\b)/i.test(inlineEntryMatch[2].trim())) {
      flush();
      current = {
        entryId: inlineEntryMatch[1],
        date: currentDate,
        lines: [inlineEntryMatch[2]]
      };
      continue;
    }

    if (APPENDIX_HEADING.test(line)) {
      flush();
      continue;
    }

    if (current) current.lines.push(line);
  }
  flush();
  return events;
}

function cleanEventText(event) {
  const kept = [];
  for (const line of event.lines) {
    if (APPENDIX_HEADING.test(line)) break;
    if (/^\s*(?:Page\s+\d+|continued)\s*$/i.test(line)) continue;
    if (/^\s*COLLECTION:|^\s*FOLDER TITLE:|^\s*RESTRICTION CODES/i.test(line)) continue;
    kept.push(line);
  }
  return kept
    .join(" ")
    .replace(/\f/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function matchedEventTypes(text) {
  return EVENT_RULES.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function matchSections(text) {
  const hits = [];
  for (const rule of SECTION_RULES) {
    const labels = rule.terms.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
    if (labels.length) hits.push({ section: rule.section, labels });
  }
  return hits;
}

function hasHighLevelContact(text, sectionHits) {
  return (
    HIGH_LEVEL_TERMS.some((pattern) => pattern.test(text)) &&
    sectionHits.some((hit) => hit.section !== "EU, OSCE, and Summits" || hit.labels.some((label) => label !== "Progressive Governance"))
  );
}

function scoreEvent(text, eventTypes, sectionHits, highLevelContact) {
  let score = 0;
  score += 28;
  score += Math.min(24, sectionHits.length * 8);
  score += Math.min(22, sectionHits.flatMap((hit) => hit.labels).length * 3);
  score += eventTypes.includes("telephone call") ? 12 : 0;
  score += eventTypes.includes("meeting") ? 12 : 0;
  score += eventTypes.includes("working meal") ? 8 : 0;
  score += eventTypes.includes("summit/session") ? 6 : 0;
  score += highLevelContact ? 14 : 0;
  score += /\bNATO\b|\bKosovo\b|\bBosnia\b|\bDayton\b/i.test(text) ? 8 : 0;
  score += /\bEuropean Affairs\b/i.test(text) && sectionHits.flatMap((hit) => hit.labels).length <= 1 ? -12 : 0;
  score -= /\bwake up call\b/i.test(text) ? 35 : 0;
  score -= PERSONAL_OR_TROOP_CALL_NOISE.test(text) ? 28 : 0;
  return score;
}

function priority(score) {
  if (score >= 72) return "high";
  if (score >= 52) return "medium";
  return "review";
}

function summarizeEvent(text) {
  const presidentIndex = text.search(/\bThe President\b/i);
  const clipped = presidentIndex >= 0 ? text.slice(presidentIndex) : text;
  return clipped
    .replace(/\bFor a list of (?:attendees|passengers),?\s+see APPENDIX "?[A-Z]"?\.?/i, "For attendees, see the diary appendix.")
    .slice(0, 360)
    .trim();
}

function sourceNote(item, event) {
  const parts = [
    "Clinton Presidential Records",
    "Presidential Daily Diary",
    "Ellen McCathran",
    item.box,
    item.identifier,
    event.date ? formatDate(event.date) : "",
    event.entryId ? `Diary entry ${event.entryId}` : ""
  ].filter(Boolean);
  const catalog = item.catalogNaid ? ` NARA Catalog ID ${item.catalogNaid}.` : "";
  return `${parts.join(", ")}.${catalog} Clinton Digital Library item ${item.itemId}.`;
}

function candidateTitle(item, event, eventTypes, sectionHits) {
  const labels = uniq(sectionHits.flatMap((hit) => hit.labels));
  const action = eventTypes[0] || "Daily Diary event";
  const date = event.date ? formatDate(event.date) : item.title;
  return `Presidential Daily Diary ${action}: ${date}${labels.length ? ` - ${labels.slice(0, 3).join(", ")}` : ""}`;
}

function suggestedVolumes(event, highLevelContact) {
  return uniq([...(highLevelContact ? [VOLUMES.v22] : []), ...volumeFromDate(event.date)]).map((volume) => volume.label);
}

function candidateForEvent(item, event) {
  const text = cleanEventText(event);
  const eventTypes = matchedEventTypes(text);
  if (!eventTypes.length) return null;

  const sectionHits = matchSections(text);
  if (!sectionHits.length) return null;

  const highLevelContact = hasHighLevelContact(text, sectionHits);
  const score = scoreEvent(text, eventTypes, sectionHits, highLevelContact);
  const sections = uniq(sectionHits.map((hit) => hit.section));
  const labels = uniq(sectionHits.flatMap((hit) => hit.labels));

  return {
    candidateId: `pdd-${item.itemId}-${event.entryId || "entry"}-${event.date || "undated"}`,
    id: `pdd-${item.itemId}-${event.entryId || "entry"}-${event.date || "undated"}`,
    itemId: item.itemId,
    entryId: event.entryId,
    title: candidateTitle(item, event, eventTypes, sectionHits),
    date: event.date || "",
    identifier: `${item.identifier}${event.entryId ? ` diary entry ${event.entryId}` : ""}`,
    catalogNaid: item.catalogNaid,
    catalogUrl: item.catalogUrl,
    sourceUrl: item.itemUrl,
    itemUrl: item.itemUrl,
    pdfUrl: item.pdfUrl,
    findingAidUrl: item.findingAidUrl,
    box: item.box,
    sourceNote: sourceNote(item, event),
    descriptionExcerpt: summarizeEvent(text),
    score,
    priority: priority(score),
    suggestedVolumes: suggestedVolumes(event, highLevelContact),
    sections,
    matchedQueries: [
      `Presidential Daily Diary ${item.identifier}`,
      ...eventTypes.map((type) => `Diary ${type}`),
      ...labels
    ],
    rationale: [
      `Daily Diary entry records a ${eventTypes.join("/")} involving ${labels.slice(0, 5).join(", ")}.`,
      highLevelContact ? "Potential Volume XXII cross-reference because the entry records a high-level contact." : ""
    ].filter(Boolean),
    sourceCollection: "Ellen McCathran - Presidential Diarist",
    itemTitle: item.title
  };
}

function byScoreDateTitle(a, b) {
  return (
    b.score - a.score ||
    (a.date || "9999").localeCompare(b.date || "9999") ||
    a.title.localeCompare(b.title)
  );
}

function countBy(items, getter) {
  const counts = {};
  for (const item of items) {
    const values = getter(item);
    for (const value of Array.isArray(values) ? values : [values]) {
      if (!value) continue;
      counts[value] = (counts[value] || 0) + 1;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function escapePipe(value) {
  return `${value || ""}`.replaceAll("|", "\\|");
}

function candidateLine(candidate) {
  return `| ${candidate.priority} | ${candidate.score} | ${candidate.date || ""} | ${escapePipe(candidate.suggestedVolumes.join(" + "))} | ${escapePipe(candidate.sections.join(", "))} | ${escapePipe(candidate.identifier)} | [${escapePipe(candidate.title)}](${candidate.sourceUrl}) |`;
}

function buildMarkdown(report) {
  const high = report.candidates.filter((candidate) => candidate.priority === "high");
  const medium = report.candidates.filter((candidate) => candidate.priority === "medium");
  const lines = [
    "# Presidential Daily Diary Europe Candidates",
    "",
    `Source collection: ${COLLECTION_URL}`,
    `NARA search requested: ${NARA_SEARCH_URL}`,
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Clinton Library items reviewed: ${report.itemsReviewed}`,
    `- PDFs text-extracted: ${report.pdfsExtracted}`,
    `- Diary entries scanned: ${report.entriesScanned}`,
    `- FRUS Europe call/meeting candidates retained: ${report.candidates.length}`,
    `- High-priority candidates: ${high.length}`,
    `- Medium-priority candidates: ${medium.length}`,
    "",
    "## Identifier Counts",
    "",
    ...Object.entries(report.identifierCounts).map(([identifier, count]) => `- ${identifier}: ${count}`),
    "",
    "## Section Counts",
    "",
    ...Object.entries(report.sectionCounts).map(([section, count]) => `- ${section}: ${count}`),
    "",
    "## Top Candidates",
    "",
    "| Priority | Score | Date | Suggested FRUS volume | Section | Identifier | Title |",
    "| --- | ---: | --- | --- | --- | --- | --- |",
    ...[...high, ...medium].map(candidateLine),
    "",
    "## Notes",
    "",
    "- The Daily Diary is a reference layer: use these entries to confirm dates, times, participants, and whether a matching telcon/memcon/source document should be pulled.",
    "- Candidate priority is a triage score for compiler review, not a final FRUS selection decision.",
    "- Catalog pages can block automated browsing, so this run uses the Clinton Digital Library item pages and original PDFs while preserving the NARA catalog identifiers present on those item pages."
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 0;
  const identifierArg = process.argv.find((arg) => arg.startsWith("--identifier="));
  const identifierFilter = identifierArg ? identifierArg.split("=")[1] : "";

  const browseHtml = await fetchText(BROWSE_URL);
  let items = parseBrowseItems(browseHtml);
  if (limit) items = items.slice(0, limit);

  console.log(`Found ${items.length} Presidential Daily Diary item pages.`);
  const detailedItems = await runWithLimit(
    items.map((item, index) => async () => {
      const html = await fetchText(item.itemUrl);
      const parsed = parseItemPage(html, item);
      console.log(`Parsed item ${index + 1}/${items.length}: ${parsed.itemId} ${parsed.identifier}`);
      return parsed;
    }),
    5
  );

  const searchableItems = detailedItems
    .filter((item) => item.pdfUrl)
    .filter((item) => !identifierFilter || item.identifier === identifierFilter);

  let entriesScanned = 0;
  const candidates = [];
  const extractionErrors = [];

  await runWithLimit(
    searchableItems.map((item, index) => async () => {
      try {
        const filePath = await ensurePdf(item);
        const text = await pdfText(filePath);
        const events = parseEvents(text);
        entriesScanned += events.length;
        for (const event of events) {
          const candidate = candidateForEvent(item, event);
          if (candidate) candidates.push(candidate);
        }
        console.log(`Scanned PDF ${index + 1}/${searchableItems.length}: ${item.itemId} (${events.length} diary entries)`);
      } catch (error) {
        extractionErrors.push({ itemId: item.itemId, itemUrl: item.itemUrl, pdfUrl: item.pdfUrl, error: error.message });
        console.warn(`Could not scan ${item.itemId}: ${error.message}`);
      }
    }),
    3
  );

  const retained = candidates
    .filter((candidate) => candidate.score >= 42)
    .sort(byScoreDateTitle);
  const report = {
    generatedAt: new Date().toISOString(),
    collectionUrl: COLLECTION_URL,
    browseUrl: BROWSE_URL,
    naraSearchUrl: NARA_SEARCH_URL,
    itemsFound: items.length,
    itemsReviewed: detailedItems.length,
    pdfsExtracted: searchableItems.length - extractionErrors.length,
    entriesScanned,
    candidateCount: retained.length,
    identifierCounts: countBy(retained, (item) => item.identifier.split(" diary entry ")[0]),
    priorityCounts: countBy(retained, (item) => item.priority),
    sectionCounts: countBy(retained, (item) => item.sections),
    volumeCounts: countBy(retained, (item) => item.suggestedVolumes),
    extractionErrors,
    candidates: retained
  };

  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(path.join(REPORT_DIR, "presidential-daily-diary-candidates.json"), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(REPORT_DIR, "presidential-daily-diary-candidates.md"), buildMarkdown(report));

  console.log(`Scanned ${entriesScanned} diary entries from ${report.pdfsExtracted} PDFs.`);
  console.log(`Retained ${retained.length} Presidential Daily Diary candidates.`);
  console.log(`High priority: ${report.priorityCounts.high || 0}. Medium priority: ${report.priorityCounts.medium || 0}.`);
  console.log("Wrote reports/presidential-daily-diary-candidates.json and reports/presidential-daily-diary-candidates.md.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
