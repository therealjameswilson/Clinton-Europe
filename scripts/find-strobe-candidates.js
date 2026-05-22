#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const REPORT_DIR = path.join(ROOT, "reports");
const DEFAULT_MANIFEST_URL =
  "https://therealjameswilson.github.io/strobe-talbott-foia/data/manifest_enriched.csv";
const PORTAL_URL = "https://therealjameswilson.github.io/strobe-talbott-foia/manifest.html";

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

const SECTION_RULES = [
  {
    section: "NATO and European Security",
    terms: [
      "NATO",
      "NATO-RUSSIA",
      "NATO/RUSSIA",
      "NATO ENLARGEMENT",
      "NATO EXPANSION",
      "NAC",
      "PFP",
      "PARTNERSHIP FOR PEACE",
      "EUROPEAN SECURITY",
      "SOLANA",
      "ALLIANCE"
    ]
  },
  {
    section: "Russia-NATO Cross-Reference",
    terms: ["PRIMAKOV", "YELTSIN", "CHERNOMYRDIN", "MAMEDOV", "RUSSIA", "RUSSIAN", "FOUNDING ACT"]
  },
  {
    section: "Balkans and Kosovo",
    terms: [
      "BOSNIA",
      "KOSOVO",
      "DAYTON",
      "BALKANS",
      "MILOSEVIC",
      "MILOSEVIC",
      "YUGOSLAV",
      "SERBIA",
      "SACIRBEY",
      "CROATIA",
      "MACEDONIA",
      "KOSOVA"
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
      "KUCHMA",
      "HORBULYN",
      "UDOVENKO"
    ]
  },
  {
    section: "Western Europe Bilateral",
    terms: [
      "BRITISH",
      "UNITED KINGDOM",
      "UK ",
      "RIFKIND",
      "MAJOR",
      "BLAIR",
      "FRANCE",
      "FRENCH",
      "CHIRAC",
      "GERMANY",
      "GERMAN",
      "KOHL",
      "ISCHINGER",
      "BITTERLICH",
      "HOYER",
      "ITALY",
      "ITALIAN",
      "SPAIN",
      "SPANISH",
      "PORTUGAL",
      "PORTUGUESE",
      "NETHERLANDS",
      "DUTCH"
    ]
  },
  {
    section: "EU, OSCE, and Summits",
    terms: ["EUROPEAN UNION", "EU ", "OSCE", "CSCE", "LISBON SUMMIT", "MADRID SUMMIT", "HELSINKI", "SUMMIT"]
  }
];

const HIGH_LEVEL_TERMS = [
  "PRESIDENT",
  "PRIME MINISTER",
  "CHANCELLOR",
  "FOREIGN MINISTER",
  "FM ",
  "SECRETARY'S MEETING",
  "SECRETARYS MEETING",
  "DEPUTY SECRETARY'S MEETING",
  "DEPUTY SECRETARY'S CONVERSATION",
  "MEMORANDUM OF CONVERSATION",
  "MEMORANDUM OF MEETING",
  "VICE PRESIDENT",
  "NATO SECRETARY GENERAL",
  "SYG SOLANA",
  "SOLANA"
];

const DOCUMENT_FORM_TERMS = [
  "MEMORANDUM OF CONVERSATION",
  "MEMORANDUM OF MEETING",
  "MEETING WITH",
  "CONVERSATION WITH",
  "TALKING POINTS",
  "SCENESETTER",
  "BRIEFING",
  "LETTER FROM STROBE",
  "NOTE FROM STROBE",
  "MEMORANDUM FOR",
  "YOUR MEETING"
];

const BACKGROUND_NOISE_TERMS = [
  "APPENDIX",
  "PUBLIC LAW",
  "ARTICLE",
  "BOOK REVIEW",
  "PRESS CLIPPINGS",
  "NEWS SUMMARY",
  "RANDOM MUSINGS",
  "ZBIG-THINK"
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [headers, ...records] = rows.filter((item) => item.length && item.some(Boolean));
  return records.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]))
  );
}

function normalizeDate(dateText) {
  if (!dateText) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return dateText;
  const parts = dateText.split("/");
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return "";
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function matchingTerms(text, terms) {
  return terms.filter((term) => text.includes(term));
}

function uniq(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function policyVolume(date) {
  if (!date) return "";
  return date <= "1996-12-31" ? "v23" : "v24";
}

function summarize(text, max = 260) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 3).trim()}...`;
}

function classify(row) {
  const date = normalizeDate(row.date);
  const title = row.title || "";
  const text = `${title} ${row.description || ""}`.toUpperCase();
  const sectionHits = SECTION_RULES.map((rule) => ({
    section: rule.section,
    terms: matchingTerms(text, rule.terms)
  })).filter((hit) => hit.terms.length);
  const sections = sectionHits.map((hit) => hit.section);
  const highLevelTerms = matchingTerms(text, HIGH_LEVEL_TERMS);
  const formTerms = matchingTerms(text, DOCUMENT_FORM_TERMS);
  const noiseTerms = matchingTerms(text, BACKGROUND_NOISE_TERMS);
  const volumeKeys = uniq(["v22", policyVolume(date)].filter(Boolean));

  let score = 0;
  score += sectionHits.reduce((sum, hit) => sum + Math.min(12, hit.terms.length * 3), 0);
  score += highLevelTerms.length ? 12 : 0;
  score += formTerms.length ? 7 : 0;
  score += /RELEASE IN FULL/i.test(row.release_status || "") ? 4 : 2;
  score += row.description_source === "pdf" ? 3 : 0;
  score += date >= "1993-01-01" && date <= "2000-12-31" ? 6 : 0;
  score -= noiseTerms.length * 8;

  const rationale = [];
  if (highLevelTerms.length) rationale.push(`high-level contact signal: ${uniq(highLevelTerms).slice(0, 3).join(", ")}`);
  if (formTerms.length) rationale.push(`document form signal: ${uniq(formTerms).slice(0, 3).join(", ")}`);
  if (sectionHits.length) rationale.push(`topic signal: ${sectionHits.map((hit) => `${hit.section} (${hit.terms.slice(0, 3).join(", ")})`).join("; ")}`);
  if (noiseTerms.length) rationale.push(`review noise terms: ${uniq(noiseTerms).join(", ")}`);

  return {
    id: row.document_id,
    date,
    title,
    pdfUrl: row.pdf_url,
    releaseStatus: row.release_status || "Release status not captured",
    descriptionSource: row.description_source || "",
    description: row.description || "",
    descriptionExcerpt: summarize(row.description || ""),
    sections: uniq(sections),
    suggestedVolumes: volumeKeys.map((key) => VOLUMES[key]),
    score,
    rationale,
    includePriority: score >= 38 ? "high" : score >= 30 ? "medium" : "review"
  };
}

function byPriority(a, b) {
  return (
    b.score - a.score ||
    (a.date || "").localeCompare(b.date || "") ||
    a.title.localeCompare(b.title)
  );
}

function markdownLink(label, url) {
  return `[${label}](${url})`;
}

function candidateLine(candidate) {
  const volumes = candidate.suggestedVolumes.map((volume) => volume.label).join(" + ");
  const sections = candidate.sections.join(", ") || "General review";
  return `| ${candidate.date || "undated"} | ${candidate.id} | ${candidate.includePriority} | ${volumes} | ${sections} | ${candidate.title.replaceAll("|", "\\|")} | ${markdownLink("PDF", candidate.pdfUrl)} |`;
}

function buildMarkdown(report) {
  const high = report.candidates.filter((candidate) => candidate.includePriority === "high");
  const medium = report.candidates.filter((candidate) => candidate.includePriority === "medium");
  const lines = [
    "# Strobe Talbott FOIA Europe Candidates",
    "",
    `Source manifest: ${PORTAL_URL}`,
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Live manifest rows reviewed: ${report.inputRows}`,
    `- 1993-2000 rows reviewed: ${report.inScopeRows}`,
    `- Europe-volume candidates: ${report.candidates.length}`,
    `- High-priority candidates: ${high.length}`,
    `- Medium-priority candidates: ${medium.length}`,
    "",
    "## Section Counts",
    "",
    "| Section | Count |",
    "| --- | ---: |",
    ...Object.entries(report.sectionCounts).map(([section, count]) => `| ${section} | ${count} |`),
    "",
    "## Top High-Priority Candidates",
    "",
    "| Date | ID | Priority | Suggested FRUS volume | Section | Title | PDF |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...high.slice(0, 80).map(candidateLine),
    "",
    "## Medium-Priority Review Queue",
    "",
    "| Date | ID | Priority | Suggested FRUS volume | Section | Title | PDF |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...medium.slice(0, 80).map(candidateLine),
    "",
    "## Notes",
    "",
    "- This is a title/description triage pass, not a final FRUS selection.",
    "- Every item still needs PDF-level review for source note, textual status, duplicate handling, and exact documentary significance.",
    "- Russia/NATO and Ukraine records are flagged as cross-references because they may belong primarily in Russia/NIS volumes while still carrying Europe-policy value."
  ];
  return `${lines.join("\n")}\n`;
}

async function loadInput(input) {
  if (/^https?:\/\//i.test(input)) {
    const response = await fetch(input);
    if (!response.ok) throw new Error(`Could not fetch ${input}: ${response.status} ${response.statusText}`);
    return response.text();
  }
  return fs.readFile(input, "utf8");
}

function rowsFromInput(input, text) {
  if (/\.json$/i.test(input.trim())) {
    const parsed = JSON.parse(text);
    const records = Array.isArray(parsed) ? parsed : parsed.records || [];
    return records.map((record) => ({
      document_id: record.document_id || record.id || "",
      date: record.date || "",
      title: record.title || "",
      pdf_url: record.pdf_url || record.source_pdf_url || "",
      release_status: record.release_status || "",
      description: record.description || "",
      description_source: record.description ? record.description_source || "json" : "metadata"
    }));
  }
  return parseCsv(text);
}

function parseArgs(argv) {
  let input = DEFAULT_MANIFEST_URL;
  let prefix = "strobe-talbott-candidates";
  for (const arg of argv) {
    if (arg.startsWith("--prefix=")) {
      prefix = arg.slice("--prefix=".length);
    } else {
      input = arg;
    }
  }
  return { input, prefix };
}

async function main() {
  const { input, prefix } = parseArgs(process.argv.slice(2));
  const text = await loadInput(input);
  const rows = rowsFromInput(input, text);
  const inScope = rows
    .map((row) => ({ ...row, date_iso: normalizeDate(row.date) }))
    .filter((row) => row.date_iso >= "1993-01-01" && row.date_iso <= "2000-12-31");
  const candidates = inScope
    .map(classify)
    .filter((candidate) => candidate.sections.length && candidate.score >= 24)
    .sort(byPriority);
  const sectionCounts = {};
  for (const candidate of candidates) {
    for (const section of candidate.sections) {
      sectionCounts[section] = (sectionCounts[section] || 0) + 1;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    sourceManifest: input,
    portalUrl: PORTAL_URL,
    inputRows: rows.length,
    inScopeRows: inScope.length,
    candidateCount: candidates.length,
    sectionCounts: Object.fromEntries(Object.entries(sectionCounts).sort((a, b) => b[1] - a[1])),
    candidates
  };

  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(path.join(REPORT_DIR, `${prefix}.json`), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(REPORT_DIR, `${prefix}.md`), buildMarkdown(report));

  console.log(`Reviewed ${rows.length} Strobe manifest rows.`);
  console.log(`Found ${candidates.length} Europe-volume candidates (${candidates.filter((c) => c.includePriority === "high").length} high priority).`);
  console.log(`Wrote reports/${prefix}.json and reports/${prefix}.md.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
