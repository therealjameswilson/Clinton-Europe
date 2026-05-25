const STYLE_MODEL = {
  officialMethodUrl: "https://history.state.gov/historicaldocuments/frus1989-92v31/abouttheseries",
  officialExampleUrl: "https://history.state.gov/historicaldocuments/frus1989-92v31/d38",
  targetVolumeUrls: [
    "https://history.state.gov/historicaldocuments/frus1993-00v22",
    "https://history.state.gov/historicaldocuments/frus1993-00v23",
    "https://history.state.gov/historicaldocuments/frus1993-00v24"
  ]
};

function uniqueInOrder(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function cleanSentence(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/\s+\./g, ".")
    .trim();
}

function firstSourceSentence(note = "") {
  const match = String(note).match(/^(Source:[^.]+(?:\.[^A-Z]*)?)/);
  return match ? cleanSentence(match[1]).replace(/\s*$/, "") : "";
}

function releaseIdForRecord(record, fallback = "") {
  if (record.releaseId) return record.releaseId;
  if (fallback) return fallback;
  const note = [record.provenanceNote, record.sourceNote].filter(Boolean).join(" ");
  const match = note.match(/\brelease\s+(.+?)(?:,\s*item|\.\s|$)/i);
  return match ? cleanSentence(match[1]) : "";
}

function releaseSentence(record) {
  const status = record.releaseStatus || "";
  if (/withheld|not declassified|denied/i.test(status)) return "Not declassified.";
  if (/partial|declassified in part/i.test(status)) return "Declassified in part.";
  if (/full/i.test(status)) return "Full release.";
  if (/declassified/i.test(status)) return "Declassified.";
  return "Release status not determined.";
}

function sourceParts(record, releaseId) {
  return uniqueInOrder([
    "William J. Clinton Presidential Library",
    "Clinton Presidential Records",
    "Declassified Documents",
    record.collection || record.source?.series,
    releaseId ? `release ${releaseId}` : "",
    record.itemId ? `item ${record.itemId}` : ""
  ]);
}

function sourceNoteForRecord(record, fallbackReleaseId = "") {
  const releaseId = releaseIdForRecord(record, fallbackReleaseId);
  return cleanSentence(`Source: ${sourceParts(record, releaseId).join(", ")}. ${releaseSentence(record)}`);
}

function provenanceLinksForRecord(record) {
  return uniqueInOrder([record.itemUrl, record.pdfUrl, record.collectionUrl, record.source?.url]);
}

function provenanceNoteForRecord(record, fallbackReleaseId = "") {
  const sourceNote = sourceNoteForRecord(record, fallbackReleaseId);
  const linkParts = [
    record.itemUrl ? `Digital item: ${record.itemUrl}` : "",
    record.pdfUrl ? `PDF: ${record.pdfUrl}` : "",
    record.collectionUrl ? `Collection: ${record.collectionUrl}` : ""
  ].filter(Boolean);
  return cleanSentence([sourceNote, ...linkParts].join(" "));
}

function sourceNoteIssues(record, fallbackReleaseId = "") {
  const releaseId = releaseIdForRecord(record, fallbackReleaseId);
  const issues = [];
  if (!record.collection && !record.source?.series) issues.push("missing-collection");
  if (!releaseId) issues.push("missing-release-id");
  if (!record.itemId) issues.push("missing-item-id");
  if (!record.itemUrl) issues.push("missing-digital-item-url");
  if (!record.pdfUrl) issues.push("missing-pdf-url");
  if (!record.releaseStatus) issues.push("missing-release-status");
  if (!/box|folder|OA\/ID/i.test(record.sourceNote || record.provenanceNote || "")) {
    issues.push("archival-box-folder-pending");
  }
  issues.push("classification-drafting-approval-pending");
  return uniqueInOrder(issues);
}

function sourceNoteStatus(issues) {
  const blockers = new Set([
    "missing-collection",
    "missing-release-id",
    "missing-item-id",
    "missing-digital-item-url",
    "missing-release-status"
  ]);
  return issues.some((issue) => blockers.has(issue))
    ? "Needs source-note metadata"
    : "FRUS-style candidate; verify against PDF cover sheet";
}

function normalizeRecord(record, fallbackReleaseId = "") {
  const releaseId = releaseIdForRecord(record, fallbackReleaseId);
  const issues = sourceNoteIssues(record, releaseId);
  return {
    ...record,
    releaseId,
    source: {
      ...(record.source || {}),
      releaseId
    },
    sourceNote: sourceNoteForRecord(record, releaseId),
    provenanceNote: provenanceNoteForRecord(record, releaseId),
    provenanceLinks: provenanceLinksForRecord(record),
    sourceNoteStatus: sourceNoteStatus(issues),
    sourceNoteIssues: issues
  };
}

function issueCounts(records) {
  const counts = {};
  for (const record of records) {
    for (const issue of record.sourceNoteIssues || []) {
      counts[issue] = (counts[issue] || 0) + 1;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function styleSummary(records) {
  return {
    totalRecords: records.length,
    frusStyleCandidates: records.filter((record) => /^FRUS-style candidate/.test(record.sourceNoteStatus || "")).length,
    needsSourceNoteMetadata: records.filter((record) => /^Needs source-note metadata/.test(record.sourceNoteStatus || "")).length,
    legacyProvisionalNotesPresent: records.filter((record) =>
      /PDF cover sheet|compiler reconciliation|Clinton Digital Library/i.test(record.sourceNote || "")
    ).length,
    recordsWithSourceNoteUrls: records.filter((record) => /https?:\/\//i.test(record.sourceNote || "")).length,
    recordsWithProvenanceUrls: records.filter((record) => /https?:\/\//i.test(record.provenanceNote || "")).length,
    sourceNoteQueueRecords: records.filter((record) => (record.queues || []).includes("source-note")).length,
    issueCounts: issueCounts(records)
  };
}

function buildStyleAudit(records, extraSummary = {}) {
  return {
    generatedAt: new Date().toISOString(),
    styleBasis: {
      ...STYLE_MODEL,
      rules: [
        "Keep the public sourceNote as a concise archival-chain sentence with release status.",
        "Keep URLs, item pages, PDF links, and collection links in provenanceNote/provenanceLinks.",
        "Keep source-note queue flags until the PDF cover sheet confirms classification, drafting, approval, and exact archival path."
      ]
    },
    summary: {
      ...styleSummary(records),
      ...extraSummary
    },
    records: records.map((record) => ({
      id: record.id,
      title: record.title,
      date: record.date,
      type: record.type,
      itemId: record.itemId,
      releaseId: record.releaseId,
      sourceNoteStatus: record.sourceNoteStatus,
      sourceNoteIssues: record.sourceNoteIssues || [],
      sourceNote: record.sourceNote,
      provenanceNote: record.provenanceNote,
      provenanceLinks: record.provenanceLinks || []
    }))
  };
}

function buildStyleAuditMarkdown(audit) {
  const lines = [
    "# Source Note Style Audit",
    "",
    `Generated: ${audit.generatedAt}`,
    "",
    "## Style Basis",
    "",
    `- Official editorial-method model: ${audit.styleBasis.officialMethodUrl}`,
    `- Published source-note model: ${audit.styleBasis.officialExampleUrl}`,
    `- Target Clinton Europe volumes: ${audit.styleBasis.targetVolumeUrls.join(", ")}`,
    "",
    "## Summary",
    "",
    `- ${audit.summary.totalRecords} candidate records checked.`,
    `- ${audit.summary.frusStyleCandidates} records now have URL-free FRUS-style candidate source notes.`,
    `- ${audit.summary.needsSourceNoteMetadata} records need core source-note metadata before they can be normalized.`,
    `- ${audit.summary.legacyProvisionalNotesPresent} public source notes still contain legacy provisional wording.`,
    `- ${audit.summary.recordsWithSourceNoteUrls} public source notes contain URLs.`,
    `- ${audit.summary.recordsWithProvenanceUrls} provenance notes contain URLs for item/PDF review.`,
    `- ${audit.summary.sourceNoteQueueRecords} records remain in the source-note queue for PDF cover-sheet verification.`,
    "",
    "## Issue Counts",
    ""
  ];

  for (const [issue, count] of Object.entries(audit.summary.issueCounts)) {
    lines.push(`- ${issue}: ${count}`);
  }

  lines.push("", "## Sample Records", "");
  for (const record of audit.records.slice(0, 24)) {
    lines.push(`### ${record.id}: ${record.title}`, "");
    lines.push(`Status: ${record.sourceNoteStatus}`, "");
    lines.push(`Source note: ${record.sourceNote}`, "");
    lines.push(`Issues: ${record.sourceNoteIssues.join(", ") || "none"}`, "");
  }

  while (lines[lines.length - 1] === "") lines.pop();
  return `${lines.join("\n")}\n`;
}

module.exports = {
  STYLE_MODEL,
  buildStyleAudit,
  buildStyleAuditMarkdown,
  cleanSentence,
  normalizeRecord,
  provenanceLinksForRecord,
  provenanceNoteForRecord,
  releaseIdForRecord,
  sourceNoteForRecord,
  sourceNoteIssues,
  sourceNoteStatus,
  styleSummary
};
