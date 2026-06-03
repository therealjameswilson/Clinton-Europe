const STYLE_MODEL = {
  officialMethodUrl: "https://history.state.gov/historicaldocuments/frus1989-92v31/abouttheseries",
  officialExampleUrl: "https://history.state.gov/historicaldocuments/frus1989-92v31/d38",
  targetVolumeUrls: [
    "https://history.state.gov/historicaldocuments/frus1993-00v22",
    "https://history.state.gov/historicaldocuments/frus1993-00v23",
    "https://history.state.gov/historicaldocuments/frus1993-00v24"
  ]
};

const FRUS_READY_STATUS = "FRUS-style source note ready for compiler review";
const FRUS_SCAFFOLD_STATUS = "FRUS provenance scaffold; archival verification required";
const NEEDS_METADATA_STATUS = "Needs source-note metadata";

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

function sentence(value = "") {
  const cleaned = cleanSentence(value);
  if (!cleaned) return "";
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function joinSentences(parts) {
  return parts.map(sentence).filter(Boolean).join(" ");
}

function firstSourceSentence(note = "") {
  const match = String(note).match(/^(Source:[^.]+(?:\.[^A-Z]*)?)/);
  return match ? cleanSentence(match[1]).replace(/\s*$/, "") : "";
}

function cleanReleaseId(value = "") {
  const releaseId = cleanSentence(value).replace(/^release\s+/i, "");
  if (!releaseId) return "";
  if (/^status\b/i.test(releaseId)) return "";
  if (/^(pending|not determined|declassified(?: in part)?|full release)$/i.test(releaseId)) return "";
  return releaseId;
}

function releaseIdForRecord(record, fallback = "") {
  const directReleaseId = cleanReleaseId(record.releaseId);
  if (directReleaseId) return directReleaseId;
  const fallbackReleaseId = cleanReleaseId(fallback);
  if (fallbackReleaseId) return fallbackReleaseId;
  const note = [record.provenanceNote, record.sourceNote].filter(Boolean).join(" ");
  const digitalMatch = note.match(/\bDigital Library release\s+(?!pending\b)([^;.]+)/i);
  if (digitalMatch) return cleanReleaseId(digitalMatch[1]);
  const legacyMatch = note.match(/(?:^|,\s*)release\s+(?!status\b)(.+?)(?:,\s*item|\.\s|$)/i);
  return legacyMatch ? cleanReleaseId(legacyMatch[1]) : "";
}

function releaseSentence(record) {
  const status = record.releaseStatus || "";
  if (/withheld|not declassified|denied/i.test(status)) return "Release status: Not declassified.";
  if (/partial|declassified in part/i.test(status)) return "Release status: Declassified in part.";
  if (/full/i.test(status)) return "Release status: Full release.";
  if (/declassified/i.test(status)) return "Release status: Declassified.";
  return "Release status: Not determined.";
}

function sourceParts(record) {
  return uniqueInOrder([
    "William J. Clinton Presidential Library",
    "Clinton Presidential Records",
    record.collection || record.source?.series
  ]);
}

function archivalPathParts(record) {
  return uniqueInOrder([
    record.archivalPath,
    record.archivalSeries,
    record.archivalSubseries,
    record.oaId ? `OA/ID ${record.oaId}` : "",
    record.box ? `Box ${record.box}` : "",
    record.folder ? `Folder: ${record.folder}` : "",
    record.documentFile ? `Document file: ${record.documentFile}` : ""
  ]);
}

function hasArchivalPath(record) {
  return archivalPathParts(record).length > 0;
}

function hasClassificationDraftingLine(record) {
  return Boolean(
    record.originalClassification ||
      record.classification ||
      record.distribution ||
      record.draftedBy ||
      record.draftingInfo ||
      record.approvalInfo
  );
}

function classificationDraftingSentence(record) {
  const parts = uniqueInOrder([
    record.originalClassification || record.classification || "",
    record.distribution ? `Distribution: ${record.distribution}` : "",
    record.draftingInfo || (record.draftedBy ? `Drafted by ${record.draftedBy}` : ""),
    record.approvalInfo
  ]);
  return parts.length
    ? parts.join(". ")
    : "Original classification, distribution, and drafting information pending.";
}

function sourceNoteForRecord(record, fallbackReleaseId = "") {
  const archivalPath = archivalPathParts(record).join(", ");
  return joinSentences([
    `Source: ${sourceParts(record).join(", ")}${archivalPath ? `, ${archivalPath}` : ""}`,
    hasArchivalPath(record) ? "" : "Archival container and folder pending",
    classificationDraftingSentence(record),
    releaseSentence(record)
  ]);
}

function provenanceLinksForRecord(record) {
  return uniqueInOrder([record.itemUrl, record.pdfUrl, record.collectionUrl, record.source?.url]);
}

function provenanceNoteForRecord(record, fallbackReleaseId = "") {
  const releaseId = releaseIdForRecord(record, fallbackReleaseId);
  const sourceNote = sourceNoteForRecord(record, fallbackReleaseId);
  const controls = uniqueInOrder([
    releaseId ? `Digital Library release ${releaseId}` : "Digital Library release pending",
    record.itemId ? `Digital Library item ${record.itemId}` : "",
    record.collectionId ? `Digital Library collection ${record.collectionId}` : ""
  ]).join("; ");
  const linkParts = uniqueInOrder([
    record.itemUrl ? `Digital item: ${record.itemUrl}` : "",
    record.pdfUrl ? `PDF: ${record.pdfUrl}` : "",
    record.collectionUrl ? `Collection: ${record.collectionUrl}` : ""
  ]).join("; ");
  return joinSentences([
    sourceNote,
    controls ? `Digital Library provenance controls: ${controls}` : "",
    linkParts ? `Review links: ${linkParts}` : ""
  ]);
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
  if (releaseId || record.itemId) issues.push("digital-release-item-not-archival-path");
  if (!hasArchivalPath(record)) issues.push("archival-container-folder-pending");
  if (!hasClassificationDraftingLine(record)) issues.push("classification-distribution-drafting-pending");
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
  if (issues.some((issue) => blockers.has(issue))) return NEEDS_METADATA_STATUS;
  return issues.some((issue) =>
    [
      "digital-release-item-not-archival-path",
      "archival-container-folder-pending",
      "classification-distribution-drafting-pending"
    ].includes(issue)
  )
    ? FRUS_SCAFFOLD_STATUS
    : FRUS_READY_STATUS;
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
    frusStyleCandidates: records.filter((record) => record.sourceNoteStatus === FRUS_READY_STATUS).length,
    sourceNoteScaffolds: records.filter((record) => record.sourceNoteStatus === FRUS_SCAFFOLD_STATUS).length,
    needsSourceNoteMetadata: records.filter((record) => record.sourceNoteStatus === NEEDS_METADATA_STATUS).length,
    legacyProvisionalNotesPresent: records.filter((record) =>
      /PDF cover sheet|compiler reconciliation|Clinton Digital Library/i.test(record.sourceNote || "")
    ).length,
    recordsWithSourceNoteUrls: records.filter((record) => /https?:\/\//i.test(record.sourceNote || "")).length,
    recordsWithProvenanceUrls: records.filter((record) => /https?:\/\//i.test(record.provenanceNote || "")).length,
    recordsWithDigitalProvenanceControls: records.filter((record) =>
      (record.sourceNoteIssues || []).includes("digital-release-item-not-archival-path")
    ).length,
    recordsRequiringArchivalPath: records.filter((record) =>
      (record.sourceNoteIssues || []).includes("archival-container-folder-pending")
    ).length,
    recordsRequiringClassificationDrafting: records.filter((record) =>
      (record.sourceNoteIssues || []).includes("classification-distribution-drafting-pending")
    ).length,
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
        "Published FRUS source notes begin with the archival chain, not a public web URL or digital catalog URL.",
        "Digital Library release and item IDs are provenance controls, not substitutes for box, folder, OA/ID, or file-title evidence.",
        "A published-style source note is not ready until the original classification, distribution, drafting, approval, and exact archival path have been verified.",
        "Keep URLs, item pages, PDF links, and collection links in provenanceNote/provenanceLinks.",
        "Keep source-note queue flags until the PDF cover sheet and finding aid confirm classification, drafting, approval, and exact archival path."
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
    `- ${audit.summary.frusStyleCandidates} records have complete URL-free published-style source notes ready for compiler review.`,
    `- ${audit.summary.sourceNoteScaffolds} records have FRUS provenance scaffolds that still need archival verification.`,
    `- ${audit.summary.needsSourceNoteMetadata} records need core source-note metadata before they can be normalized.`,
    `- ${audit.summary.legacyProvisionalNotesPresent} public source notes still contain legacy provisional wording.`,
    `- ${audit.summary.recordsWithSourceNoteUrls} public source notes contain URLs.`,
    `- ${audit.summary.recordsWithProvenanceUrls} provenance notes contain URLs for item/PDF review.`,
    `- ${audit.summary.recordsWithDigitalProvenanceControls} records keep Digital Library release/item IDs as provenance controls, not final archival paths.`,
    `- ${audit.summary.recordsRequiringArchivalPath} records still require archival container/folder verification.`,
    `- ${audit.summary.recordsRequiringClassificationDrafting} records still require original classification/distribution/drafting verification.`,
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
