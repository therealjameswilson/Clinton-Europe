#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const REPORT_DIR = path.join(ROOT, "reports");
const PROXY_URL = "https://nara-proxy.mzqmpgyvdv.workers.dev";
const NARA_PATH = "/records/search";
const API_KEY = "C6O0DyEcap6taVb24zymF5AOMQvwTXsa7q0ZH8cN";
const SCOUT_URL = "https://therealjameswilson.github.io/nara-scout/";

const SCOPES = [
  { naid: "7386505", label: "Clinton NSC European Affairs" },
  { naid: "7386739", label: "Clinton NSC Executive Secretary" },
  { naid: "7388773", label: "Clinton NSC Nonproliferation and Export Controls" }
];

const QUERY_PACKS = [
  {
    id: "frus1993-00v22",
    label: "Volume XXII",
    title: "Europe: High-Level Contacts",
    dateFrom: "1993",
    dateTo: "2001",
    queries: [
      "(summit OR Yeltsin OR Major OR Blair OR Chirac OR Kohl OR Schroeder OR Prodi OR Aznar OR high-level OR bilateral)",
      "Chirac",
      "Kohl",
      "Blair",
      "Major",
      "Prodi",
      "Yeltsin",
      "Solana"
    ]
  },
  {
    id: "frus1993-00v23",
    label: "Volume XXIII",
    title: "Europe: Policy, 1993-1996",
    dateFrom: "1993",
    dateTo: "1996",
    queries: [
      "(NATO OR Bosnia OR Dayton OR Partnership for Peace OR enlargement OR CSCE OR OSCE OR European Union OR Russia OR Ukraine OR Poland OR Romania)",
      "NATO",
      "Bosnia",
      "Dayton",
      "Partnership for Peace",
      "CSCE",
      "OSCE",
      "European Union"
    ]
  },
  {
    id: "frus1993-00v24",
    label: "Volume XXIV",
    title: "Europe: Policy, 1997-2000",
    dateFrom: "1997",
    dateTo: "2001",
    queries: [
      "(NATO OR Partnership for Peace OR enlargement OR Madrid OR Helsinki OR Founding Act OR Kosovo OR ESDP)",
      "NATO",
      "Kosovo",
      "Founding Act",
      "Madrid",
      "Helsinki",
      "ESDP",
      "Robertson"
    ]
  }
];

const SECTION_RULES = [
  {
    section: "NATO and European Security",
    terms: ["NATO", "PARTNERSHIP FOR PEACE", "ENLARGEMENT", "MADRID", "FOUNDING ACT", "SOLANA", "ROBERTSON", "IFOR", "SFOR", "KFOR"]
  },
  {
    section: "Balkans and Kosovo",
    terms: ["BOSNIA", "DAYTON", "KOSOVO", "SERBIA", "YUGOSLAV", "CROATIA", "SARAJEVO", "MILOSEVIC", "SREBRENICA"]
  },
  {
    section: "Western Europe Bilateral",
    terms: ["BRITAIN", "UNITED KINGDOM", "MAJOR", "BLAIR", "FRANCE", "FRENCH", "CHIRAC", "GERMANY", "GERMAN", "KOHL", "SCHROEDER", "ITALY", "PRODI", "SPAIN", "AZNAR"]
  },
  {
    section: "Central and Eastern Europe",
    terms: ["POLAND", "POLISH", "CZECH", "HUNGARY", "ROMANIA", "BALTIC", "LITHUANIA", "LATVIA", "ESTONIA", "UKRAINE", "SLOVAK"]
  },
  {
    section: "EU, OSCE, and Summits",
    terms: ["EUROPEAN UNION", "EU ", "CSCE", "OSCE", "SUMMIT", "HELSINKI", "LISBON", "G-7", "G7", "G-8", "G8"]
  },
  {
    section: "Russia Cross-Reference",
    terms: ["RUSSIA", "RUSSIAN", "YELTSIN", "PRIMAKOV", "CHERNOMYRDIN", "PUTIN"]
  }
];

const HIGH_LEVEL_TERMS = [
  "PRESIDENT",
  "PRIME MINISTER",
  "CHANCELLOR",
  "FOREIGN MINISTER",
  "SECRETARY",
  "DEPUTY SECRETARY",
  "NATIONAL SECURITY ADVISOR",
  "MEETING",
  "CONVERSATION",
  "SUMMIT",
  "BILATERAL"
];

const WITHDRAWAL_RE = /withdraw(al)?\s*(sheet|notice|card)|NA\s*Form\s*1402[13]/i;

function sanitizeQuery(q) {
  return (q || "").replace(/["“”]/g, "").replace(/[‘’]/g, "'").trim();
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

function yearFromRecord(record, side) {
  return record?.[side]?.year || "";
}

function dateLabel(record) {
  const start = yearFromRecord(record, "coverageStartDate");
  const end = yearFromRecord(record, "coverageEndDate");
  if (start && end && start !== end) return `${start}-${end}`;
  return start || end || "";
}

function textFor(record) {
  return [
    record.title,
    record.scopeAndContentNote,
    ...(record.ancestors || []).map((ancestor) => ancestor.title || ancestor.collectionTitle)
  ]
    .filter(Boolean)
    .join(" ");
}

function classify(record) {
  const title = record.title || "";
  const desc = record.scopeAndContentNote || "";
  const online = Array.isArray(record.digitalObjects) && record.digitalObjects.length > 0;
  const restrictions = record.accessRestriction?.specificAccessRestrictions || [];
  const restrictionTypes = restrictions.map((item) => `${item.restriction || ""}`.toUpperCase());
  const foia = restrictionTypes.some((item) => /FOIA/.test(item));
  const pra = restrictionTypes.some((item) => /PRA|PRESIDENTIAL/.test(item));
  const withdrawal = WITHDRAWAL_RE.test(title) || WITHDRAWAL_RE.test(desc);
  if (withdrawal || foia || pra) return { category: "withdrawal/MDR", online, foia, pra, restrictionTypes };
  if (online) return { category: "declassified online", online, foia, pra, restrictionTypes };
  if (!desc.trim() || desc.trim().length < 20) return { category: "unprocessed/no description", online, foia, pra, restrictionTypes };
  return { category: "described, not digitized", online, foia, pra, restrictionTypes };
}

function inferSections(record) {
  const text = textFor(record).toUpperCase();
  return SECTION_RULES.filter((rule) => rule.terms.some((term) => text.includes(term))).map((rule) => rule.section);
}

function scoreRecord(record, queryMatches) {
  const text = textFor(record).toUpperCase();
  const info = classify(record);
  const sections = inferSections(record);
  let score = 0;
  score += Math.min(24, queryMatches.length * 5);
  score += sections.length * 6;
  score += HIGH_LEVEL_TERMS.some((term) => text.includes(term)) ? 10 : 0;
  score += info.online ? 12 : 0;
  score += record.levelOfDescription === "item" ? 6 : 0;
  score += record.levelOfDescription === "fileUnit" ? 4 : 0;
  score += info.category === "withdrawal/MDR" ? 4 : 0;
  score += (record.digitalObjects?.length || 0) >= 5 ? 3 : 0;
  return score;
}

function recordSummary(record, matches) {
  const info = classify(record);
  const score = scoreRecord(record, matches);
  const ancestors = (record.ancestors || []).map((ancestor) => ({
    naid: ancestor.naId || "",
    title: ancestor.title || ancestor.collectionTitle || "",
    level: ancestor.levelOfDescription || ""
  }));
  const sections = inferSections(record);
  return {
    naid: record.naId || "",
    title: record.title || "Untitled",
    date: dateLabel(record),
    level: record.levelOfDescription || "",
    category: info.category,
    score,
    priority: score >= 50 ? "high" : score >= 36 ? "medium" : "review",
    suggestedVolumes: uniq(matches.map((match) => match.volumeLabel)),
    matchedQueries: uniq(matches.map((match) => `${match.volumeLabel}: ${match.query}`)),
    sections,
    scope: uniq(matches.map((match) => match.scopeLabel)),
    digitalObjects: record.digitalObjects?.length || 0,
    firstDigitalObjectUrl: record.digitalObjects?.[0]?.objectUrl || "",
    catalogUrl: naraUrl(record.naId),
    scopeAndContentNote: record.scopeAndContentNote || "",
    ancestors
  };
}

async function fetchScout(scope, pack, query, limit) {
  const params = new URLSearchParams();
  params.append("q", sanitizeQuery(query));
  params.append("ancestorNaId", scope.naid);
  params.append("startDate", pack.dateFrom);
  params.append("endDate", pack.dateTo);
  params.append("limit", String(limit));

  const url = `${PROXY_URL}${NARA_PATH}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      "x-api-key": API_KEY,
      Accept: "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(`NARA Scout request failed ${response.status}: ${url}`);
  }
  const json = await response.json();
  const body = json.body || json;
  const hits = body.hits?.hits || [];
  const totalRaw = body.hits?.total;
  const total = totalRaw?.value ?? totalRaw ?? 0;
  return {
    total,
    records: hits.map((hit) => hit._source?.record || hit._source || hit)
  };
}

async function runWithLimit(tasks, limit = 5) {
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
  return b.score - a.score || a.title.localeCompare(b.title) || `${a.naid}`.localeCompare(`${b.naid}`);
}

function escapePipe(value) {
  return `${value || ""}`.replaceAll("|", "\\|");
}

function markdownTable(candidates) {
  return [
    "| Priority | Date | NAID | Volumes | Section | Category | Digital | Title |",
    "| --- | --- | --- | --- | --- | --- | ---: | --- |",
    ...candidates.map((item) =>
      `| ${item.priority} | ${item.date || ""} | [${item.naid}](${item.catalogUrl}) | ${escapePipe(item.suggestedVolumes.join(" + "))} | ${escapePipe(item.sections.join(", ") || "General review")} | ${item.category} | ${item.digitalObjects} | ${escapePipe(item.title)} |`
    )
  ].join("\n");
}

function buildMarkdown(report) {
  const high = report.candidates.filter((candidate) => candidate.priority === "high");
  const medium = report.candidates.filter((candidate) => candidate.priority === "medium");
  const lines = [
    "# NARA Scout Clinton-Europe Candidates",
    "",
    `Source tool: ${SCOUT_URL}`,
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Scout query packs run: ${report.queryPackCount}`,
    `- Scout API calls: ${report.apiCalls}`,
    `- Unique NARA records found: ${report.candidates.length}`,
    `- High-priority candidates: ${high.length}`,
    `- Medium-priority candidates: ${medium.length}`,
    "",
    "## Scope",
    "",
    ...SCOPES.map((scope) => `- ${scope.label}: NAID ${scope.naid}`),
    "",
    "## Top Candidates",
    "",
    markdownTable([...high, ...medium].slice(0, 100)),
    "",
    "## Notes",
    "",
    "- This report emulates NARA Scout against the Clinton NSC European Affairs, NSC Executive Secretary, and NSC Nonproliferation scopes.",
    "- Candidate priority is an inclusion triage score, not a final FRUS selection.",
    "- File units with many digital objects are promising folders; individual pages still need document-level review and source-note reconciliation."
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const perQueryLimit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] || 50);
  const tasks = [];
  for (const pack of QUERY_PACKS) {
    for (const scope of SCOPES) {
      for (const query of pack.queries) {
        tasks.push(async () => {
          const result = await fetchScout(scope, pack, query, perQueryLimit);
          return { pack, scope, query, ...result };
        });
      }
    }
  }

  const results = await runWithLimit(tasks, 5);
  const merged = new Map();
  const apiCalls = results.length;
  let totalAcrossQueries = 0;

  for (const result of results) {
    totalAcrossQueries += result.total;
    for (const record of result.records) {
      if (!record.naId) continue;
      const match = {
        volumeId: result.pack.id,
        volumeLabel: result.pack.label,
        volumeTitle: result.pack.title,
        scopeNaid: result.scope.naid,
        scopeLabel: result.scope.label,
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
    .map(({ record, matches }) => recordSummary(record, matches))
    .filter((candidate) => candidate.sections.length || candidate.priority !== "review")
    .sort(byScore);

  const sectionCounts = {};
  const categoryCounts = {};
  for (const candidate of candidates) {
    categoryCounts[candidate.category] = (categoryCounts[candidate.category] || 0) + 1;
    for (const section of candidate.sections) {
      sectionCounts[section] = (sectionCounts[section] || 0) + 1;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    scoutUrl: SCOUT_URL,
    proxyUrl: PROXY_URL,
    queryPackCount: QUERY_PACKS.length,
    apiCalls,
    totalAcrossQueries,
    scopes: SCOPES,
    queryPacks: QUERY_PACKS,
    sectionCounts: Object.fromEntries(Object.entries(sectionCounts).sort((a, b) => b[1] - a[1])),
    categoryCounts: Object.fromEntries(Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])),
    candidates
  };

  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(path.join(REPORT_DIR, "nara-scout-candidates.json"), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(REPORT_DIR, "nara-scout-candidates.md"), buildMarkdown(report));

  console.log(`Ran ${apiCalls} NARA Scout API calls.`);
  console.log(`Found ${candidates.length} unique NARA candidate records.`);
  console.log(`High priority: ${candidates.filter((candidate) => candidate.priority === "high").length}.`);
  console.log("Wrote reports/nara-scout-candidates.json and reports/nara-scout-candidates.md.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
