#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const REPORT_DIR = path.join(ROOT, "reports");
const PROXY_URL = "https://nara-proxy.mzqmpgyvdv.workers.dev";
const NARA_PATH = "/records/search";
const API_KEY = "C6O0DyEcap6taVb24zymF5AOMQvwTXsa7q0ZH8cN";
const ROOT_NAID = "7388808";
const SOURCE_SEARCH_URL = "https://catalog.archives.gov/search-within/7388808";
const EUROPE_SEARCH_URL =
  "https://catalog.archives.gov/search-within/7388808?availableOnline=true&q=Europe&typeOfMaterials=Textual%20Records";

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

const QUERY_PACKS = [
  {
    volume: "all",
    label: "All descendant descriptions",
    queries: [""],
    allRecords: true
  },
  {
    volume: "all",
    label: "Catalog Europe search",
    queries: ["Europe"],
    availableOnline: true,
    typeOfMaterials: "Textual Records"
  },
  {
    volume: "v22",
    label: "High-level contacts",
    queries: ["summit", "bilateral", "POTUS Europe", "Chirac", "Kohl", "Major", "Blair", "Yeltsin", "Solana"]
  },
  {
    volume: "v23",
    label: "Policy, 1993-1996",
    queries: [
      "NATO",
      "Bosnia",
      "Dayton",
      "Partnership for Peace",
      "CSCE",
      "OSCE",
      "European Union",
      "Poland",
      "Ukraine",
      "Romania"
    ]
  },
  {
    volume: "v24",
    label: "Policy, 1997-2000",
    queries: ["Kosovo", "NATO enlargement", "Founding Act", "Madrid", "Helsinki", "ESDP", "KFOR", "Robertson"]
  },
  {
    volume: "all",
    label: "Western Europe bilateral",
    queries: ["France", "Germany", "United Kingdom", "Italy", "Spain", "Northern Ireland"]
  }
];

const SECTION_RULES = [
  {
    section: "NATO and European Security",
    terms: [
      "NATO",
      "PARTNERSHIP FOR PEACE",
      "PFP",
      "ENLARGEMENT",
      "EXPANSION",
      "FOUNDING ACT",
      "MADRID",
      "SOLANA",
      "ROBERTSON",
      "IFOR",
      "SFOR",
      "KFOR"
    ]
  },
  {
    section: "Balkans and Kosovo",
    terms: [
      "BOSNIA",
      "DAYTON",
      "KOSOVO",
      "BALKANS",
      "SERBIA",
      "YUGOSLAV",
      "CROATIA",
      "SARAJEVO",
      "MILOSEVIC",
      "SREBRENICA",
      "KFOR"
    ]
  },
  {
    section: "Western Europe Bilateral",
    terms: [
      "BRITAIN",
      "UNITED KINGDOM",
      " UK ",
      "IRELAND",
      "NORTHERN IRELAND",
      "MAJOR",
      "BLAIR",
      "FRANCE",
      "FRENCH",
      "CHIRAC",
      "GERMANY",
      "GERMAN",
      "KOHL",
      "SCHROEDER",
      "ITALY",
      "ITALIAN",
      "PRODI",
      "SPAIN",
      "SPANISH",
      "AZNAR"
    ]
  },
  {
    section: "Central and Eastern Europe",
    terms: [
      "POLAND",
      "POLISH",
      "CZECH",
      "HAVEL",
      "HUNGARY",
      "HUNGARIAN",
      "ROMANIA",
      "ROMANIAN",
      "BULGARIA",
      "SLOVAK",
      "SLOVENIA",
      "BALTIC",
      "LITHUANIA",
      "LATVIA",
      "ESTONIA",
      "UKRAINE",
      "UKRAINIAN",
      "KUCHMA"
    ]
  },
  {
    section: "EU, OSCE, and Summits",
    terms: ["EUROPEAN UNION", " EU ", "CSCE", "OSCE", "SUMMIT", "HELSINKI", "LISBON", "G-7", "G7", "G-8", "G8"]
  },
  {
    section: "Russia Cross-Reference",
    terms: ["RUSSIA", "RUSSIAN", "YELTSIN", "PRIMAKOV", "CHERNOMYRDIN", "PUTIN", "MAMEDOV"]
  }
];

const HIGH_LEVEL_TERMS = [
  "PRESIDENT",
  "POTUS",
  "PRIME MINISTER",
  "CHANCELLOR",
  "FOREIGN MINISTER",
  "SECRETARY",
  "DEPUTY SECRETARY",
  "NATIONAL SECURITY ADVISOR",
  "MEETING",
  "CONVERSATION",
  "TELCON",
  "MEMCON",
  "SUMMIT",
  "BILATERAL",
  "TRIP"
];

const NOISE_TERMS = [
  "KOREA",
  "JAPAN",
  "CHINA",
  "HAITI",
  "IRAQ",
  "IRAN",
  "MIDDLE EAST",
  "AFRICA",
  "LATIN AMERICA",
  "CONGRESS",
  "HELMS",
  "SCHEDULE"
];

function sanitizeQuery(query) {
  return (query || "").replace(/["“”]/g, "").replace(/[‘’]/g, "'").trim();
}

function naraUrl(naid) {
  return `https://catalog.archives.gov/id/${naid}`;
}

function uniq(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function dateParts(date) {
  if (!date) return "";
  if (typeof date === "string") return date;
  return date.logicalDate || [date.year, date.month, date.day].filter(Boolean).join("-");
}

function inferYear(record) {
  const direct = [
    record.coverageStartDate,
    record.inclusiveStartDate,
    record.productionDate,
    record.broadcastDate,
    record.releaseDate
  ]
    .map(dateParts)
    .find((value) => /\b(19|20)\d{2}\b/.test(value));
  if (direct) return direct.match(/\b(19|20)\d{2}\b/)[0];

  const text = [record.title, ...(record.otherTitles || [])].join(" ");
  const year = text.match(/\b(199[3-9]|2000|2001)\b/);
  if (year) return year[1];

  const prs = text.match(/^\D*(9[3-9]|00)\d{5}\b/);
  if (prs) return prs[1] === "00" ? "2000" : `19${prs[1]}`;

  return "";
}

function textFor(record) {
  return [
    record.title,
    ...(record.otherTitles || []),
    record.scopeAndContentNote,
    ...(record.variantControlNumbers || []).map((item) => item.number),
    ...(record.digitalObjects || []).map((item) => item.objectFilename),
    ...(record.ancestors || []).map((ancestor) => ancestor.title || ancestor.collectionTitle)
  ]
    .filter(Boolean)
    .join(" ");
}

function matchingTerms(text, terms) {
  return terms.filter((term) => text.includes(term));
}

function inferSections(record) {
  const text = ` ${textFor(record).toUpperCase()} `;
  return SECTION_RULES.map((rule) => ({
    section: rule.section,
    terms: matchingTerms(text, rule.terms)
  })).filter((hit) => hit.terms.length);
}

function volumeFromYear(year) {
  if (!year) return "";
  return Number(year) <= 1996 ? "v23" : "v24";
}

function suggestedVolumes(record, matches, sectionHits) {
  const values = [];
  const text = ` ${textFor(record).toUpperCase()} `;
  if (matchingTerms(text, HIGH_LEVEL_TERMS).length) values.push("v22");
  for (const match of matches) {
    if (match.volume && match.volume !== "all") values.push(match.volume);
  }
  const yearVolume = volumeFromYear(inferYear(record));
  if (yearVolume) values.push(yearVolume);
  if (sectionHits.some((hit) => hit.section === "Balkans and Kosovo" || hit.section === "NATO and European Security")) {
    values.push(yearVolume || "v24");
  }
  if (!values.length) values.push("v23", "v24");
  return uniq(values).map((key) => VOLUMES[key]);
}

function objectSummary(record) {
  const objects = record.digitalObjects || [];
  const pdf = objects.find((object) => /pdf|Portable Document File/i.test(`${object.objectType} ${object.objectFilename}`));
  return {
    count: objects.length,
    pdfUrl: pdf?.objectUrl || "",
    firstUrl: pdf?.objectUrl || objects[0]?.objectUrl || "",
    types: uniq(objects.map((object) => object.objectType || "").filter(Boolean))
  };
}

function categoryFor(record) {
  const objects = objectSummary(record);
  const restrictions = record.accessRestriction?.specificAccessRestrictions || [];
  const restrictionText = restrictions.map((item) => item.restriction || item.securityClassification || "").join("; ");
  if (record.levelOfDescription === "series") return "series description";
  if (!objects.count) return "described, not digitized";
  if (/FOIA|PRA|Presidential Records Act|Freedom of Information/i.test(restrictionText)) return "online, partly restricted";
  return "online";
}

function sourceSeries(record) {
  const series = (record.ancestors || []).find((ancestor) => ancestor.levelOfDescription === "series");
  return {
    naid: series?.naId || "",
    title: series?.title || ""
  };
}

function scoreRecord(record, matches, sectionHits) {
  const text = ` ${textFor(record).toUpperCase()} `;
  const objects = objectSummary(record);
  const highLevelHits = matchingTerms(text, HIGH_LEVEL_TERMS);
  const noiseHits = matchingTerms(text, NOISE_TERMS);
  const sparseTitle = /^(\[?\d{2}\/\d{2}\/\d{4}|\d{7}|Untitled)/i.test(record.title || "");
  const titleSignal = /\[[^\]]*(NATO|KOSOVO|BOSNIA|EUROPE|CSCE|OSCE|FRANCE|GERMANY|UNITED KINGDOM|UK|POLAND|ROMANIA|UKRAINE|RUSSIA|IRELAND)[^\]]*\]/i.test(
    [...(record.otherTitles || []), record.title || ""].join(" ")
  );

  let score = 0;
  score += Math.min(18, matches.length * 2);
  score += sectionHits.reduce((sum, hit) => sum + Math.min(16, hit.terms.length * 4), 0);
  score += highLevelHits.length ? 12 : 0;
  score += titleSignal ? 10 : 0;
  score += objects.pdfUrl ? 10 : 0;
  score += objects.count >= 5 ? 4 : 0;
  score += inferYear(record) ? 4 : 0;
  score += record.levelOfDescription === "item" ? 5 : 0;
  score -= sectionHits.length || titleSignal ? 0 : 20;
  score -= sparseTitle && !titleSignal ? 10 : 0;
  score -= sectionHits.length ? 0 : noiseHits.length * 8;
  score -= /KOREA|JAPAN/.test(text) && !/EUROPE|NATO|RUSSIA/.test(text) ? 12 : 0;
  return score;
}

function candidateSummary(record, matches) {
  const sectionHits = inferSections(record);
  const objects = objectSummary(record);
  const score = scoreRecord(record, matches, sectionHits);
  const series = sourceSeries(record);
  return {
    naid: record.naId || "",
    title: record.title || "Untitled",
    otherTitles: record.otherTitles || [],
    inferredYear: inferYear(record),
    level: record.levelOfDescription || "",
    category: categoryFor(record),
    score,
    priority: score >= 54 ? "high" : score >= 38 ? "medium" : "review",
    suggestedVolumes: suggestedVolumes(record, matches, sectionHits).map((volume) => volume.label),
    sections: uniq(sectionHits.map((hit) => hit.section)),
    matchedQueries: uniq(matches.map((match) => `${match.packLabel}: ${match.query || "all records"}`)),
    digitalObjects: objects.count,
    pdfUrl: objects.pdfUrl,
    firstDigitalObjectUrl: objects.firstUrl,
    catalogUrl: naraUrl(record.naId),
    sourceSeries: series,
    restrictionStatus: record.accessRestriction?.status || "",
    scopeAndContentNote: record.scopeAndContentNote || ""
  };
}

async function fetchCatalog(pack, query, limit) {
  const params = new URLSearchParams();
  const cleanQuery = sanitizeQuery(query);
  if (cleanQuery) params.append("q", cleanQuery);
  params.append("ancestorNaId", ROOT_NAID);
  if (pack.availableOnline) params.append("availableOnline", "true");
  if (pack.typeOfMaterials) params.append("typeOfMaterials", pack.typeOfMaterials);
  params.append("limit", String(limit));

  const url = `${PROXY_URL}${NARA_PATH}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      "x-api-key": API_KEY,
      Accept: "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(`NARA Catalog request failed ${response.status}: ${url}`);
  }
  const json = await response.json();
  const body = json.body || json;
  const hits = body.hits?.hits || [];
  const totalRaw = body.hits?.total;
  const total = totalRaw?.value ?? totalRaw ?? 0;
  return {
    total,
    pack,
    query,
    aggregations: body.aggregations || {},
    records: hits.map((hit) => hit._source?.record || hit._source || hit)
  };
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

function byScore(a, b) {
  return (
    b.score - a.score ||
    (b.digitalObjects || 0) - (a.digitalObjects || 0) ||
    (a.inferredYear || "").localeCompare(b.inferredYear || "") ||
    a.title.localeCompare(b.title)
  );
}

function escapePipe(value) {
  return `${value || ""}`.replaceAll("|", "\\|");
}

function candidateLine(candidate) {
  const title = [candidate.title, ...candidate.otherTitles].filter(Boolean).join(" / ");
  const source = candidate.sourceSeries.title ? `${candidate.sourceSeries.title} (${candidate.sourceSeries.naid})` : "";
  return `| ${candidate.priority} | ${candidate.inferredYear || ""} | [${candidate.naid}](${candidate.catalogUrl}) | ${escapePipe(candidate.suggestedVolumes.join(" + "))} | ${escapePipe(candidate.sections.join(", ") || "General review")} | ${candidate.digitalObjects} | ${escapePipe(source)} | ${escapePipe(title)} |`;
}

function bucketCounts(buckets = []) {
  return Object.fromEntries(buckets.map((bucket) => [bucket.key, bucket.doc_count]));
}

function seriesLine(series) {
  return `| [${series.naid}](${series.catalogUrl}) | ${escapePipe(series.title)} | ${series.start || ""}-${series.end || ""} | ${series.fileUnitCount || 0} | ${series.itemCount || 0} | ${escapePipe(series.accessRestriction || "")} |`;
}

function buildMarkdown(report) {
  const high = report.candidates.filter((candidate) => candidate.priority === "high");
  const medium = report.candidates.filter((candidate) => candidate.priority === "medium");
  const lines = [
    "# NARA Catalog 7388808 All-Collection Search",
    "",
    `Source search: ${SOURCE_SEARCH_URL}`,
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Root collection searched: ${report.rootCollectionNaid}`,
    `- API calls: ${report.apiCalls}`,
    `- All descendant descriptions reported by Catalog: ${report.allDescendantTotal}`,
    `- All descendant descriptions retrieved: ${report.allDescendantRetrieved}`,
    `- Available online descriptions in full set: ${report.availableOnlineCount}`,
    `- Series descriptions in full set: ${report.levelCounts.series || 0}`,
    `- File-unit descriptions in full set: ${report.levelCounts.fileUnit || 0}`,
    `- Item descriptions in full set: ${report.levelCounts.item || 0}`,
    `- Total hits across queries before dedupe: ${report.totalAcrossQueries}`,
    `- Unique records found after full set plus topic queries: ${report.uniqueRecords}`,
    `- FRUS Europe candidates retained: ${report.candidates.length}`,
    `- High-priority candidates: ${high.length}`,
    `- Medium-priority candidates: ${medium.length}`,
    "",
    "## Europe Search Comparison",
    "",
    `- Prior scoped query: ${EUROPE_SEARCH_URL}`,
    `- Online textual Europe records returned: ${report.exactEuropeSearchTotal}`,
    "",
    "## Series Inventory",
    "",
    "| NAID | Series | Dates | File units | Items | Access |",
    "| --- | --- | --- | ---: | ---: | --- |",
    ...report.series.map(seriesLine),
    "",
    "## Section Counts",
    "",
    "| Section | Count |",
    "| --- | ---: |",
    ...Object.entries(report.sectionCounts).map(([section, count]) => `| ${section} | ${count} |`),
    "",
    "## Top Candidates",
    "",
    "| Priority | Year | NAID | Suggested FRUS volume | Section | Digital | Source series | Title / Other titles |",
    "| --- | --- | --- | --- | --- | ---: | --- | --- |",
    ...[...high, ...medium].slice(0, 180).map(candidateLine),
    "",
    "## Notes",
    "",
    "- This report uses the same NARA proxy/API path as NARA Scout, but against the full Clinton NSC Records Management Office root collection.",
    "- The unfiltered all-descendant pass is preserved in the JSON report as collection context; the top table still prioritizes likely FRUS Europe material.",
    "- The Catalog search appears to use OCR/full-text matching even when the displayed metadata is sparse, so numeric PRS file titles still require PDF review.",
    "- Candidate priority is a triage score for compiler review, not a final FRUS selection."
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const perQueryLimit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] || 1000);
  const allRecordsLimit = Number(process.argv.find((arg) => arg.startsWith("--all-limit="))?.split("=")[1] || 6000);
  const tasks = [];
  for (const pack of QUERY_PACKS) {
    for (const query of pack.queries) {
      tasks.push(async () => fetchCatalog(pack, query, pack.allRecords ? allRecordsLimit : perQueryLimit));
    }
  }

  const results = await runWithLimit(tasks, 4);
  const merged = new Map();
  let totalAcrossQueries = 0;
  let exactEuropeSearchTotal = 0;
  let allDescendantTotal = 0;
  let allDescendantRetrieved = 0;
  let availableOnlineCount = 0;
  let levelCounts = {};
  let materialCounts = {};

  for (const result of results) {
    totalAcrossQueries += result.total;
    if (result.query === "Europe" && result.pack.label === "Catalog Europe search") {
      exactEuropeSearchTotal = result.total;
    }
    if (result.pack.allRecords) {
      allDescendantTotal = result.total;
      allDescendantRetrieved = result.records.length;
      availableOnlineCount = result.aggregations.availableOnline?.doc_count || 0;
      levelCounts = bucketCounts(result.aggregations.levelOfDescription?.buckets);
      materialCounts = bucketCounts(result.aggregations.typeOfMaterials?.buckets);
    }
    for (const record of result.records) {
      if (!record.naId) continue;
      const match = {
        volume: result.pack.volume,
        packLabel: result.pack.label,
        query: result.query,
        totalForQuery: result.total
      };
      if (!merged.has(record.naId)) {
        merged.set(record.naId, { record, matches: [match] });
      } else {
        merged.get(record.naId).matches.push(match);
      }
    }
  }

  const candidates = [...merged.values()]
    .map(({ record, matches }) => candidateSummary(record, matches))
    .filter((candidate) => candidate.score >= 28 && (candidate.sections.length || candidate.priority !== "review"))
    .sort(byScore);

  const sectionCounts = {};
  const categoryCounts = {};
  const seriesCounts = {};
  const series = [...merged.values()]
    .map(({ record }) => record)
    .filter((record) => record.levelOfDescription === "series")
    .map((record) => ({
      naid: record.naId || "",
      title: record.title || "Untitled",
      start: dateParts(record.inclusiveStartDate).slice(0, 4),
      end: dateParts(record.inclusiveEndDate).slice(0, 4),
      fileUnitCount: record.fileUnitCount || 0,
      itemCount: record.itemCount || 0,
      accessRestriction: record.accessRestriction?.status || "",
      catalogUrl: naraUrl(record.naId)
    }))
    .sort((a, b) => (b.fileUnitCount || 0) - (a.fileUnitCount || 0) || a.title.localeCompare(b.title));
  for (const candidate of candidates) {
    categoryCounts[candidate.category] = (categoryCounts[candidate.category] || 0) + 1;
    if (candidate.sourceSeries.title) {
      seriesCounts[candidate.sourceSeries.title] = (seriesCounts[candidate.sourceSeries.title] || 0) + 1;
    }
    for (const section of candidate.sections) {
      sectionCounts[section] = (sectionCounts[section] || 0) + 1;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    sourceSearchUrl: SOURCE_SEARCH_URL,
    europeSearchUrl: EUROPE_SEARCH_URL,
    rootCollectionNaid: ROOT_NAID,
    apiCalls: results.length,
    queryPacks: QUERY_PACKS,
    allDescendantTotal,
    allDescendantRetrieved,
    availableOnlineCount,
    levelCounts,
    materialCounts,
    totalAcrossQueries,
    exactEuropeSearchTotal,
    uniqueRecords: merged.size,
    candidateCount: candidates.length,
    sectionCounts: Object.fromEntries(Object.entries(sectionCounts).sort((a, b) => b[1] - a[1])),
    categoryCounts: Object.fromEntries(Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])),
    seriesCounts: Object.fromEntries(Object.entries(seriesCounts).sort((a, b) => b[1] - a[1])),
    series,
    candidates
  };

  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(path.join(REPORT_DIR, "nara-collection-7388808-candidates.json"), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(REPORT_DIR, "nara-collection-7388808-candidates.md"), buildMarkdown(report));

  console.log(`Ran ${results.length} NARA Catalog API calls under ${ROOT_NAID}.`);
  console.log(`All-descendant search returned ${allDescendantTotal} records (${allDescendantRetrieved} retrieved).`);
  console.log(`Exact Europe search returned ${exactEuropeSearchTotal} online textual records.`);
  console.log(`Found ${merged.size} unique records; retained ${candidates.length} FRUS Europe candidates.`);
  console.log(`High priority: ${candidates.filter((candidate) => candidate.priority === "high").length}.`);
  console.log("Wrote reports/nara-collection-7388808-candidates.json and reports/nara-collection-7388808-candidates.md.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
