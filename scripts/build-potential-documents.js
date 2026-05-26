#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const REPORT_DIR = path.join(ROOT, "reports");

const VOLUME_BY_LABEL = {
  "Volume XXII": {
    id: "frus1993-00v22",
    label: "Volume XXII",
    number: "XXII"
  },
  "Volume XXIII": {
    id: "frus1993-00v23",
    label: "Volume XXIII",
    number: "XXIII"
  },
  "Volume XXIV": {
    id: "frus1993-00v24",
    label: "Volume XXIV",
    number: "XXIV"
  }
};

const SOURCE_REPORTS = [
  {
    path: "nara-scout-candidates.json",
    label: "NARA Scout",
    sourceType: "NARA Scout",
    sourceRepository: "National Archives Catalog",
    sourceCollection: "Clinton NSC European Affairs, Executive Secretary, and Nonproliferation scopes",
    reportUrl: "reports/nara-scout-candidates.md"
  },
  {
    path: "nara-collection-7388808-candidates.json",
    label: "NARA 7388808",
    sourceType: "NARA Catalog 7388808",
    sourceRepository: "National Archives Catalog",
    sourceCollection: "Clinton NSC Records Management Office collection, NAID 7388808",
    reportUrl: "reports/nara-collection-7388808-candidates.md"
  },
  {
    path: "presidential-daily-diary-candidates.json",
    label: "Presidential Daily Diary",
    sourceType: "Presidential Daily Diary",
    sourceRepository: "Clinton Digital Library / National Archives Catalog",
    sourceCollection: "Ellen McCathran - Presidential Diarist, 2010-0083-F and 2013-0549-F",
    reportUrl: "reports/presidential-daily-diary-candidates.md"
  },
  {
    path: "strobe-talbott-candidates.json",
    label: "Strobe FOIA manifest",
    sourceType: "Strobe Talbott FOIA",
    sourceRepository: "State Department FOIA",
    sourceCollection: "Strobe Talbott FOIA manifest, F-2017-13804",
    reportUrl: "reports/strobe-talbott-candidates.md"
  },
  {
    path: "strobe-talbott-local-candidates.json",
    label: "Strobe FOIA local manifest",
    sourceType: "Strobe Talbott FOIA",
    sourceRepository: "State Department FOIA",
    sourceCollection: "Local expanded Strobe Talbott FOIA manifest, F-2017-13804",
    reportUrl: "reports/strobe-talbott-local-candidates.md"
  }
];

function uniq(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function normalizePriority(value) {
  const priority = `${value || "review"}`.toLowerCase();
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  return "Review";
}

function priorityRank(priority) {
  return { High: 0, Medium: 1, Review: 2 }[priority] ?? 3;
}

function shouldPublish(item) {
  const priority = normalizePriority(item.priority || item.includePriority);
  const hasSection = Array.isArray(item.sections) && item.sections.length > 0;
  return hasSection && (priority === "High" || priority === "Medium");
}

function normalizeSection(section) {
  if (section === "Russia-NATO Cross-Reference") return "Russia Cross-Reference";
  return section || "General Review";
}

function normalizeVolume(volume) {
  if (!volume) return null;
  if (typeof volume === "object") {
    return {
      id: volume.id,
      label: volume.label || volume.title || volume.id,
      number: volume.label?.replace("Volume ", "") || volume.id
    };
  }
  const mapped = VOLUME_BY_LABEL[volume];
  return mapped || { id: volume, label: volume, number: volume.replace("Volume ", "") };
}

function sourceKey(item) {
  if (item.candidateId) return `candidate-${item.candidateId}`;
  if (item.eventId) return `event-${item.eventId}`;
  if (item.naid) return `nara-${item.naid}`;
  if (item.catalogUrl) return `catalog-${item.catalogUrl}`;
  if (item.pdfUrl) return `pdf-${item.pdfUrl}`;
  if (item.id) return `strobe-${item.id}`;
  return `title-${item.title || "untitled"}`;
}

function yearDate(item) {
  if (item.date) return item.date;
  if (item.inferredYear) return item.inferredYear;
  return "";
}

function sourceSummary(item, source) {
  if (item.descriptionExcerpt) return item.descriptionExcerpt;
  if (item.description) return item.description;
  if (item.scopeAndContentNote) return item.scopeAndContentNote;
  if (item.rationale?.length) return item.rationale.join("; ");
  if (item.sourceSeries?.title) return `Series: ${item.sourceSeries.title}.`;
  if (item.ancestors?.length) {
    return `Archival path: ${item.ancestors.map((ancestor) => ancestor.title).filter(Boolean).join(" / ")}.`;
  }
  return `Potential source lead from ${source.label}; review the linked object and source note before selection.`;
}

function candidateFromReport(item, source) {
  const volumes = uniq((item.suggestedVolumes || []).map(normalizeVolume).filter(Boolean));
  const sections = uniq((item.sections || []).map(normalizeSection));
  const sourceRuns = [source.label];
  return {
    id: sourceKey(item),
    title: item.title || "Untitled source lead",
    date: yearDate(item),
    sourceType: source.sourceType,
    sourceRepository: source.sourceRepository,
    sourceCollection: source.sourceCollection,
    sourceRuns,
    sourceReports: [source.reportUrl],
    priority: normalizePriority(item.priority || item.includePriority),
    score: Number(item.score || 0),
    identifier: item.identifier || (item.naid ? `NAID ${item.naid}` : item.id || item.otherTitles?.[0] || ""),
    naid: item.naid || "",
    catalogUrl: item.catalogUrl || "",
    sourceUrl: item.sourceUrl || item.catalogUrl || item.pdfUrl || item.firstDigitalObjectUrl || "",
    digitalObjectUrl: item.digitalObjectUrl || item.pdfUrl || item.firstDigitalObjectUrl || "",
    pdfUrl: item.pdfUrl || (/\.pdf(\?|$)/i.test(item.firstDigitalObjectUrl || "") ? item.firstDigitalObjectUrl : ""),
    level: item.level || "",
    category: item.category || item.releaseStatus || "",
    releaseStatus: item.releaseStatus || item.restrictionStatus || "",
    digitalObjects: item.digitalObjects || (item.pdfUrl || item.firstDigitalObjectUrl ? 1 : 0),
    sourceNote: item.sourceNote || "",
    sections,
    section: sections[0] || "General Review",
    volumeIds: uniq(volumes.map((volume) => volume.id)),
    volumeLabels: uniq(volumes.map((volume) => volume.label)),
    matchedQueries: uniq([...(item.matchedQueries || []), ...(item.rationale || [])]),
    summary: sourceSummary(item, source),
    topics: uniq([
      ...(sections || []),
      ...(volumes || []).map((volume) => volume.label),
      item.category,
      item.releaseStatus,
      source.sourceType
    ])
  };
}

function mergeCandidate(existing, incoming) {
  const priority = priorityRank(incoming.priority) < priorityRank(existing.priority)
    ? incoming.priority
    : existing.priority;
  const summary = (incoming.summary || "").length > (existing.summary || "").length
    ? incoming.summary
    : existing.summary;
  return {
    ...existing,
    ...Object.fromEntries(
      Object.entries(incoming).filter(([, value]) => {
        if (Array.isArray(value)) return false;
        return value !== "" && value !== 0 && value != null;
      })
    ),
    priority,
    score: Math.max(existing.score || 0, incoming.score || 0),
    sourceType: uniq([existing.sourceType, incoming.sourceType]).join(" + "),
    sourceCollection: uniq([existing.sourceCollection, incoming.sourceCollection]).join("; "),
    sourceRuns: uniq([...(existing.sourceRuns || []), ...(incoming.sourceRuns || [])]),
    sourceReports: uniq([...(existing.sourceReports || []), ...(incoming.sourceReports || [])]),
    sections: uniq([...(existing.sections || []), ...(incoming.sections || [])]),
    section: existing.section || incoming.section,
    volumeIds: uniq([...(existing.volumeIds || []), ...(incoming.volumeIds || [])]),
    volumeLabels: uniq([...(existing.volumeLabels || []), ...(incoming.volumeLabels || [])]),
    matchedQueries: uniq([...(existing.matchedQueries || []), ...(incoming.matchedQueries || [])]),
    topics: uniq([...(existing.topics || []), ...(incoming.topics || [])]),
    summary
  };
}

function byPriorityScoreDate(a, b) {
  return (
    priorityRank(a.priority) - priorityRank(b.priority) ||
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

function markdownTable(items) {
  return [
    "| Priority | Score | Date | Source | Volumes | Sections | Identifier | Title |",
    "| --- | ---: | --- | --- | --- | --- | --- | --- |",
    ...items.map((item) => {
      const url = item.sourceUrl || item.digitalObjectUrl || item.pdfUrl || "#";
      return `| ${item.priority} | ${item.score} | ${item.date || ""} | ${escapePipe(item.sourceType)} | ${escapePipe(item.volumeLabels.join(" + "))} | ${escapePipe(item.sections.join(", "))} | ${escapePipe(item.identifier)} | [${escapePipe(item.title)}](${url}) |`;
    })
  ].join("\n");
}

function buildMarkdown(report) {
  const lines = [
    "# Clinton-Europe Potential Documents",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Potential documents published to site data: ${report.documentCount}`,
    `- High-priority leads: ${report.priorityCounts.High || 0}`,
    `- Medium-priority leads: ${report.priorityCounts.Medium || 0}`,
    "",
    "## Source Runs",
    "",
    ...Object.entries(report.sourceRunCounts).map(([source, count]) => `- ${source}: ${count}`),
    "",
    "## Section Counts",
    "",
    ...Object.entries(report.sectionCounts).map(([section, count]) => `- ${section}: ${count}`),
    "",
    "## Potential Documents",
    "",
    markdownTable(report.documents),
    "",
    "## Notes",
    "",
    "- These are source leads for compiler review, not final FRUS selection decisions.",
    "- NARA file-unit packets may contain many discrete documents; open the PDF or digital objects before drafting item-level source notes.",
    "- Strobe Talbott FOIA leads are deduplicated by document ID across the published and local manifests."
  ];
  return `${lines.join("\n")}\n`;
}

async function readReport(source) {
  const fullPath = path.join(REPORT_DIR, source.path);
  const raw = await fs.readFile(fullPath, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const merged = new Map();
  const sourceInputs = {};

  for (const source of SOURCE_REPORTS) {
    const report = await readReport(source);
    const candidates = (report.candidates || []).filter(shouldPublish);
    sourceInputs[source.label] = candidates.length;
    for (const item of candidates) {
      const candidate = candidateFromReport(item, source);
      const key = candidate.id;
      if (merged.has(key)) {
        merged.set(key, mergeCandidate(merged.get(key), candidate));
      } else {
        merged.set(key, candidate);
      }
    }
  }

  const documents = [...merged.values()].sort(byPriorityScoreDate);
  const report = {
    generatedAt: new Date().toISOString(),
    documentCount: documents.length,
    sourceInputs,
    priorityCounts: countBy(documents, (item) => item.priority),
    sourceRunCounts: countBy(documents, (item) => item.sourceRuns),
    sourceTypeCounts: countBy(documents, (item) => item.sourceType),
    sectionCounts: countBy(documents, (item) => item.sections),
    volumeCounts: countBy(documents, (item) => item.volumeLabels),
    documents
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, "potential-documents.json"), `${JSON.stringify(documents, null, 2)}\n`);
  await fs.writeFile(
    path.join(DATA_DIR, "potential-documents.js"),
    `window.CLINTON_EUROPE_POTENTIAL_DOCUMENTS = ${JSON.stringify(documents, null, 2)};\n`
  );
  await fs.writeFile(path.join(REPORT_DIR, "potential-documents.json"), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(REPORT_DIR, "potential-documents.md"), buildMarkdown(report));

  console.log(`Built ${documents.length} potential document leads.`);
  console.log(`High priority: ${report.priorityCounts.High || 0}. Medium priority: ${report.priorityCounts.Medium || 0}.`);
  console.log("Wrote data/potential-documents.json, data/potential-documents.js, and reports/potential-documents.md.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
