#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const REPORT_DIR = path.join(ROOT, "reports");
const GOVINFO_COLLECTION_URL = "https://www.govinfo.gov/app/collection/ppp/president-42_Clinton,%20William%20J.";

const PACKAGE_IDS = [
  "PPP-1993-book1",
  "PPP-1993-book2",
  "PPP-1994-book1",
  "PPP-1994-book2",
  "PPP-1995-book1",
  "PPP-1995-book2",
  "PPP-1996-book1",
  "PPP-1996-book2",
  "PPP-1997-book1",
  "PPP-1997-book2",
  "PPP-1998-book1",
  "PPP-1998-book2",
  "PPP-1999-book1",
  "PPP-1999-book2",
  "PPP-2000-book1",
  "PPP-2000-book2",
  "PPP-2000-book3"
];

const SECTION_RULES = [
  {
    section: "NATO and European Security",
    terms: ["NATO", "PARTNERSHIP FOR PEACE", "FOUNDING ACT", "EUROPEAN SECURITY", "KFOR", "SFOR"]
  },
  {
    section: "Balkans and Kosovo",
    terms: ["BOSNIA", "HERZEGOVINA", "KOSOVO", "YUGOSLAVIA", "SERBIA", "SOUTHEAST EUROPE", "BALKANS"]
  },
  {
    section: "Northern Ireland",
    terms: ["NORTHERN IRELAND", "BELFAST", "GOOD FRIDAY", "IRELAND PEACE", "DUNDALK"]
  },
  {
    section: "EU and Transatlantic",
    terms: ["EUROPEAN UNION", "EUROPEAN COMMUNITY", "EUROPEAN CURRENCY", "EURO ", "EU-US", "U.S.-EU"]
  },
  {
    section: "Central and Eastern Europe",
    terms: [
      "POLAND",
      "WARSAW",
      "CZECH",
      "PRAGUE",
      "HAVEL",
      "HUNGARY",
      "ROMANIA",
      "UKRAINE",
      "BALTIC",
      "LITHUANIA",
      "LATVIA",
      "ESTONIA"
    ]
  },
  {
    section: "Western Europe Bilateral",
    terms: [
      "UNITED KINGDOM",
      "BRITAIN",
      "BLAIR",
      "JOHN MAJOR",
      "FRANCE",
      "CHIRAC",
      "MITTERRAND",
      "GERMANY",
      "KOHL",
      "SCHROEDER",
      "BONN",
      "BERLIN",
      "PARIS",
      "DUBLIN"
    ]
  },
  {
    section: "Russia Cross-Reference",
    terms: ["RUSSIA", "YELTSIN", "CHERNOMYRDIN", "PRIMAKOV", "PUTIN", "MOSCOW"]
  }
];

const DISCOVERY_TERMS = [
  "Europe",
  "European",
  "NATO",
  "Bosnia",
  "Herzegovina",
  "Kosovo",
  "Yugoslavia",
  "Serbia",
  "Northern Ireland",
  "Belfast",
  "Good Friday",
  "Russia",
  "Yeltsin",
  "Chernomyrdin",
  "Primakov",
  "Putin",
  "Chirac",
  "Mitterrand",
  "France",
  "Kohl",
  "Schroeder",
  "Germany",
  "Tony Blair",
  "John Major",
  "United Kingdom",
  "Poland",
  "Warsaw",
  "Czech",
  "Prague",
  "Havel",
  "Hungary",
  "Romania",
  "Ukraine",
  "Baltic",
  "OSCE",
  "CSCE",
  "Partnership for Peace",
  "Founding Act",
  "European Currency",
  "European Union",
  "European Community",
  "Southeast Europe",
  "Brandenburg",
  "Brussels",
  "Madrid",
  "Helsinki",
  "Bonn",
  "Berlin",
  "Paris",
  "Moscow",
  "Dublin",
  "Dundalk"
];

const HIGH_SIGNAL_RE = /(NATO|Bosnia|Herzegovina|Kosovo|Yugoslavia|Serbia|Northern Ireland|Belfast|Good Friday|European Union|European Community|European Currency|Partnership for Peace|Founding Act|Southeast Europe|OSCE|CSCE)/i;
const PUBLIC_FORM_RE = /^(Address|Remarks|Statement|Joint Statement|Exchange With Reporters|The President's News Conference|Question-and-Answer Session|Opinion-Editorial|Declaration)/i;
const LEADER_RE = /(President|Prime Minister|Chancellor|European Union Leaders|NATO|Yeltsin|Chirac|Kohl|Blair|Major|Havel|Ahern|Putin|Chernomyrdin|Mitterrand|Schroeder)/i;
const LOW_SIGNAL_RE = /^(Nomination|Letter to Congressional Leaders|Message to the Congress|Letter to the Speaker|Statement on the Death|Remarks at a Democratic|Remarks at a Reception for Senator|Remarks at a Luncheon for Senator)/i;
const LANDMARK_PLACE_RE = /(Berlin|Brandenburg|Brussels|Prague|Warsaw|Madrid|Belfast|Dublin|Dundalk|Bonn|Lisbon|London|Paris|The Hague|Tuzla|Coventry)/i;
const HIGH_SIGNAL_TERMS = [
  "NATO",
  "Bosnia",
  "Herzegovina",
  "Kosovo",
  "Yugoslavia",
  "Serbia",
  "Northern Ireland",
  "Belfast",
  "Good Friday",
  "European Union",
  "European Community",
  "European Currency",
  "Partnership for Peace",
  "Founding Act",
  "Southeast Europe",
  "OSCE",
  "CSCE"
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasTerm(text, term) {
  const escaped = escapeRegExp(term).replace(/\s+/g, "\\s+");
  const startsWithWord = /^[A-Za-z0-9]/.test(term);
  const endsWithWord = /[A-Za-z0-9]$/.test(term);
  const prefix = startsWithWord ? "\\b" : "";
  const suffix = endsWithWord ? "\\b" : "";
  return new RegExp(`${prefix}${escaped}${suffix}`, "i").test(text);
}

function decodeHtml(text) {
  return (text || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, "")
    .replace(/&lt;/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/``/g, '"')
    .replace(/''/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function isoDate(dateLabel) {
  const clean = decodeHtml(dateLabel).replace(/^[A-Za-z]+,\s+/, "");
  const date = new Date(`${clean} UTC`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function textFor(record) {
  return `${record.title} ${record.dateLabel}`.toUpperCase();
}

function includesAny(text, terms) {
  return terms.some((term) => hasTerm(text, term));
}

function matchingTerms(text, terms) {
  return terms.filter((term) => hasTerm(text, term));
}

function unique(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function inferSections(record) {
  const text = textFor(record);
  return SECTION_RULES.map((rule) => ({
    section: rule.section,
    terms: matchingTerms(text, rule.terms)
  })).filter((hit) => hit.terms.length);
}

function inferVolumes(record, sections) {
  const values = [];
  if (PUBLIC_FORM_RE.test(record.title) && LEADER_RE.test(record.title)) values.push("frus1993-00v22");
  if (sections.some((section) => ["NATO and European Security", "Balkans and Kosovo", "EU and Transatlantic"].includes(section))) {
    values.push(record.date <= "1996-12-31" ? "frus1993-00v23" : "frus1993-00v24");
  }
  if (sections.includes("Central and Eastern Europe")) {
    values.push(record.date <= "1996-12-31" ? "frus1993-00v23" : "frus1993-00v24");
  }
  if (!values.length) values.push(record.date <= "1996-12-31" ? "frus1993-00v23" : "frus1993-00v24");
  return unique(values);
}

function score(record, sections) {
  let total = 0;
  if (includesAny(record.title, HIGH_SIGNAL_TERMS)) total += 20;
  if (PUBLIC_FORM_RE.test(record.title)) total += 12;
  if (LEADER_RE.test(record.title)) total += 10;
  if (sections.length) total += Math.min(18, sections.length * 7);
  if (/Address|News Conference|Joint Statement|Declaration|Opinion-Editorial/i.test(record.title)) total += 6;
  if (/^(Address|Remarks)/i.test(record.title) && LANDMARK_PLACE_RE.test(record.title)) total += 12;
  if (/Letter to Congressional Leaders|Message to the Congress/i.test(record.title) && includesAny(record.title, HIGH_SIGNAL_TERMS)) total += 4;
  if (LOW_SIGNAL_RE.test(record.title) && !includesAny(record.title, HIGH_SIGNAL_TERMS)) total -= 18;
  if (/Democratic|Campaign|Senator|Gubernatorial|Narcotics|Telecommunications|Budget/i.test(record.title)) total -= 12;
  return total;
}

function noteFor(sections) {
  if (sections.includes("NATO and European Security")) return "Public marker for NATO adaptation, enlargement, or transatlantic security policy.";
  if (sections.includes("Balkans and Kosovo")) return "Public record of the administration's Balkans crisis diplomacy and military-policy messaging.";
  if (sections.includes("Northern Ireland")) return "Public reference point for Clinton's Northern Ireland peace-process diplomacy.";
  if (sections.includes("EU and Transatlantic")) return "Public framing of the U.S.-EU relationship and European integration.";
  if (sections.includes("Central and Eastern Europe")) return "Public signal on democratic transition and integration in Central and Eastern Europe.";
  if (sections.includes("Western Europe Bilateral")) return "Public-facing counterpart to bilateral leader meetings and trip files.";
  if (sections.includes("Russia Cross-Reference")) return "Public-facing cross-reference for Russia/NATO and Europe-Russia diplomacy.";
  return "Public statement with possible Europe-volume context.";
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not fetch ${url}: ${response.status}`);
  return response.text();
}

function parseContext(packageId, html) {
  const items = [];
  const itemRe = /<article class="result-item[\s\S]*?<h4 class="result-title">\s*<a href="([^"]+)">([\s\S]*?)<\/a>\s*<\/h4>\s*<h5 class="document-title">([\s\S]*?)<\/h5>[\s\S]*?href="([^"]+\.pdf)"[\s\S]*?href="([^"]+\.htm)"/g;
  let match;
  while ((match = itemRe.exec(html))) {
    const title = decodeHtml(match[2]);
    const dateLabel = decodeHtml(match[3]);
    const date = isoDate(dateLabel);
    if (date < "1993-01-20" || date > "2001-01-20") continue;
    if (!includesAny(title.toUpperCase(), DISCOVERY_TERMS)) continue;

    const granuleId = match[1].split("/").pop();
    const record = {
      id: granuleId,
      packageId,
      granuleId,
      date,
      dateLabel,
      title,
      detailsUrl: match[1],
      pdfUrl: match[4],
      textUrl: match[5]
    };
    const sectionHits = inferSections(record);
    const sections = unique(sectionHits.map((hit) => hit.section));
    const recordScore = score(record, sections);
    if (recordScore < 18) continue;

    items.push({
      ...record,
      sections,
      topics: unique(sectionHits.flatMap((hit) => hit.terms)),
      volumeIds: inferVolumes(record, sections),
      score: recordScore,
      priority: recordScore >= 44 ? "high" : recordScore >= 28 ? "medium" : "review",
      notes: noteFor(sections)
    });
  }
  return items;
}

function byDate(a, b) {
  return a.date.localeCompare(b.date) || b.score - a.score || a.title.localeCompare(b.title);
}

function byScore(a, b) {
  return b.score - a.score || a.date.localeCompare(b.date) || a.title.localeCompare(b.title);
}

function statementLine(item) {
  return `| ${item.date} | ${item.priority} | ${item.volumeIds.join(" + ")} | ${item.sections.join(", ") || "Review"} | [${item.title.replaceAll("|", "\\|")}](${item.detailsUrl}) |`;
}

function buildMarkdown(report) {
  const lines = [
    "# Clinton Public Papers Europe Statements",
    "",
    `Source collection: ${GOVINFO_COLLECTION_URL}`,
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Public Papers books scanned: ${report.packageCount}`,
    `- Europe-related statement candidates: ${report.candidateCount}`,
    `- Statements integrated into site data: ${report.integratedCount}`,
    `- High-priority statements: ${report.priorityCounts.high || 0}`,
    `- Medium-priority statements: ${report.priorityCounts.medium || 0}`,
    "",
    "## Section Counts",
    "",
    "| Section | Count |",
    "| --- | ---: |",
    ...Object.entries(report.sectionCounts).map(([section, count]) => `| ${section} | ${count} |`),
    "",
    "## Integrated Statements",
    "",
    "| Date | Priority | Suggested FRUS volume | Section | Title |",
    "| --- | --- | --- | --- | --- |",
    ...report.integrated.map(statementLine),
    "",
    "## Notes",
    "",
    "- This is a public-context layer for FRUS review, not a substitute for archival selection.",
    "- Details, PDF, and text links point to GovInfo Public Papers granules."
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const candidates = [];
  for (const packageId of PACKAGE_IDS) {
    const html = await fetchText(`https://www.govinfo.gov/app/details/${packageId}/context`);
    candidates.push(...parseContext(packageId, html));
  }

  const deduped = [...new Map(candidates.map((item) => [item.id, item])).values()].sort(byScore);
  const integrated = deduped
    .filter((item) => item.priority !== "review")
    .slice(0, 90)
    .sort(byDate);

  const sectionCounts = {};
  const priorityCounts = {};
  for (const item of integrated) {
    priorityCounts[item.priority] = (priorityCounts[item.priority] || 0) + 1;
    for (const section of item.sections) {
      sectionCounts[section] = (sectionCounts[section] || 0) + 1;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    sourceCollection: GOVINFO_COLLECTION_URL,
    packageCount: PACKAGE_IDS.length,
    candidateCount: deduped.length,
    integratedCount: integrated.length,
    sectionCounts: Object.fromEntries(Object.entries(sectionCounts).sort((a, b) => b[1] - a[1])),
    priorityCounts,
    integrated,
    candidates: deduped
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, "public-statements.json"), `${JSON.stringify(integrated, null, 2)}\n`);
  await fs.writeFile(
    path.join(DATA_DIR, "public-statements.js"),
    `window.CLINTON_EUROPE_PUBLIC_STATEMENTS = ${JSON.stringify(integrated, null, 2)};\n`
  );
  await fs.writeFile(path.join(REPORT_DIR, "clinton-public-statements.json"), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(REPORT_DIR, "clinton-public-statements.md"), buildMarkdown(report));

  console.log(`Scanned ${PACKAGE_IDS.length} Clinton Public Papers books.`);
  console.log(`Found ${deduped.length} Europe-related public statement candidates.`);
  console.log(`Integrated ${integrated.length} key statements into data/public-statements.json.`);
  console.log("Wrote reports/clinton-public-statements.json and reports/clinton-public-statements.md.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
