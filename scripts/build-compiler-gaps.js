const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const YEARS = ["1993", "1994", "1995", "1996", "1997", "1998", "1999", "2000"];
const VOLUME_LABELS = {
  "frus1993-00v22": "Volume XXII",
  "frus1993-00v23": "Volume XXIII",
  "frus1993-00v24": "Volume XXIV"
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, filePath), "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(path.join(ROOT, filePath), `${JSON.stringify(data, null, 2)}\n`);
}

function countBy(items, getter) {
  const counts = new Map();
  for (const item of items) {
    const values = getter(item);
    for (const value of Array.isArray(values) ? values : [values]) {
      const key = value || "Unassigned";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return Object.fromEntries([...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

function count(items, predicate) {
  return items.filter(predicate).length;
}

function yearOf(item) {
  return (item.date || item.sortDate || "").slice(0, 4) || "Undated";
}

function countForYear(items, year) {
  return count(items, (item) => yearOf(item) === year);
}

function countForSectionYear(items, section, year) {
  return count(items, (item) => (item.section || "Unassigned") === section && yearOf(item) === year);
}

function searchCount(items, term) {
  const re = new RegExp(term, "i");
  return count(items, (item) =>
    re.test(
      [
        item.title,
        item.section,
        item.summary,
        item.sourceCollection,
        ...(item.countries || []),
        ...(item.sections || []),
        ...(item.topics || []),
        ...(item.matchedQueries || [])
      ]
        .filter(Boolean)
        .join(" ")
    )
  );
}

function volumeCount(items, volumeId) {
  return count(items, (item) => (item.volumeIds || []).includes(volumeId));
}

function buildReport(data) {
  const lines = [
    "# Clinton Europe Compiler Gaps",
    "",
    `Generated: ${data.generatedAt}`,
    "",
    "## Summary",
    "",
    `- ${data.summary.totalGaps} compiler gaps identified.`,
    `- ${data.summary.criticalGaps} critical gaps; ${data.summary.highGaps} high gaps; ${data.summary.mediumGaps} medium gaps.`,
    `- ${data.metrics.records.total} Clinton Library candidate records, ${data.metrics.publicStatements.total} public statements, and ${data.metrics.potentialDocuments.total} potential NARA/FOIA source leads reviewed.`,
    "",
    "## Gaps",
    ""
  ];

  for (const gap of data.gaps) {
    lines.push(`### ${gap.severity}: ${gap.title}`, "");
    lines.push(`Area: ${gap.area}`, "");
    lines.push(gap.compilerRisk, "");
    lines.push("Evidence:");
    for (const item of gap.evidence) lines.push(`- ${item}`);
    lines.push("");
    lines.push("Next steps:");
    for (const item of gap.nextSteps) lines.push(`- ${item}`);
    lines.push("");
  }

  while (lines[lines.length - 1] === "") lines.pop();
  return `${lines.join("\n")}\n`;
}

function main() {
  const records = readJson("data/records.json");
  const publicStatements = readJson("data/public-statements.json");
  const potentialDocuments = readJson("data/potential-documents.json");

  const sourceNoteRecords = count(records, (record) => (record.queues || []).includes("source-note"));
  const frusStyleCandidateRecords = count(records, (record) =>
    /^FRUS-style candidate/.test(record.sourceNoteStatus || "")
  );
  const sourceNoteMetadataGaps = count(records, (record) =>
    /^Needs source-note metadata/.test(record.sourceNoteStatus || "")
  );
  const missingPdfRecords = count(records, (record) => !record.pdfUrl);
  const crossVolumeRecords = count(records, (record) => (record.queues || []).includes("cross-volume"));
  const undatedPotentialDocuments = count(potentialDocuments, (item) => !/^\d{4}/.test(item.date || ""));
  const highPriorityPotentialDocuments = count(potentialDocuments, (item) => item.priority === "High");
  const mediumPriorityPotentialDocuments = count(potentialDocuments, (item) => item.priority === "Medium");

  const gaps = [
    {
      id: "source-note-reconciliation",
      severity: "Critical",
      area: "Source Integrity",
      title: "FRUS-style source notes still need cover-sheet verification",
      compilerRisk:
        "The memcon and telcon rows now carry clean FRUS-style candidate source notes, but none should be treated as final FRUS citations until the PDF cover sheet confirms classification, drafting or approval data, release number, and exact archival folder path.",
      evidence: [
        `${frusStyleCandidateRecords} of ${records.length} Clinton Library candidate records have URL-free FRUS-style candidate source notes.`,
        `${sourceNoteMetadataGaps} records still need core source-note metadata such as a release identifier.`,
        `${sourceNoteRecords} of ${records.length} Clinton Library candidate records carry the source-note review queue.`,
        `${missingPdfRecords} Clinton Library candidate records do not have direct PDF links yet.`,
        `${crossVolumeRecords} records are also marked for cross-volume placement review.`
      ],
      nextSteps: [
        "Open the PDF cover sheets for high-level contacts first and normalize the archival citation path.",
        "Resolve the missing-PDF queue before selecting any document as a documentary-text candidate.",
        "Record final source-note decisions back into the candidate record layer, not just the narrative report."
      ],
      relatedFilters: [
        { label: "Source-note queue", target: "records", queue: "source-note" },
        { label: "Missing PDFs", target: "records", queue: "pdf-missing" }
      ]
    },
    {
      id: "undated-source-leads",
      severity: "Critical",
      area: "Chronology Control",
      title: "Potential source leads include a large undated block",
      compilerRisk:
        "The FRUS volumes are chronological. Undated NARA and FOIA leads can distort volume placement, especially for Bosnia/Kosovo records that may fall on either side of the 1996/1997 volume boundary.",
      evidence: [
        `${undatedPotentialDocuments} of ${potentialDocuments.length} potential source leads have no normalized year.`,
        `${count(potentialDocuments, (item) => item.section === "Balkans and Kosovo" && !/^\d{4}/.test(item.date || ""))} undated leads are in Balkans and Kosovo.`,
        `${mediumPriorityPotentialDocuments} potential leads are medium priority, so date normalization is needed before down-selecting.`
      ],
      nextSteps: [
        "Extract dates from folder titles, digital-object filenames, cover sheets, and Strobe FOIA manifest fields.",
        "Split undated Kosovo/Bosnia leads between Volume XXIII and XXIV before drafting a chronology.",
        "Promote any dated folder-level lead with a direct digital object and head-of-state relevance to high-priority review."
      ],
      relatedFilters: [
        { label: "Potential documents", target: "documents", search: "Date pending" },
        { label: "Balkans leads", target: "documents", search: "Balkans and Kosovo" }
      ]
    },
    {
      id: "volume-boundary-overlap",
      severity: "High",
      area: "Volume Placement",
      title: "High-level contacts overlap both policy volumes",
      compilerRisk:
        "Volume XXII captures high-level contacts across the whole administration, while Volumes XXIII and XXIV divide policy by date. The current data correctly flags overlap, but the compiler still has to decide which high-level contacts become source texts and which remain cross-references.",
      evidence: [
        `${volumeCount(records, "frus1993-00v22")} records map to Volume XXII.`,
        `${volumeCount(records, "frus1993-00v23")} records map to Volume XXIII and ${volumeCount(records, "frus1993-00v24")} map to Volume XXIV.`,
        `${volumeCount(potentialDocuments, "frus1993-00v22")} potential source leads also touch Volume XXII, with ${volumeCount(potentialDocuments, "frus1993-00v23")} touching XXIII and ${volumeCount(potentialDocuments, "frus1993-00v24")} touching XXIV.`
      ],
      nextSteps: [
        "Create a keeper list for head-of-state/head-of-government contacts that deserve full-text treatment in XXII.",
        "For each keeper, note whether the same document also carries the policy story for XXIII or XXIV.",
        "Use public statements only as context anchors unless they directly explain a documentary omission."
      ],
      relatedFilters: [
        { label: "Volume XXII records", target: "records", volumeId: "frus1993-00v22" },
        { label: "Volume XXIV documents", target: "documents", volumeId: "frus1993-00v24" }
      ]
    },
    {
      id: "balkans-kosovo-imbalance",
      severity: "High",
      area: "Balkans and Kosovo",
      title: "Balkans/Kosovo leads are abundant but uneven by year and source type",
      compilerRisk:
        "The source base is large for 1999 Kosovo but thin in the Clinton Library memcon/telcon corpus and uneven around Dayton implementation. A compiler relying only on the high-volume lead list may over-weight 1999 and under-build the 1996-1997 bridge.",
      evidence: [
        `${count(potentialDocuments, (item) => item.section === "Balkans and Kosovo")} potential leads are tagged Balkans and Kosovo.`,
        `Only ${count(records, (record) => record.section === "Balkans")} Clinton Library candidate records are in the Balkans section.`,
        `Balkans and Kosovo potential leads include ${countForSectionYear(potentialDocuments, "Balkans and Kosovo", "1999")} in 1999, ${countForSectionYear(potentialDocuments, "Balkans and Kosovo", "1997")} in 1997, and ${countForSectionYear(potentialDocuments, "Balkans and Kosovo", "1996")} in 1996.`
      ],
      nextSteps: [
        "Separate Bosnia/Dayton, Kosovo, and regional NATO-use-of-force documents before selection.",
        "Look for Principals Committee, Deputies Committee, and NSC memo traffic to bridge the 1996-1997 gap.",
        "Treat 1999 Kosovo leads as a sub-series rather than allowing them to dominate the entire Balkans chapter."
      ],
      relatedFilters: [
        { label: "Balkans record queue", target: "records", search: "Balkans" },
        { label: "Kosovo leads", target: "documents", search: "Kosovo" }
      ]
    },
    {
      id: "nato-eu-early-years",
      severity: "High",
      area: "NATO and EU",
      title: "Early NATO/EU policy coverage is thin in direct candidate records",
      compilerRisk:
        "The 1993-1996 policy volume needs NATO enlargement, Partnership for Peace, EU/transatlantic, OSCE, and summit-policy material. The current direct record layer is sparse before 1995 and does not yet supply a strong institutional policy spine.",
      evidence: [
        `The NATO and EU Clinton Library section has ${countForSectionYear(records, "NATO and EU", "1993")} records in 1993 and ${countForSectionYear(records, "NATO and EU", "1994")} in 1994.`,
        `NATO and European Security potential leads have ${countForSectionYear(potentialDocuments, "NATO and European Security", "1995")} lead in 1995 and ${countForSectionYear(potentialDocuments, "NATO and European Security", "1996")} in 1996.`,
        `EU, OSCE, and Summits has only ${count(potentialDocuments, (item) => item.section === "EU, OSCE, and Summits")} potential leads across the whole administration.`
      ],
      nextSteps: [
        "Run targeted NARA Scout searches for Partnership for Peace, NATO enlargement, Madrid summit, OSCE, EU, and transatlantic agenda terms.",
        "Prioritize NSC decision memoranda, briefing books, PDD/PRD material, and summit books over public-statement duplicates.",
        "Add explicit EU/OSCE/summit section assignments to any newly found records so they do not disappear into regional buckets."
      ],
      relatedFilters: [
        { label: "NATO/EU records", target: "records", search: "NATO" },
        { label: "EU/OSCE leads", target: "documents", search: "EU OSCE Summits" }
      ]
    },
    {
      id: "western-europe-country-holes",
      severity: "High",
      area: "Western Europe Bilateral",
      title: "Western Europe country coverage is concentrated in a few relationships",
      compilerRisk:
        "The record layer is strong for the United Kingdom, France, Germany, and Northern Ireland, but it does not yet demonstrate adequate bilateral coverage for several Western European partners that may matter for NATO, EU, Balkans, and summit diplomacy.",
      evidence: [
        `Clinton Library records by section: United Kingdom ${count(records, (record) => record.section === "United Kingdom")}, Germany ${count(records, (record) => record.section === "Germany")}, France ${count(records, (record) => record.section === "France")}, Italy ${count(records, (record) => record.section === "Italy")}.`,
        `Search hits in records: Spain ${searchCount(records, "Spain")}, Netherlands ${searchCount(records, "Netherlands")}, Belgium ${searchCount(records, "Belgium")}, Portugal ${searchCount(records, "Portugal")}.`,
        `Northern Ireland is visible with ${searchCount(records, "Northern Ireland")} records, ${searchCount(potentialDocuments, "Northern Ireland")} potential leads, and ${searchCount(publicStatements, "Northern Ireland")} public statements.`
      ],
      nextSteps: [
        "Run country-specific searches for Spain, Portugal, Netherlands, Belgium, Nordics, Austria, Greece, and Turkey where they intersect NATO/EU/Balkans policy.",
        "Keep Northern Ireland as a distinct bilateral/UK-Ireland cluster rather than burying it under generic UK records.",
        "Audit Italy and Spain around Balkans, NATO, and G7/summit diplomacy before final country balance decisions."
      ],
      relatedFilters: [
        { label: "Western Europe leads", target: "documents", search: "Western Europe Bilateral" },
        { label: "Northern Ireland leads", target: "documents", search: "Northern Ireland" }
      ]
    },
    {
      id: "central-eastern-europe-accession",
      severity: "Medium",
      area: "Central and Eastern Europe",
      title: "Central/Eastern Europe needs accession-era document depth",
      compilerRisk:
        "Poland, Czech, Hungary, Romania, Baltic, and Ukraine-related leads are present, but the source mix is uneven. The accession story needs policy documents, not only leader-call records or Strobe FOIA hits.",
      evidence: [
        `Central Europe Clinton Library records total ${count(records, (record) => record.section === "Central Europe")}; the section has ${countForSectionYear(records, "Central Europe", "1997")} in 1997 and ${countForSectionYear(records, "Central Europe", "2000")} in 2000.`,
        `Central and Eastern Europe potential leads total ${count(potentialDocuments, (item) => item.section === "Central and Eastern Europe")}, with ${count(potentialDocuments, (item) => item.section === "Central and Eastern Europe" && item.sourceType === "NARA Catalog 7388808")} from the NARA 7388808 catalog sweep.`,
        `Search hits across current data: Poland ${searchCount(records, "Poland")} records/${searchCount(potentialDocuments, "Poland")} leads; Czech ${searchCount(records, "Czech")} records/${searchCount(potentialDocuments, "Czech")} leads; Hungary ${searchCount(records, "Hungary")} records/${searchCount(potentialDocuments, "Hungary")} leads; Romania ${searchCount(records, "Romania")} records/${searchCount(potentialDocuments, "Romania")} leads.`
      ],
      nextSteps: [
        "Search for NATO accession packages, Senate ratification, Madrid summit, and bilateral accession consultations.",
        "Use Strobe FOIA as a discovery layer, then confirm whether corresponding NSC/RMO documents exist with better provenance.",
        "Separate Ukraine/Russia cross-reference material from Central Europe accession material before chapter drafting."
      ],
      relatedFilters: [
        { label: "Central Europe records", target: "records", search: "Central Europe" },
        { label: "Poland accession leads", target: "documents", search: "Poland NATO" }
      ]
    },
    {
      id: "russia-cross-reference-scope",
      severity: "Medium",
      area: "Russia Cross-Reference",
      title: "Russia/FSU cross-references may swamp Europe volume boundaries",
      compilerRisk:
        "Russia and FSU records are relevant to NATO, Ukraine, Balkans, and European security, but they should not become a backdoor Russia volume. The compiler needs a clear inclusion rule for Europe-facing Russia material.",
      evidence: [
        `${count(records, (record) => record.section === "Russia and FSU Cross-Reference")} Clinton Library records are in the Russia and FSU cross-reference section.`,
        `${count(potentialDocuments, (item) => item.section === "Russia Cross-Reference")} potential source leads are in Russia Cross-Reference, including ${count(potentialDocuments, (item) => item.section === "Russia Cross-Reference" && item.priority === "High")} high-priority leads.`,
        `Ukraine appears in ${searchCount(records, "Ukraine")} Clinton Library records and ${searchCount(potentialDocuments, "Ukraine")} potential leads.`
      ],
      nextSteps: [
        "Define an inclusion test: use Russia/FSU documents only when they directly carry NATO, Ukraine, Balkans/Kosovo, or European-security policy.",
        "Flag purely bilateral U.S.-Russia material for cross-reference rather than full inclusion.",
        "Coordinate any Russia/FSU document selections with the relevant FRUS Russia/FSU volume boundaries."
      ],
      relatedFilters: [
        { label: "Russia/FSU records", target: "records", queue: "russia-fsu-review" },
        { label: "Ukraine leads", target: "documents", search: "Ukraine" }
      ]
    }
  ];

  const data = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalGaps: gaps.length,
      criticalGaps: count(gaps, (gap) => gap.severity === "Critical"),
      highGaps: count(gaps, (gap) => gap.severity === "High"),
      mediumGaps: count(gaps, (gap) => gap.severity === "Medium")
    },
    metrics: {
      records: {
        total: records.length,
        bySection: countBy(records, (record) => record.section),
        byYear: countBy(records, yearOf),
        byVolume: countBy(records, (record) => record.volumeIds || []),
        sourceNoteRecords,
        frusStyleCandidateRecords,
        sourceNoteMetadataGaps,
        missingPdfRecords,
        crossVolumeRecords
      },
      publicStatements: {
        total: publicStatements.length,
        byYear: countBy(publicStatements, yearOf),
        byVolume: countBy(publicStatements, (statement) => statement.volumeIds || [])
      },
      potentialDocuments: {
        total: potentialDocuments.length,
        bySourceType: countBy(potentialDocuments, (item) => item.sourceType),
        bySection: countBy(potentialDocuments, (item) => item.section),
        byYear: countBy(potentialDocuments, yearOf),
        byPriority: countBy(potentialDocuments, (item) => item.priority),
        byVolume: countBy(potentialDocuments, (item) => item.volumeIds || []),
        undatedPotentialDocuments,
        highPriorityPotentialDocuments,
        mediumPriorityPotentialDocuments
      }
    },
    gaps
  };

  writeJson("data/compiler-gaps.json", data);
  fs.writeFileSync(
    path.join(ROOT, "data/compiler-gaps.js"),
    `window.CLINTON_EUROPE_COMPILER_GAPS = ${JSON.stringify(data, null, 2)};\n`
  );
  fs.writeFileSync(path.join(ROOT, "reports/compiler-gaps.md"), buildReport(data));
  console.log(`Wrote ${gaps.length} compiler gaps.`);
}

main();
