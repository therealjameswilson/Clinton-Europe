#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const REPORT_DIR = path.join(ROOT, "reports");

const COLLECTIONS = [
  {
    id: "255",
    type: "Memcon",
    title: "Memcons - Memoranda of Conversation",
    url: "https://clinton.presidentiallibraries.us/collections/show/255"
  },
  {
    id: "256",
    type: "Telcon",
    title: "Telcons - Memoranda of Telephone Conversations",
    url: "https://clinton.presidentiallibraries.us/collections/show/256"
  }
];

const VOLUME_XXII = "frus1993-00v22";
const VOLUME_XXIII = "frus1993-00v23";
const VOLUME_XXIV = "frus1993-00v24";

const COUNTRY_RULES = [
  {
    country: "United Kingdom",
    section: "United Kingdom",
    terms: [
      "United Kingdom",
      "Great Britain",
      "British",
      "Tony Blair",
      "Prime Minister Blair",
      "John Major",
      "David Trimble",
      "Gerry Adams",
      "Sinn Fein",
      "Northern Ireland",
      "Ireland"
    ]
  },
  {
    country: "France",
    section: "France",
    terms: ["France", "French", "Jacques Chirac", "President Chirac", "Francois Mitterrand", "Lionel Jospin"]
  },
  {
    country: "Germany",
    section: "Germany",
    terms: ["Germany", "German", "Helmut Kohl", "Chancellor Kohl", "Gerhard Schroeder", "Schroder", "Roman Herzog"]
  },
  {
    country: "Italy",
    section: "Italy",
    terms: ["Italy", "Italian", "Berlusconi", "Romano Prodi", "Lamberto Dini", "Massimo D'Alema", "Ciampi"]
  },
  {
    country: "NATO and EU",
    section: "NATO and EU",
    terms: [
      "NATO",
      "European Union",
      "European Community",
      "Europe",
      "Brussels",
      "G-7",
      "G7",
      "G-8",
      "G8",
      "OSCE",
      "CSCE",
      "Maastricht"
    ]
  },
  {
    country: "Balkans",
    section: "Balkans",
    terms: [
      "Bosnia",
      "Herzegovina",
      "Kosovo",
      "Serbia",
      "Yugoslav",
      "Milosevic",
      "Milos",
      "Tudjman",
      "Izetbegovic",
      "Croatia",
      "Macedonia",
      "Slovenia",
      "Albania",
      "Dayton"
    ]
  },
  {
    country: "Central Europe",
    section: "Central Europe",
    terms: [
      "Poland",
      "Walesa",
      "Kwasniewski",
      "Czech",
      "Vaclav Havel",
      "Hungary",
      "Slovakia",
      "Romania",
      "Bulgaria",
      "Baltic",
      "Latvia",
      "Estonia",
      "Lithuania"
    ]
  },
  {
    country: "Russia and FSU",
    section: "Russia and FSU Cross-Reference",
    terms: [
      "Russia",
      "Russian",
      "Boris Yeltsin",
      "Yeltsin",
      "Ukraine",
      "Ukrainian",
      "Leonid Kravchuk",
      "Kravchuk",
      "Leonid Kuchma",
      "Kuchma",
      "Belarus",
      "Moldova",
      "Georgia"
    ]
  }
];

const SECTION_PRIORITY = [
  "United Kingdom",
  "France",
  "Germany",
  "Italy",
  "NATO and EU",
  "Balkans",
  "Central Europe",
  "Russia and FSU Cross-Reference",
  "Regional"
];

const TOPIC_RULES = [
  ["NATO", ["NATO", "Partnership for Peace", "NATO enlargement"]],
  ["European Union", ["European Union", "European Community", "EU", "Maastricht"]],
  ["Bosnia", ["Bosnia", "Herzegovina", "Dayton"]],
  ["Kosovo", ["Kosovo"]],
  ["Northern Ireland", ["Northern Ireland", "Gerry Adams", "David Trimble", "Sinn Fein"]],
  ["G-7/G-8", ["G-7", "G7", "G-8", "G8"]],
  ["OSCE/CSCE", ["OSCE", "CSCE"]],
  ["Russia/FSU", ["Russia", "Yeltsin", "Ukraine", "Kravchuk", "Kuchma"]],
  ["High-level contact", ["President", "Prime Minister", "Chancellor", "King", "Foreign Minister"]]
];

function decodeEntities(value = "") {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&middot;/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#8220;/g, "\"")
    .replace(/&#8221;/g, "\"")
    .replace(/&#8217;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function stripTags(value = "") {
  return decodeEntities(value.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(href) {
  return new URL(href, "https://clinton.presidentiallibraries.us").href;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 FRUS-Clinton-Europe-Assister/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} ${response.statusText}: ${url}`);
  }
  return response.text();
}

async function fetchWithRetry(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchText(url);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 350));
    }
  }
  throw lastError;
}

function parseCollectionItems(html, collection) {
  return [...html.matchAll(/<h3><a href="([^"]+)" class="permalink">([\s\S]*?)<\/a><\/h3>/g)].map((match) => {
    const itemUrl = absoluteUrl(match[1]);
    const itemId = itemUrl.match(/items\/show\/(\d+)/)?.[1] || "";
    return {
      itemId,
      itemUrl,
      title: stripTags(match[2]),
      collectionId: collection.id,
      collection: collection.title,
      collectionUrl: collection.url,
      type: collection.type
    };
  });
}

function extractElementTexts(html, id) {
  const start = html.indexOf(`id="${id}"`);
  if (start === -1) return [];
  const next = html.indexOf('<div id="', start + 8);
  const block = html.slice(start, next === -1 ? html.length : next);
  return [...block.matchAll(/<div class="element-text">([\s\S]*?)<\/div>/g)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
}

function extractPdfUrl(html) {
  const iframe = html.match(/pdf-embed-js\/web\/viewer\.html\?file=([^"]+)/i);
  if (iframe) return decodeURIComponent(iframe[1]);
  const direct = html.match(/https:\/\/clinton\.presidentiallibraries\.us\/files\/original\/[^"]+?\.pdf/i);
  return direct ? direct[0] : "";
}

function parseDate(dateText) {
  if (!dateText) return "";
  const cleaned = dateText.replace(/\s+/g, " ").trim();
  const parsed = new Date(cleaned);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function includesTerm(haystack, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(haystack) || haystack.toLowerCase().includes(term.toLowerCase());
}

function inferCountriesAndSection(text) {
  const matches = COUNTRY_RULES.filter((rule) => rule.terms.some((term) => includesTerm(text, term)));
  const countries = matches.map((match) => match.country);
  const section =
    SECTION_PRIORITY.find((candidate) => matches.some((match) => match.section === candidate)) ||
    (matches.length ? matches[0].section : "Regional");
  return {
    countries: uniqueInOrder(countries),
    section
  };
}

function inferTopics(text, countries) {
  const topics = [];
  for (const [topic, terms] of TOPIC_RULES) {
    if (terms.some((term) => includesTerm(text, term))) topics.push(topic);
  }
  for (const country of countries) {
    if (!["NATO and EU", "Russia and FSU"].includes(country)) topics.push(country);
  }
  return uniqueInOrder(topics);
}

function policyVolumeForDate(date) {
  if (!date) return "";
  return date <= "1996-12-31" ? VOLUME_XXIII : VOLUME_XXIV;
}

function queuesFor(record) {
  const queues = ["source-note"];
  if (!record.pdfUrl) queues.push("pdf-missing");
  if (!record.date) queues.push("date-missing");
  if ((record.volumeIds || []).length > 1) queues.push("cross-volume");
  if (record.section === "Balkans") queues.push("balkans-volume-check");
  if (record.section === "Russia and FSU Cross-Reference") queues.push("russia-fsu-review");
  return uniqueInOrder(queues);
}

function uniqueInOrder(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function sectionRank(section) {
  const index = SECTION_PRIORITY.indexOf(section);
  return index === -1 ? SECTION_PRIORITY.length : index;
}

function buildSourceNote(record, partOf) {
  return [
    "Source: Clinton Digital Library, Declassified Documents",
    record.collection,
    partOf ? `release ${partOf}` : "",
    record.itemId ? `item ${record.itemId}` : ""
  ]
    .filter(Boolean)
    .join(", ")
    .concat(". PDF cover sheet, folder title, and archival path require compiler reconciliation.");
}

async function enrichItem(seed) {
  const html = await fetchWithRetry(seed.itemUrl);
  const title = extractElementTexts(html, "dublin-core-title")[0] || seed.title;
  const dateText = extractElementTexts(html, "dublin-core-date")[0] || "";
  const partOf = extractElementTexts(html, "dublin-core-is-part-of")[0] || "";
  const subjects = uniqueInOrder(extractElementTexts(html, "dublin-core-subject"));
  const pdfUrl = extractPdfUrl(html);
  const date = parseDate(dateText);
  const text = [title, dateText, partOf, subjects.join(" ")].join(" ");
  const { countries, section } = inferCountriesAndSection(text);
  const topics = inferTopics(text, countries);
  const policyVolumeId = policyVolumeForDate(date);
  const volumeIds = uniqueInOrder([VOLUME_XXII, policyVolumeId]);

  const record = {
    id: `clinton-dl-${seed.itemId}`,
    itemId: seed.itemId,
    title,
    type: seed.type,
    date,
    sortDate: date,
    dateText,
    collection: seed.collection,
    collectionId: seed.collectionId,
    collectionUrl: seed.collectionUrl,
    itemUrl: seed.itemUrl,
    pdfUrl,
    releaseStatus: "Declassified",
    countries,
    section,
    volumeIds,
    policyVolumeId,
    subjects,
    topics,
    source: {
      name: "William J. Clinton Presidential Library & Museum",
      series: seed.collection,
      url: seed.itemUrl,
      collectionId: seed.collectionId,
      itemId: seed.itemId
    },
    sourceNote: "",
    notes: `Harvested from the Clinton Digital Library ${seed.collection.toLowerCase()} collection.`
  };
  record.sourceNote = buildSourceNote(record, partOf);
  record.queues = queuesFor(record);
  return record;
}

function isEuropeRelevant(record) {
  if (record.countries?.length) return true;
  const text = [record.title, ...(record.subjects || [])].join(" ");
  return COUNTRY_RULES.some((rule) => rule.terms.some((term) => includesTerm(text, term)));
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(REPORT_DIR, { recursive: true });

  const seeds = [];
  for (const collection of COLLECTIONS) {
    const html = await fetchWithRetry(collection.url);
    seeds.push(...parseCollectionItems(html, collection));
  }

  const records = [];
  const failures = [];
  const batchSize = 8;
  for (let index = 0; index < seeds.length; index += batchSize) {
    const batch = seeds.slice(index, index + batchSize);
    const results = await Promise.allSettled(batch.map(enrichItem));
    for (const result of results) {
      if (result.status === "fulfilled") {
        if (isEuropeRelevant(result.value)) records.push(result.value);
      } else {
        failures.push(result.reason.message);
      }
    }
  }

  records.sort(
    (a, b) =>
      sectionRank(a.section) - sectionRank(b.section) ||
      (a.sortDate || "").localeCompare(b.sortDate || "") ||
      a.title.localeCompare(b.title)
  );

  await fs.writeFile(path.join(DATA_DIR, "records.json"), `${JSON.stringify(records, null, 2)}\n`);
  await fs.writeFile(path.join(DATA_DIR, "records.js"), `window.CLINTON_EUROPE_RECORDS = ${JSON.stringify(records, null, 2)};\n`);

  const report = {
    generatedAt: new Date().toISOString(),
    collections: COLLECTIONS.map((collection) => ({
      id: collection.id,
      title: collection.title,
      url: collection.url,
      type: collection.type
    })),
    collectionItemCount: seeds.length,
    europeRelevantCount: records.length,
    missingPdfCount: records.filter((record) => !record.pdfUrl).length,
    missingDateCount: records.filter((record) => !record.date).length,
    failures
  };
  await fs.writeFile(path.join(REPORT_DIR, "clinton-digital-library-harvest.json"), `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Harvested ${records.length} Europe-relevant records from ${seeds.length} Clinton Digital Library items.`);
  if (failures.length) {
    console.log(`${failures.length} item fetches failed. See reports/clinton-digital-library-harvest.json.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
