const VOLUMES = window.CLINTON_EUROPE_VOLUMES || [];
const RECORDS = window.CLINTON_EUROPE_RECORDS || [];
const PUBLIC_STATEMENTS = window.CLINTON_EUROPE_PUBLIC_STATEMENTS || [];
const POTENTIAL_DOCUMENTS = window.CLINTON_EUROPE_POTENTIAL_DOCUMENTS || [];
const COMPILER_GAPS = window.CLINTON_EUROPE_COMPILER_GAPS || { summary: {}, gaps: [], metrics: {} };
const LIBRARY_RESEARCH = window.CLINTON_EUROPE_LIBRARY_RESEARCH || {
  summary: {},
  clusters: [],
  leads: [],
  pullStrategy: []
};

const SECTION_ORDER = [
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

const STATEMENT_SECTION_ORDER = [
  "NATO and European Security",
  "Balkans and Kosovo",
  "EU and Transatlantic",
  "Central and Eastern Europe",
  "Northern Ireland",
  "Western Europe Bilateral",
  "Russia Cross-Reference"
];

const POTENTIAL_SOURCE_ORDER = [
  "NARA Catalog 7388808",
  "NARA Scout",
  "Presidential Daily Diary",
  "Strobe Talbott FOIA"
];

const QUEUE_OPTIONS = [
  ["", "All queues"],
  ["source-note", "FRUS source note review"],
  ["pdf-missing", "PDF missing"],
  ["date-missing", "Date missing"],
  ["cross-volume", "Cross-volume review"],
  ["balkans-volume-check", "Balkans volume check"],
  ["russia-fsu-review", "Russia/FSU review"]
];

const volumeRoot = document.querySelector("#volume-root");
const statementsRoot = document.querySelector("#statements-root");
const potentialDocumentsRoot = document.querySelector("#potential-documents-root");
const compilerGapsRoot = document.querySelector("#compiler-gaps-root");
const libraryOverviewRoot = document.querySelector("#library-overview-root");
const libraryLeadsRoot = document.querySelector("#library-leads-root");
const triageRoot = document.querySelector("#triage-root");
const deskRoot = document.querySelector("#desk-root");
const recordsRoot = document.querySelector("#records-root");
const totalRecords = document.querySelector("#total-records");
const pdfLinkedCount = document.querySelector("#pdf-linked-count");
const highLevelCount = document.querySelector("#high-level-count");
const sourceGapCount = document.querySelector("#source-gap-count");
const potentialDocumentCount = document.querySelector("#potential-document-count");
const compilerGapCount = document.querySelector("#compiler-gap-count");
const libraryLeadCount = document.querySelector("#library-lead-count");
const documentSearch = document.querySelector("#document-search");
const documentSourceFilter = document.querySelector("#document-source-filter");
const documentYearFilter = document.querySelector("#document-year-filter");
const documentVolumeFilter = document.querySelector("#document-volume-filter");
const documentPriorityFilter = document.querySelector("#document-priority-filter");
const clearDocumentFilters = document.querySelector("#clear-document-filters");
const exportDocuments = document.querySelector("#export-documents");
const documentSummary = document.querySelector("#document-summary");
const librarySearch = document.querySelector("#library-search");
const libraryClusterFilter = document.querySelector("#library-cluster-filter");
const libraryPriorityFilter = document.querySelector("#library-priority-filter");
const clearLibraryFilters = document.querySelector("#clear-library-filters");
const exportLibrary = document.querySelector("#export-library");
const librarySummary = document.querySelector("#library-summary");
const searchInput = document.querySelector("#record-search");
const volumeFilter = document.querySelector("#volume-filter");
const recordYearFilter = document.querySelector("#record-year-filter");
const sectionFilter = document.querySelector("#section-filter");
const typeFilter = document.querySelector("#type-filter");
const queueFilter = document.querySelector("#queue-filter");
const clearFilters = document.querySelector("#clear-filters");
const exportRecords = document.querySelector("#export-records");
const recordsSummary = document.querySelector("#records-summary");

const volumeById = new Map(VOLUMES.map((volume) => [volume.id, volume]));
const libraryClusterById = new Map((LIBRARY_RESEARCH.clusters || []).map((cluster) => [cluster.id, cluster]));

function formatDate(dateString) {
  if (!dateString) return "Date pending";
  if (/^\d{4}$/.test(dateString)) return dateString;
  const date = new Date(`${dateString}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function shortDate(dateString) {
  return formatDate(dateString);
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
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
  const index = SECTION_ORDER.indexOf(section);
  return index === -1 ? SECTION_ORDER.length : index;
}

function bySectionThenDate(a, b) {
  return (
    sectionRank(a.section) - sectionRank(b.section) ||
    (a.sortDate || a.date || "").localeCompare(b.sortDate || b.date || "") ||
    (a.title || "").localeCompare(b.title || "")
  );
}

function chronologyDate(record) {
  return record.sortDate || record.date || "9999";
}

function byChronology(a, b) {
  return (
    chronologyDate(a).localeCompare(chronologyDate(b)) ||
    sectionRank(a.section) - sectionRank(b.section) ||
    (a.title || "").localeCompare(b.title || "")
  );
}

function chronologyYear(record) {
  const date = chronologyDate(record);
  return /^\d{4}/.test(date) ? date.slice(0, 4) : "Date pending";
}

function documentYear(item) {
  return /^\d{4}/.test(item.date || "") ? item.date.slice(0, 4) : "Date pending";
}

function primaryStatementSection(statement) {
  return statement.sections?.[0] || "Review";
}

function statementSectionRank(section) {
  const index = STATEMENT_SECTION_ORDER.indexOf(section);
  return index === -1 ? STATEMENT_SECTION_ORDER.length : index;
}

function byStatementSectionThenDate(a, b) {
  const aSection = primaryStatementSection(a);
  const bSection = primaryStatementSection(b);
  return (
    statementSectionRank(aSection) - statementSectionRank(bSection) ||
    (a.date || "").localeCompare(b.date || "") ||
    (a.title || "").localeCompare(b.title || "")
  );
}

function priorityRank(priority) {
  return { High: 0, Medium: 1, Review: 2, high: 0, medium: 1, review: 2 }[priority] ?? 3;
}

function potentialSourceRank(sourceType) {
  const index = POTENTIAL_SOURCE_ORDER.indexOf(sourceType);
  return index === -1 ? POTENTIAL_SOURCE_ORDER.length : index;
}

function byPotentialDocument(a, b) {
  return (
    potentialSourceRank(a.sourceType) - potentialSourceRank(b.sourceType) ||
    priorityRank(a.priority) - priorityRank(b.priority) ||
    (b.score || 0) - (a.score || 0) ||
    (a.date || "9999").localeCompare(b.date || "9999") ||
    (a.title || "").localeCompare(b.title || "")
  );
}

function displayVolume(record) {
  return (record.volumeIds || [])
    .map((id) => volumeById.get(id)?.number || id)
    .join(", ");
}

function displayVolumeLabels(record) {
  if (record.volumeLabels?.length) return record.volumeLabels.map((label) => label.replace("Volume ", "")).join(", ");
  return displayVolume(record);
}

function addOptions(select, values, label) {
  if (!select) return;
  select.replaceChildren(new Option(label, ""), ...values.map((value) => new Option(value, value)));
}

function yearOptions(values) {
  const years = uniqueSorted(values.filter((value) => /^\d{4}$/.test(value)));
  return values.includes("Date pending") ? [...years, "Date pending"] : years;
}

function csvValue(value) {
  const text = Array.isArray(value) ? value.join("; ") : value ?? "";
  return `"${String(text).replaceAll('"', '""')}"`;
}

function csvRows(rows, columns) {
  return [
    columns.map((column) => csvValue(column.label)).join(","),
    ...rows.map((row) => columns.map((column) => csvValue(column.value(row))).join(","))
  ].join("\n");
}

function downloadCsv(fileName, rows, columns) {
  const csv = `${csvRows(rows, columns)}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function renderVolumes() {
  if (!volumeRoot) return;
  const cards = VOLUMES.map((volume) => {
    const card = document.createElement("a");
    card.className = "volume-card";
    card.href = volume.url;
    card.rel = "noreferrer";

    const number = document.createElement("p");
    number.className = "volume-number";
    number.textContent = `Volume ${volume.number}`;

    const title = document.createElement("h3");
    title.textContent = volume.title;

    const subtitle = document.createElement("p");
    subtitle.textContent = volume.subtitle;

    const status = document.createElement("span");
    status.className = `volume-status ${/planned/i.test(volume.status) ? "planned" : ""}`;
    status.textContent = volume.status;

    const role = document.createElement("p");
    role.textContent = volume.role;

    const focus = document.createElement("div");
    focus.className = "volume-focus";
    for (const item of volume.focus || []) {
      const chip = document.createElement("span");
      chip.textContent = item;
      focus.append(chip);
    }

    card.append(number, title, subtitle, status, role, focus);
    return card;
  });
  volumeRoot.replaceChildren(...cards);
}

function statementCode(statement, index) {
  return `PS ${String(index + 1).padStart(3, "0")}`;
}

function createStatementRow(statement, index) {
  const row = document.createElement("article");
  row.className = "statement-row";

  const dateStack = document.createElement("div");
  dateStack.className = "record-date-stack";

  const number = document.createElement("span");
  number.className = "record-doc-number";
  number.textContent = statementCode(statement, index);

  const date = document.createElement("time");
  date.className = "record-date";
  if (statement.date) date.dateTime = statement.date;
  date.textContent = shortDate(statement.date);
  dateStack.append(number, date);

  const body = document.createElement("div");
  const title = document.createElement("a");
  title.className = "record-title";
  title.href = statement.detailsUrl || statement.textUrl || statement.pdfUrl || "#";
  title.rel = "noreferrer";
  title.textContent = statement.title;

  const sourceLine = document.createElement("p");
  sourceLine.className = "record-source-line";
  sourceLine.textContent = `GovInfo Public Papers / ${statement.packageId || "Clinton"}`;

  const note = document.createElement("p");
  note.className = "record-note";
  note.textContent =
    statement.notes ||
    "Public statement flagged for comparison with the FRUS documentary chronology.";

  const meta = createChipList(
    [
      statement.priority ? `${statement.priority} priority` : "",
      ...(statement.sections || []),
      displayVolume(statement) ? `Vol. ${displayVolume(statement)}` : ""
    ],
    "record-meta",
    10
  );

  const topics = createChipList(statement.topics || [], "record-topics", 8);
  body.append(title, sourceLine, note, meta, topics);

  const links = document.createElement("div");
  links.className = "record-links";
  for (const [label, url] of [
    ["Details", statement.detailsUrl],
    ["Text", statement.textUrl],
    ["PDF", statement.pdfUrl]
  ]) {
    if (!url) continue;
    const link = document.createElement("a");
    link.href = url;
    link.rel = "noreferrer";
    link.textContent = label;
    links.append(link);
  }

  row.append(dateStack, body, links);
  return row;
}

function renderStatements() {
  if (!statementsRoot) return;

  if (!PUBLIC_STATEMENTS.length) {
    const empty = document.createElement("p");
    empty.className = "empty-section";
    empty.textContent =
      "No public statements have been generated yet. Run node scripts/harvest-clinton-public-statements.js to build the dataset.";
    statementsRoot.replaceChildren(empty);
    return;
  }

  const sorted = [...PUBLIC_STATEMENTS].sort(byStatementSectionThenDate);
  const statementNumbers = new Map(sorted.map((statement, index) => [statement.id, index]));
  const sectionNames = uniqueInOrder([
    ...STATEMENT_SECTION_ORDER,
    ...sorted.map(primaryStatementSection)
  ]).filter((section) => sorted.some((statement) => primaryStatementSection(statement) === section));

  const sections = sectionNames.map((sectionName) => {
    const sectionStatements = sorted.filter(
      (statement) => primaryStatementSection(statement) === sectionName
    );
    const section = document.createElement("section");
    section.className = "record-section statement-section";
    section.id = `statements-${sectionName.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-")}`;

    const header = document.createElement("div");
    header.className = "record-section-header";
    const heading = document.createElement("h3");
    heading.textContent = sectionName;
    const count = document.createElement("p");
    count.className = "record-count";
    count.textContent = `${sectionStatements.length} statements`;
    header.append(heading, count);

    const list = document.createElement("div");
    list.className = "record-list statement-list";
    for (const statement of sectionStatements) {
      list.append(createStatementRow(statement, statementNumbers.get(statement.id) || 0));
    }

    section.append(header, list);
    return section;
  });

  statementsRoot.replaceChildren(...sections);
}

function prepareRecords(records) {
  return [...records]
    .sort(byChronology)
    .map((record, index) => ({
      ...record,
      compilerNumber: `CE ${String(index + 1).padStart(3, "0")}`
    }));
}

let allRecords = prepareRecords(RECORDS);

function populateFilters(records) {
  addOptions(
    volumeFilter,
    VOLUMES.map((volume) => volume.id),
    "All volumes"
  );
  if (volumeFilter) {
    [...volumeFilter.options].forEach((option) => {
      if (!option.value) return;
      option.textContent = `Volume ${volumeById.get(option.value)?.number || option.value}`;
    });
  }
  addOptions(recordYearFilter, yearOptions(records.map(chronologyYear)), "All years");
  addOptions(sectionFilter, uniqueInOrder([...SECTION_ORDER, ...records.map((record) => record.section)]), "All sections");
  addOptions(typeFilter, uniqueSorted(records.map((record) => record.type)), "All types");
  if (queueFilter) {
    queueFilter.replaceChildren(...QUEUE_OPTIONS.map(([value, label]) => new Option(label, value)));
  }
}

function recordSearchText(record) {
  return [
    record.compilerNumber,
    record.title,
    record.type,
    record.section,
    record.releaseStatus,
    record.itemId,
    record.collection,
    record.sourceNote,
    record.provenanceNote,
    record.sourceNoteStatus,
    record.notes,
    displayVolume(record),
    ...(record.countries || []),
    ...(record.subjects || []),
    ...(record.topics || []),
    ...(record.sourceNoteIssues || []),
    ...(record.queues || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterRecords(records) {
  const query = searchInput?.value.trim().toLowerCase() || "";
  const volume = volumeFilter?.value || "";
  const year = recordYearFilter?.value || "";
  const section = sectionFilter?.value || "";
  const type = typeFilter?.value || "";
  const queue = queueFilter?.value || "";

  return records.filter((record) => {
    if (volume && !(record.volumeIds || []).includes(volume)) return false;
    if (year && chronologyYear(record) !== year) return false;
    if (section && record.section !== section) return false;
    if (type && record.type !== type) return false;
    if (queue && !(record.queues || []).includes(queue)) return false;
    return !query || recordSearchText(record).includes(query);
  });
}

function exportCurrentRecords() {
  const rows = filterRecords(allRecords).sort(byChronology);
  downloadCsv(`clinton-europe-records-${exportDateStamp()}.csv`, rows, [
    { label: "compiler_number", value: (record) => record.compilerNumber },
    { label: "date", value: (record) => record.date || record.sortDate },
    { label: "year", value: (record) => chronologyYear(record) },
    { label: "title", value: (record) => record.title },
    { label: "type", value: (record) => record.type },
    { label: "section", value: (record) => record.section },
    { label: "volumes", value: (record) => displayVolume(record) },
    { label: "countries", value: (record) => record.countries || [] },
    { label: "queues", value: (record) => (record.queues || []).map(queueLabel) },
    { label: "source_note_status", value: (record) => record.sourceNoteStatus },
    { label: "source_note_issues", value: (record) => record.sourceNoteIssues || [] },
    { label: "source_note", value: (record) => record.sourceNote },
    { label: "item_url", value: (record) => record.itemUrl },
    { label: "pdf_url", value: (record) => record.pdfUrl },
    { label: "collection_url", value: (record) => record.collectionUrl }
  ]);
}

function setStats(records) {
  const pdfs = records.filter((record) => record.pdfUrl).length;
  const highLevel = records.filter((record) => (record.volumeIds || []).includes("frus1993-00v22")).length;
  const sourceGaps = records.filter((record) => (record.queues || []).includes("source-note")).length;
  if (totalRecords) totalRecords.textContent = records.length.toString();
  if (pdfLinkedCount) pdfLinkedCount.textContent = pdfs.toString();
  if (highLevelCount) highLevelCount.textContent = highLevel.toString();
  if (sourceGapCount) sourceGapCount.textContent = sourceGaps.toString();
  if (potentialDocumentCount) potentialDocumentCount.textContent = POTENTIAL_DOCUMENTS.length.toString();
  if (compilerGapCount) compilerGapCount.textContent = (COMPILER_GAPS.gaps || []).length.toString();
  if (libraryLeadCount) libraryLeadCount.textContent = (LIBRARY_RESEARCH.leads || []).length.toString();
}

function createMetric(label, value, detail) {
  const card = document.createElement("article");
  card.className = "desk-card";
  const valueNode = document.createElement("strong");
  valueNode.textContent = value;
  const labelNode = document.createElement("span");
  labelNode.textContent = label;
  const detailNode = document.createElement("p");
  detailNode.textContent = detail;
  card.append(valueNode, labelNode, detailNode);
  return card;
}

function countBy(records, getter) {
  const counts = new Map();
  for (const record of records) {
    const key = getter(record) || "Unspecified";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function queueButton(queue, label, count) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "queue-button";
  button.textContent = `${label} (${count})`;
  button.addEventListener("click", () => {
    if (queueFilter) queueFilter.value = queue;
    updateRecordsView();
    document.querySelector("#records")?.scrollIntoView({ block: "start" });
  });
  return button;
}

function severityClass(severity) {
  return `severity-${(severity || "review").toLowerCase().replaceAll(" ", "-")}`;
}

function applyRelatedFilter(filter) {
  if (!filter?.target) return;

  if (filter.target === "anchor") {
    document.querySelector(filter.selector)?.scrollIntoView({ block: "start" });
    return;
  }

  if (filter.target === "records") {
    if (searchInput) searchInput.value = filter.search || "";
    if (volumeFilter) volumeFilter.value = filter.volumeId || "";
    if (recordYearFilter) recordYearFilter.value = filter.year || "";
    if (sectionFilter) sectionFilter.value = filter.section || "";
    if (typeFilter) typeFilter.value = filter.type || "";
    if (queueFilter) queueFilter.value = filter.queue || "";
    updateRecordsView();
    document.querySelector("#records")?.scrollIntoView({ block: "start" });
    return;
  }

  if (filter.target === "documents") {
    if (documentSearch) documentSearch.value = filter.search || "";
    if (documentVolumeFilter) documentVolumeFilter.value = filter.volumeId || "";
    if (documentYearFilter) documentYearFilter.value = filter.year || "";
    if (documentSourceFilter) documentSourceFilter.value = filter.sourceType || "";
    if (documentPriorityFilter) documentPriorityFilter.value = filter.priority || "";
    updatePotentialDocumentsView();
    document.querySelector("#potential-documents")?.scrollIntoView({ block: "start" });
    return;
  }

  if (filter.target === "library") {
    if (librarySearch) librarySearch.value = filter.search || "";
    if (libraryClusterFilter) libraryClusterFilter.value = filter.clusterId || "";
    if (libraryPriorityFilter) libraryPriorityFilter.value = filter.priority || "";
    updateLibraryView();
    document.querySelector("#library-research")?.scrollIntoView({ block: "start" });
    return;
  }

  if (filter.target === "statements") {
    document.querySelector("#statements")?.scrollIntoView({ block: "start" });
  }
}

function createTriageAction(action) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = action.label;
  button.addEventListener("click", () => applyRelatedFilter(action));
  return button;
}

function createTriageCard(card) {
  const article = document.createElement("article");
  article.className = `triage-card ${severityClass(card.severity)}`;

  const header = document.createElement("div");
  header.className = "gap-card-header";
  const severity = document.createElement("span");
  severity.className = "gap-severity";
  severity.textContent = card.severity;
  const area = document.createElement("span");
  area.className = "gap-area";
  area.textContent = card.area;
  header.append(severity, area);

  const count = document.createElement("strong");
  count.className = "triage-count";
  count.textContent = card.count;

  const title = document.createElement("h3");
  title.textContent = card.title;

  const detail = document.createElement("p");
  detail.className = "gap-risk";
  detail.textContent = card.detail;

  const actions = document.createElement("div");
  actions.className = "gap-actions";
  for (const action of card.actions || []) actions.append(createTriageAction(action));

  article.append(header, count, title, detail);
  if (actions.children.length) article.append(actions);
  return article;
}

function renderTriage() {
  if (!triageRoot) return;

  const sourceReviewRecords = allRecords.filter((record) => (record.queues || []).includes("source-note"));
  const crossVolumeRecords = allRecords.filter((record) => (record.queues || []).includes("cross-volume"));
  const highLevelContacts = allRecords.filter((record) => (record.volumeIds || []).includes("frus1993-00v22"));
  const undatedPotential = POTENTIAL_DOCUMENTS.filter((item) => !item.date);
  const undatedHigh = undatedPotential.filter((item) => /high/i.test(item.priority || ""));
  const pddLeads = POTENTIAL_DOCUMENTS.filter((item) => item.sourceType === "Presidential Daily Diary");
  const pddHigh = pddLeads.filter((item) => /high/i.test(item.priority || ""));
  const libraryLeads = LIBRARY_RESEARCH.leads || [];
  const libraryHigh = libraryLeads.filter((lead) => /high/i.test(lead.priority || ""));
  const publicHigh = PUBLIC_STATEMENTS.filter((statement) => /high/i.test(statement.priority || ""));

  const cards = [
    {
      severity: "Critical",
      area: "Source Notes",
      count: sourceReviewRecords.length.toString(),
      title: "Verify cover sheets before keeper selection",
      detail:
        "Every declassified memcon/telcon is a candidate source note, but the archival box/folder and classification-control line still need PDF cover-sheet confirmation.",
      actions: [
        { label: "Open source-note queue", target: "records", queue: "source-note" },
        { label: "Open chronology", target: "anchor", selector: "#records" }
      ]
    },
    {
      severity: "High",
      area: "Volume Placement",
      count: `${highLevelContacts.length}`,
      title: "Separate XXII keepers from policy-volume cross-references",
      detail: `${crossVolumeRecords.length} high-level contact records also carry policy-volume review flags. Use this pass to mark full-text keepers versus cross-reference-only items.`,
      actions: [
        { label: "XXII contacts", target: "records", volumeId: "frus1993-00v22" },
        { label: "XXIII band", target: "records", volumeId: "frus1993-00v23" },
        { label: "XXIV band", target: "records", volumeId: "frus1993-00v24" }
      ]
    },
    {
      severity: "Critical",
      area: "Chronology Control",
      count: `${undatedHigh.length}/${undatedPotential.length}`,
      title: "Date the external lead pool",
      detail:
        "Undated NARA and FOIA leads are the easiest way for a strong document to disappear from the chronology. Date high-priority entries first, then split the Balkans/Kosovo cluster by year.",
      actions: [
        { label: "High undated leads", target: "documents", year: "Date pending", priority: "High" },
        { label: "Balkans leads", target: "documents", search: "Balkans and Kosovo" }
      ]
    },
    {
      severity: "High",
      area: "Daily Diary",
      count: `${pddHigh.length}/${pddLeads.length}`,
      title: "Use PDD entries to confirm calls, meetings, and missing memcons",
      detail:
        "Presidential Daily Diary hits identify Europe-facing calls and meetings that may require a matching memcon, telcon, briefing book, or public-statement anchor.",
      actions: [
        { label: "PDD source leads", target: "documents", sourceType: "Presidential Daily Diary" },
        { label: "High-priority PDD", target: "documents", sourceType: "Presidential Daily Diary", priority: "High" }
      ]
    },
    {
      severity: "Critical",
      area: "Library Visit",
      count: `${libraryHigh.length}/${libraryLeads.length}`,
      title: "Turn the Clinton Library trip into clustered pulls",
      detail:
        "The finding aids now point to high-yield box/folder runs. Start with decision-control, PC/DC, trip-book, NATO, Kosovo, and Northern Ireland clusters before browsing context files.",
      actions: [
        { label: "High-priority pulls", target: "library", priority: "High" },
        { label: "PC/DC cluster", target: "library", clusterId: "pc-dc-policy-control" },
        { label: "NATO summit cluster", target: "library", clusterId: "nato-eu-summits" }
      ]
    },
    {
      severity: "Medium",
      area: "Public Context",
      count: `${publicHigh.length}/${PUBLIC_STATEMENTS.length}`,
      title: "Align public statements with the documentary chronology",
      detail:
        "Use public papers as date anchors and policy framing, not substitutes for internal records. High-priority statements flag speeches, joint declarations, and crisis messaging likely to frame selection.",
      actions: [
        { label: "Open statements", target: "statements" },
        { label: "Public source paths", target: "anchor", selector: "#sources" }
      ]
    }
  ];

  triageRoot.replaceChildren(...cards.map(createTriageCard));
}

function createGapList(title, items) {
  const wrap = document.createElement("div");
  wrap.className = "gap-list";
  const heading = document.createElement("h4");
  heading.textContent = title;
  const list = document.createElement("ul");
  for (const item of items || []) {
    const li = document.createElement("li");
    li.textContent = item;
    list.append(li);
  }
  wrap.append(heading, list);
  return wrap;
}

function createGapCard(gap) {
  const card = document.createElement("article");
  card.className = `gap-card ${severityClass(gap.severity)}`;

  const header = document.createElement("div");
  header.className = "gap-card-header";

  const severity = document.createElement("span");
  severity.className = "gap-severity";
  severity.textContent = gap.severity || "Review";

  const area = document.createElement("span");
  area.className = "gap-area";
  area.textContent = gap.area || "Compiler Review";

  header.append(severity, area);

  const title = document.createElement("h3");
  title.textContent = gap.title;

  const risk = document.createElement("p");
  risk.className = "gap-risk";
  risk.textContent = gap.compilerRisk || "Compiler risk note pending.";

  const body = document.createElement("div");
  body.className = "gap-body";
  body.append(createGapList("Evidence", gap.evidence), createGapList("Next Steps", gap.nextSteps));

  const actions = document.createElement("div");
  actions.className = "gap-actions";
  for (const related of gap.relatedFilters || []) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = related.label;
    button.addEventListener("click", () => applyRelatedFilter(related));
    actions.append(button);
  }

  card.append(header, title, risk, body);
  if (actions.children.length) card.append(actions);
  return card;
}

function renderCompilerGaps() {
  if (!compilerGapsRoot) return;
  const gaps = COMPILER_GAPS.gaps || [];

  if (!gaps.length) {
    const empty = document.createElement("p");
    empty.className = "empty-section";
    empty.textContent = "No compiler gap analysis has been generated yet. Run node scripts/build-compiler-gaps.js to build the dataset.";
    compilerGapsRoot.replaceChildren(empty);
    return;
  }

  const summary = COMPILER_GAPS.summary || {};
  const metrics = document.createElement("div");
  metrics.className = "gap-overview";
  metrics.append(
    createMetric("Critical gaps", String(summary.criticalGaps || 0), "Issues that can invalidate chronology or source-note control."),
    createMetric("High gaps", String(summary.highGaps || 0), "Coverage gaps that can skew selection or chapter balance."),
    createMetric("Medium gaps", String(summary.mediumGaps || 0), "Scope-control risks for focused follow-up."),
    createMetric("Generated gaps", String(summary.totalGaps || gaps.length), "Compiler-risk judgments backed by harvested counts.")
  );

  const list = document.createElement("div");
  list.className = "gap-grid";
  for (const gap of gaps) list.append(createGapCard(gap));

  compilerGapsRoot.replaceChildren(metrics, list);
}

function renderDesk(records) {
  if (!deskRoot) return;
  const sorted = [...records].sort(byChronology);
  const dateSpan = sorted.length
    ? `${formatDate(sorted.find((record) => record.date)?.date)} to ${formatDate([...sorted].reverse().find((record) => record.date)?.date)}`
    : "No dated records";
  const pdfs = records.filter((record) => record.pdfUrl);
  const sourceReview = records.filter((record) => (record.queues || []).includes("source-note"));
  const dateMissing = records.filter((record) => (record.queues || []).includes("date-missing"));
  const crossVolume = records.filter((record) => (record.queues || []).includes("cross-volume"));

  const metrics = document.createElement("div");
  metrics.className = "desk-metrics";
  metrics.append(
    createMetric("Candidate records", records.length.toString(), "Europe-relevant memcon and telcon leads in the working set."),
    createMetric("PDF links", `${pdfs.length}/${records.length}`, "Direct Clinton Digital Library PDF references harvested from item pages."),
    createMetric("Source reviews", sourceReview.length.toString(), "Records that still need FRUS-style archival source-note reconciliation."),
    createMetric("Date span", dateSpan, "Chronological control uses the item-page document date.")
  );

  const queues = document.createElement("div");
  queues.className = "desk-panel";
  const queuesTitle = document.createElement("h3");
  queuesTitle.textContent = "Queue Shortcuts";
  const queueList = document.createElement("div");
  queueList.className = "queue-buttons";
  for (const [queue, label] of QUEUE_OPTIONS.filter(([value]) => value)) {
    const count = records.filter((record) => (record.queues || []).includes(queue)).length;
    queueList.append(queueButton(queue, label, count));
  }
  queues.append(queuesTitle, queueList);

  const sections = document.createElement("div");
  sections.className = "desk-panel";
  const sectionsTitle = document.createElement("h3");
  sectionsTitle.textContent = "Section Mix";
  const sectionList = document.createElement("ol");
  sectionList.className = "desk-list";
  for (const [section, count] of countBy(records, (record) => record.section)) {
    const item = document.createElement("li");
    item.textContent = `${section}: ${count}`;
    sectionList.append(item);
  }
  sections.append(sectionsTitle, sectionList);

  const split = document.createElement("div");
  split.className = "desk-panel desk-panel-wide";
  const splitTitle = document.createElement("h3");
  splitTitle.textContent = "Volume Placement";
  const splitList = document.createElement("ol");
  splitList.className = "desk-list";
  for (const volume of VOLUMES) {
    const count = records.filter((record) => (record.volumeIds || []).includes(volume.id)).length;
    const item = document.createElement("li");
    item.textContent = `Volume ${volume.number}, ${volume.title}: ${count} linked records`;
    splitList.append(item);
  }
  const dateItem = document.createElement("li");
  dateItem.textContent = `Date review queue: ${dateMissing.length}; cross-volume review queue: ${crossVolume.length}`;
  splitList.append(dateItem);
  split.append(splitTitle, splitList);

  deskRoot.replaceChildren(metrics, queues, sections, split);
}

function createChipList(values, className, limit = 8) {
  const list = document.createElement("div");
  list.className = className;
  for (const value of uniqueInOrder(values).slice(0, limit)) {
    const item = document.createElement("span");
    item.textContent = value;
    list.append(item);
  }
  return list;
}

function populateLibraryFilters() {
  addOptions(
    libraryClusterFilter,
    (LIBRARY_RESEARCH.clusters || []).map((cluster) => cluster.id),
    "All clusters"
  );
  if (libraryClusterFilter) {
    [...libraryClusterFilter.options].forEach((option) => {
      if (!option.value) return;
      option.textContent = libraryClusterById.get(option.value)?.title || option.value;
    });
  }
  addOptions(libraryPriorityFilter, uniqueSorted((LIBRARY_RESEARCH.leads || []).map((lead) => lead.priority)), "All priorities");
}

function librarySearchText(lead) {
  return [
    lead.release,
    lead.part,
    lead.page,
    lead.line,
    lead.box,
    lead.folder,
    lead.notes,
    lead.priority,
    lead.score,
    ...(lead.clusterLabels || []),
    ...(lead.clusterIds || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterLibraryLeads(leads) {
  const query = librarySearch?.value.trim().toLowerCase() || "";
  const cluster = libraryClusterFilter?.value || "";
  const priority = libraryPriorityFilter?.value || "";

  return leads.filter((lead) => {
    if (cluster && !(lead.clusterIds || []).includes(cluster)) return false;
    if (priority && lead.priority !== priority) return false;
    return !query || librarySearchText(lead).includes(query);
  });
}

function sortLibraryLeads(leads) {
  return [...leads].sort(
    (a, b) => (b.score || 0) - (a.score || 0) || a.box.localeCompare(b.box) || a.folder.localeCompare(b.folder)
  );
}

function exportCurrentLibraryLeads() {
  const rows = sortLibraryLeads(filterLibraryLeads(LIBRARY_RESEARCH.leads || []));
  downloadCsv(`clinton-library-pull-leads-${exportDateStamp()}.csv`, rows, [
    { label: "priority", value: (lead) => lead.priority },
    { label: "score", value: (lead) => lead.score },
    { label: "box", value: (lead) => lead.box },
    { label: "folder", value: (lead) => lead.folder },
    { label: "cluster_labels", value: (lead) => lead.clusterLabels || [] },
    { label: "release", value: (lead) => lead.release },
    { label: "finding_aid_part", value: (lead) => lead.part },
    { label: "page", value: (lead) => lead.page },
    { label: "line", value: (lead) => lead.line },
    { label: "office_notes", value: (lead) => lead.notes }
  ]);
}

function createLibraryClusterCard(cluster) {
  const card = document.createElement("article");
  card.className = `library-cluster-card ${severityClass(cluster.priority)}`;

  const header = document.createElement("div");
  header.className = "gap-card-header";
  const priority = document.createElement("span");
  priority.className = "gap-severity";
  priority.textContent = cluster.priority;
  const section = document.createElement("span");
  section.className = "gap-area";
  section.textContent = cluster.section;
  header.append(priority, section);

  const title = document.createElement("h3");
  title.textContent = cluster.title;

  const rationale = document.createElement("p");
  rationale.className = "gap-risk";
  rationale.textContent = cluster.rationale;

  const boxes = createChipList(
    (cluster.topBoxes || []).slice(0, 8).map((box) => `OA ${box.box}: ${box.count}`),
    "record-meta",
    8
  );

  const list = document.createElement("ol");
  list.className = "library-representative-list";
  for (const lead of (cluster.representativeLeads || []).slice(0, 4)) {
    const item = document.createElement("li");
    item.textContent = `OA ${lead.box}: ${lead.folder}`;
    list.append(item);
  }

  const actions = document.createElement("div");
  actions.className = "gap-actions";
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Filter leads";
  button.addEventListener("click", () => {
    if (libraryClusterFilter) libraryClusterFilter.value = cluster.id;
    updateLibraryView();
    document.querySelector("#library-research")?.scrollIntoView({ block: "start" });
  });
  actions.append(button);

  card.append(header, title, rationale, boxes, list, actions);
  return card;
}

function renderLibraryOverview() {
  if (!libraryOverviewRoot) return;
  const summary = LIBRARY_RESEARCH.summary || {};
  const clusters = LIBRARY_RESEARCH.clusters || [];

  if (!clusters.length) {
    const empty = document.createElement("p");
    empty.className = "empty-section";
    empty.textContent = "No Clinton Library research plan has been generated yet. Run node scripts/build-clinton-library-research.js to build the dataset.";
    libraryOverviewRoot.replaceChildren(empty);
    return;
  }

  const metrics = document.createElement("div");
  metrics.className = "library-metrics";
  metrics.append(
    createMetric("Finding-aid rows", String(summary.rowsParsed || 0), "Rows parsed from the four 2013-0185-M finding-aid parts."),
    createMetric("Pull leads", String(summary.leadCount || 0), "Europe-relevant folder leads selected for on-site review."),
    createMetric("High priority", String(summary.highPriorityLeads || 0), "Decision, trip, briefing, and dense staff-run folders."),
    createMetric("Clusters", String(summary.clusterCount || clusters.length), "Research batches for reading-room pull strategy.")
  );

  const strategy = document.createElement("ol");
  strategy.className = "library-strategy";
  for (const item of LIBRARY_RESEARCH.pullStrategy || []) {
    const li = document.createElement("li");
    li.textContent = item;
    strategy.append(li);
  }

  const grid = document.createElement("div");
  grid.className = "library-cluster-grid";
  for (const cluster of clusters) grid.append(createLibraryClusterCard(cluster));

  libraryOverviewRoot.replaceChildren(metrics, strategy, grid);
}

function createLibraryLeadRow(lead) {
  const row = document.createElement("article");
  row.className = "document-row library-row";

  const stack = document.createElement("div");
  stack.className = "record-date-stack";
  const number = document.createElement("span");
  number.className = "record-doc-number";
  number.textContent = `OA ${lead.box}`;
  const locator = document.createElement("span");
  locator.className = "record-date";
  locator.textContent = `P${lead.part} p.${lead.page}`;
  stack.append(number, locator);

  const body = document.createElement("div");
  const title = document.createElement("h3");
  title.className = "library-lead-title";
  title.textContent = lead.folder;

  const sourceLine = document.createElement("p");
  sourceLine.className = "record-source-line";
  sourceLine.textContent = `${lead.release || "2013-0185-M"} / ${lead.notes || "Office note pending"}`;

  const note = document.createElement("p");
  note.className = "record-note";
  note.textContent = `Finding-aid part ${lead.part}, page ${lead.page}, line ${lead.line}. Pull with adjacent folders in OA ${lead.box} when time allows.`;

  const meta = createChipList(
    [
      lead.priority ? `${lead.priority} priority` : "",
      lead.score ? `score ${lead.score}` : "",
      ...(lead.clusterLabels || [])
    ],
    "record-meta",
    10
  );

  body.append(title, sourceLine, note, meta);

  const links = document.createElement("div");
  links.className = "record-links";
  const tag = document.createElement("span");
  tag.textContent = "Pull folder";
  links.append(tag);

  row.append(stack, body, links);
  return row;
}

function renderLibraryLeads(leads) {
  if (!libraryLeadsRoot) return;
  libraryLeadsRoot.replaceChildren();

  if (!leads.length) {
    const empty = document.createElement("p");
    empty.className = "empty-section";
    empty.textContent = (LIBRARY_RESEARCH.leads || []).length
      ? "No Clinton Library finding-aid leads match the current filters."
      : "No Clinton Library finding-aid leads have been generated yet.";
    libraryLeadsRoot.append(empty);
    return;
  }

  const sections = uniqueInOrder(
    (LIBRARY_RESEARCH.clusters || []).map((cluster) => cluster.id)
  ).filter((clusterId) => leads.some((lead) => (lead.clusterIds || []).includes(clusterId)));
  const hasNarrowFilter = Boolean(
    librarySearch?.value.trim() || libraryClusterFilter?.value || libraryPriorityFilter?.value
  );
  const leadLimit = hasNarrowFilter ? 80 : 30;

  for (const clusterId of sections) {
    const cluster = libraryClusterById.get(clusterId);
    const clusterLeads = leads.filter((lead) => (lead.clusterIds || []).includes(clusterId));
    const section = document.createElement("section");
    section.className = "record-section library-lead-section";

    const header = document.createElement("div");
    header.className = "record-section-header";
    const heading = document.createElement("h3");
    heading.textContent = cluster?.title || clusterId;
    const count = document.createElement("p");
    count.className = "record-count";
    count.textContent = `${clusterLeads.length} leads`;
    header.append(heading, count);

    const list = document.createElement("div");
    list.className = "record-list";
    for (const lead of clusterLeads.slice(0, leadLimit)) list.append(createLibraryLeadRow(lead));

    if (clusterLeads.length > leadLimit) {
      const truncated = document.createElement("p");
      truncated.className = "empty-section";
      truncated.textContent = `Showing the first ${leadLimit} ${cluster?.title || clusterId} leads. Narrow the search to see more precise pull targets.`;
      list.append(truncated);
    }

    section.append(header, list);
    libraryLeadsRoot.append(section);
  }
}

function updateLibrarySummary(leads) {
  if (!librarySummary) return;
  const cluster = libraryClusterFilter?.selectedOptions?.[0]?.textContent || "All clusters";
  const priority = libraryPriorityFilter?.selectedOptions?.[0]?.textContent || "All priorities";
  librarySummary.textContent = `Showing ${leads.length} of ${(LIBRARY_RESEARCH.leads || []).length} Clinton Library pull leads / ${cluster} / ${priority}`;
}

function updateLibraryView() {
  const filtered = sortLibraryLeads(filterLibraryLeads(LIBRARY_RESEARCH.leads || []));
  updateLibrarySummary(filtered);
  renderLibraryLeads(filtered);
}

function populateDocumentFilters(documents) {
  addOptions(
    documentSourceFilter,
    uniqueInOrder([...POTENTIAL_SOURCE_ORDER, ...documents.map((item) => item.sourceType)]),
    "All sources"
  );
  addOptions(documentYearFilter, yearOptions(documents.map(documentYear)), "All years");
  addOptions(
    documentVolumeFilter,
    VOLUMES.map((volume) => volume.id),
    "All volumes"
  );
  if (documentVolumeFilter) {
    [...documentVolumeFilter.options].forEach((option) => {
      if (!option.value) return;
      option.textContent = `Volume ${volumeById.get(option.value)?.number || option.value}`;
    });
  }
  addOptions(documentPriorityFilter, uniqueSorted(documents.map((item) => item.priority)), "All priorities");
}

function potentialDocumentSearchText(item) {
  return [
    item.title,
    item.date,
    item.date ? "" : "Date pending",
    item.sourceType,
    item.sourceRepository,
    item.sourceCollection,
    item.identifier,
    item.naid,
    item.level,
    item.category,
    item.releaseStatus,
    item.summary,
    item.score,
    ...(item.sections || []),
    ...(item.volumeLabels || []),
    ...(item.volumeIds || []),
    ...(item.matchedQueries || []),
    ...(item.sourceRuns || []),
    ...(item.topics || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterPotentialDocuments(documents) {
  const query = documentSearch?.value.trim().toLowerCase() || "";
  const source = documentSourceFilter?.value || "";
  const year = documentYearFilter?.value || "";
  const volume = documentVolumeFilter?.value || "";
  const priority = documentPriorityFilter?.value || "";

  return documents.filter((item) => {
    if (source && item.sourceType !== source) return false;
    if (year && documentYear(item) !== year) return false;
    if (volume && !(item.volumeIds || []).includes(volume)) return false;
    if (priority && item.priority !== priority) return false;
    return !query || potentialDocumentSearchText(item).includes(query);
  });
}

function exportCurrentPotentialDocuments() {
  const rows = filterPotentialDocuments(POTENTIAL_DOCUMENTS).sort(byPotentialDocument);
  downloadCsv(`clinton-europe-source-leads-${exportDateStamp()}.csv`, rows, [
    { label: "date", value: (item) => item.date || "Date pending" },
    { label: "year", value: (item) => documentYear(item) },
    { label: "priority", value: (item) => item.priority },
    { label: "score", value: (item) => item.score },
    { label: "source_type", value: (item) => item.sourceType },
    { label: "title", value: (item) => item.title },
    { label: "section", value: (item) => item.section || item.sections?.[0] },
    { label: "volumes", value: (item) => displayVolumeLabels(item) },
    { label: "identifier", value: (item) => item.identifier || item.naid },
    { label: "source_collection", value: (item) => item.sourceCollection },
    { label: "matched_queries", value: (item) => item.matchedQueries || [] },
    { label: "summary", value: (item) => item.summary },
    { label: "source_note", value: (item) => item.sourceNote },
    { label: "catalog_url", value: (item) => item.catalogUrl },
    { label: "source_url", value: (item) => item.sourceUrl },
    { label: "pdf_url", value: (item) => item.pdfUrl || item.digitalObjectUrl }
  ]);
}

function potentialDocumentCode(index) {
  return `PD ${String(index + 1).padStart(4, "0")}`;
}

function createPotentialDocumentRow(item, index) {
  const row = document.createElement("article");
  row.className = "document-row";

  const dateStack = document.createElement("div");
  dateStack.className = "record-date-stack";

  const number = document.createElement("span");
  number.className = "record-doc-number";
  number.textContent = potentialDocumentCode(index);

  const date = document.createElement("time");
  date.className = "record-date";
  if (/^\d{4}-\d{2}-\d{2}$/.test(item.date || "")) date.dateTime = item.date;
  date.textContent = shortDate(item.date);
  dateStack.append(number, date);

  const body = document.createElement("div");
  const title = document.createElement("a");
  title.className = "record-title";
  title.href = item.sourceUrl || item.digitalObjectUrl || item.pdfUrl || "#";
  title.rel = "noreferrer";
  title.textContent = item.title;

  const sourceLine = document.createElement("p");
  sourceLine.className = "record-source-line";
  sourceLine.textContent = `${item.sourceType || "Source lead"} / ${item.identifier || item.sourceRepository || "identifier pending"}`;

  const note = document.createElement("p");
  note.className = "record-note";
  note.textContent = item.summary || "Potential source lead queued for document-level review.";

  const meta = createChipList(
    [
      item.priority ? `${item.priority} priority` : "",
      item.score ? `score ${item.score}` : "",
      ...(item.sections || []),
      displayVolumeLabels(item) ? `Vol. ${displayVolumeLabels(item)}` : ""
    ],
    "record-meta",
    12
  );

  const topics = createChipList(
    [
      item.level,
      item.category,
      item.releaseStatus,
      item.digitalObjects ? `${item.digitalObjects} digital object${item.digitalObjects === 1 ? "" : "s"}` : "",
      ...(item.sourceRuns || [])
    ],
    "record-topics",
    8
  );

  const sourceTrail = document.createElement("details");
  sourceTrail.className = "record-source-note";
  const summary = document.createElement("summary");
  summary.textContent = "Search trail";
  const collection = document.createElement("p");
  collection.className = "record-frus-source-note";
  collection.textContent = item.sourceNote || item.sourceCollection || "Source collection pending.";
  const queries = document.createElement("p");
  queries.textContent = item.matchedQueries?.length
    ? `Matched queries: ${item.matchedQueries.slice(0, 12).join("; ")}.`
    : "Matched query trail pending.";
  sourceTrail.append(summary, collection, queries);

  body.append(title, sourceLine, note, meta, topics, sourceTrail);

  const links = document.createElement("div");
  links.className = "record-links";
  const linkCandidates = [
    ["Catalog", item.catalogUrl],
    ["PDF", item.pdfUrl],
    ["Object", item.digitalObjectUrl],
    ["Source", item.sourceUrl],
    ["Report", item.sourceReports?.[0]]
  ];
  const seenUrls = new Set();
  for (const [label, url] of linkCandidates) {
    if (!url || seenUrls.has(url)) continue;
    seenUrls.add(url);
    const link = document.createElement("a");
    link.href = url;
    link.rel = "noreferrer";
    link.textContent = label;
    links.append(link);
  }

  row.append(dateStack, body, links);
  return row;
}

function renderPotentialDocuments(documents) {
  if (!potentialDocumentsRoot) return;
  potentialDocumentsRoot.replaceChildren();

  if (!documents.length) {
    const empty = document.createElement("p");
    empty.className = "empty-section";
    empty.textContent = POTENTIAL_DOCUMENTS.length
      ? "No potential source documents match the current filters."
      : "No potential source documents have been generated yet. Run node scripts/build-potential-documents.js to build the dataset.";
    potentialDocumentsRoot.append(empty);
    return;
  }

  const sorted = [...documents].sort(byPotentialDocument);
  const documentNumbers = new Map(sorted.map((item, index) => [item.id, index]));
  const sourcesToRender = uniqueInOrder([
    ...POTENTIAL_SOURCE_ORDER,
    ...sorted.map((item) => item.sourceType)
  ]).filter((source) => sorted.some((item) => item.sourceType === source));

  for (const sourceName of sourcesToRender) {
    const sourceDocuments = sorted.filter((item) => item.sourceType === sourceName);
    const section = document.createElement("section");
    section.className = "record-section document-section";
    section.id = `potential-${sourceName.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-")}`;

    const header = document.createElement("div");
    header.className = "record-section-header";
    const heading = document.createElement("h3");
    heading.textContent = sourceName;
    const count = document.createElement("p");
    count.className = "record-count";
    count.textContent = `${sourceDocuments.length} leads`;
    header.append(heading, count);

    const list = document.createElement("div");
    list.className = "record-list document-list";
    for (const item of sourceDocuments) {
      list.append(createPotentialDocumentRow(item, documentNumbers.get(item.id) || 0));
    }

    section.append(header, list);
    potentialDocumentsRoot.append(section);
  }
}

function updateDocumentSummary(documents) {
  if (!documentSummary) return;
  const source = documentSourceFilter?.selectedOptions?.[0]?.textContent || "All sources";
  const year = documentYearFilter?.selectedOptions?.[0]?.textContent || "All years";
  const volume = documentVolumeFilter?.selectedOptions?.[0]?.textContent || "All volumes";
  documentSummary.textContent = `Showing ${documents.length} of ${POTENTIAL_DOCUMENTS.length} potential source leads / ${source} / ${year} / ${volume}`;
}

function updatePotentialDocumentsView() {
  const filtered = filterPotentialDocuments(POTENTIAL_DOCUMENTS).sort(byPotentialDocument);
  updateDocumentSummary(filtered);
  renderPotentialDocuments(filtered);
}

function createRecordRow(record) {
  const row = document.createElement("article");
  row.className = "record-row";

  const dateStack = document.createElement("div");
  dateStack.className = "record-date-stack";

  const number = document.createElement("span");
  number.className = "record-doc-number";
  number.textContent = record.compilerNumber || "CE TBD";

  const date = document.createElement("time");
  date.className = "record-date";
  if (record.date) date.dateTime = record.date;
  date.textContent = shortDate(record.date);
  dateStack.append(number, date);

  const body = document.createElement("div");
  const title = document.createElement("a");
  title.className = "record-title";
  title.href = record.itemUrl || record.pdfUrl || "#";
  title.rel = "noreferrer";
  title.textContent = record.title;

  const sourceLine = document.createElement("p");
  sourceLine.className = "record-source-line";
  sourceLine.textContent = `${record.collection || "Clinton Digital Library"} / ${record.itemId || "item pending"}`;

  const note = document.createElement("p");
  note.className = "record-note";
  note.textContent = record.notes || `Assigned to ${record.section || "Regional"}; review volume placement before final selection.`;

  const meta = createChipList(
    [
      record.type,
      record.section,
      displayVolume(record) ? `Vol. ${displayVolume(record)}` : "",
      record.releaseStatus,
      record.sourceNoteStatus?.startsWith("FRUS-style candidate") ? "FRUS source-note candidate" : record.sourceNoteStatus,
      ...(record.countries || [])
    ],
    "record-meta",
    10
  );

  const topics = createChipList([...(record.topics || []), ...(record.subjects || [])], "record-topics", 8);

  const flags = createChipList((record.queues || []).map(queueLabel), "record-flags", 6);

  const sourceNote = document.createElement("details");
  sourceNote.className = "record-source-note";
  const summary = document.createElement("summary");
  summary.textContent = "Source note";
  const sourceText = document.createElement("p");
  sourceText.className = "record-frus-source-note";
  sourceText.textContent = record.sourceNote || "Source note pending.";
  const provenance = document.createElement("p");
  provenance.textContent = record.provenanceNote || "Provenance note pending.";
  const issues = document.createElement("p");
  issues.textContent = record.sourceNoteIssues?.length
    ? `Source-note checks: ${record.sourceNoteIssues.join("; ")}.`
    : "Source-note checks: no issues flagged.";
  const subjects = document.createElement("p");
  subjects.textContent = record.subjects?.length
    ? `Subject headings: ${record.subjects.join("; ")}.`
    : "Subject headings pending.";
  sourceNote.append(summary, sourceText, provenance, issues, subjects);

  body.append(title, sourceLine, note, meta, topics, flags, sourceNote);

  const links = document.createElement("div");
  links.className = "record-links";
  for (const [label, url] of [
    ["Item", record.itemUrl],
    ["PDF", record.pdfUrl],
    ["Collection", record.collectionUrl],
    ["FRUS XXII", volumeById.get("frus1993-00v22")?.url],
    ["Policy Vol.", record.policyVolumeId ? volumeById.get(record.policyVolumeId)?.url : ""]
  ]) {
    if (!url) continue;
    const link = document.createElement("a");
    link.href = url;
    link.rel = "noreferrer";
    link.textContent = label;
    links.append(link);
  }

  row.append(dateStack, body, links);
  return row;
}

function queueLabel(queue) {
  return QUEUE_OPTIONS.find(([value]) => value === queue)?.[1] || queue;
}

function renderRecords(records) {
  if (!recordsRoot) return;
  recordsRoot.replaceChildren();

  if (!records.length) {
    const empty = document.createElement("p");
    empty.className = "empty-section";
    empty.textContent = allRecords.length
      ? "No records match the current search or filters."
      : "No records have been generated yet. Run node scripts/harvest-clinton-digital-library.js to build the first dataset.";
    recordsRoot.append(empty);
    return;
  }

  const sortedRecords = [...records].sort(byChronology);
  const yearGroups = uniqueInOrder(sortedRecords.map(chronologyYear));
  for (const year of yearGroups) {
    const yearRecords = sortedRecords.filter((record) => chronologyYear(record) === year);
    const section = document.createElement("section");
    section.className = "record-section chronology-section";
    section.id = `chronology-${year.toLowerCase().replaceAll(" ", "-")}`;

    const header = document.createElement("div");
    header.className = "record-section-header";
    const heading = document.createElement("h3");
    heading.textContent = year;
    const count = document.createElement("p");
    count.className = "record-count";
    count.textContent = `${yearRecords.length} records`;
    header.append(heading, count);

    const list = document.createElement("div");
    list.className = "record-list";
    for (const record of yearRecords) {
      list.append(createRecordRow(record));
    }

    section.append(header, list);
    recordsRoot.append(section);
  }
}

function updateSummary(records) {
  if (!recordsSummary) return;
  const volume = volumeFilter?.selectedOptions?.[0]?.textContent || "All volumes";
  const year = recordYearFilter?.selectedOptions?.[0]?.textContent || "All years";
  const section = sectionFilter?.selectedOptions?.[0]?.textContent || "All sections";
  const queue = queueFilter?.selectedOptions?.[0]?.textContent || "All queues";
  recordsSummary.textContent = `Showing ${records.length} of ${allRecords.length} records / ${volume} / ${year} / ${section} / ${queue}`;
}

function updateRecordsView() {
  const filtered = filterRecords(allRecords).sort(byChronology);
  updateSummary(filtered);
  renderRecords(filtered);
  renderDesk(allRecords);
  setStats(allRecords);
}

function enableFilters() {
  for (const control of [searchInput, volumeFilter, recordYearFilter, sectionFilter, typeFilter, queueFilter]) {
    control?.addEventListener("input", updateRecordsView);
    control?.addEventListener("change", updateRecordsView);
  }

  for (const control of [documentSearch, documentSourceFilter, documentYearFilter, documentVolumeFilter, documentPriorityFilter]) {
    control?.addEventListener("input", updatePotentialDocumentsView);
    control?.addEventListener("change", updatePotentialDocumentsView);
  }

  for (const control of [librarySearch, libraryClusterFilter, libraryPriorityFilter]) {
    control?.addEventListener("input", updateLibraryView);
    control?.addEventListener("change", updateLibraryView);
  }

  clearFilters?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (volumeFilter) volumeFilter.value = "";
    if (recordYearFilter) recordYearFilter.value = "";
    if (sectionFilter) sectionFilter.value = "";
    if (typeFilter) typeFilter.value = "";
    if (queueFilter) queueFilter.value = "";
    updateRecordsView();
    searchInput?.focus();
  });
  exportRecords?.addEventListener("click", exportCurrentRecords);

  clearDocumentFilters?.addEventListener("click", () => {
    if (documentSearch) documentSearch.value = "";
    if (documentSourceFilter) documentSourceFilter.value = "";
    if (documentYearFilter) documentYearFilter.value = "";
    if (documentVolumeFilter) documentVolumeFilter.value = "";
    if (documentPriorityFilter) documentPriorityFilter.value = "";
    updatePotentialDocumentsView();
    documentSearch?.focus();
  });
  exportDocuments?.addEventListener("click", exportCurrentPotentialDocuments);

  clearLibraryFilters?.addEventListener("click", () => {
    if (librarySearch) librarySearch.value = "";
    if (libraryClusterFilter) libraryClusterFilter.value = "";
    if (libraryPriorityFilter) libraryPriorityFilter.value = "";
    updateLibraryView();
    librarySearch?.focus();
  });
  exportLibrary?.addEventListener("click", exportCurrentLibraryLeads);
}

renderVolumes();
renderStatements();
populateDocumentFilters(POTENTIAL_DOCUMENTS);
updatePotentialDocumentsView();
renderCompilerGaps();
populateLibraryFilters();
renderLibraryOverview();
updateLibraryView();
renderTriage();
populateFilters(allRecords);
enableFilters();
updateRecordsView();
