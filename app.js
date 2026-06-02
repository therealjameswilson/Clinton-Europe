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

const DECISION_STORAGE_KEY = "clinton-europe-selection-decisions-v1";
const DECISION_OPTIONS = [
  ["", "No decision"],
  ["full-text", "Full text candidate"],
  ["cross-reference", "Cross-reference only"],
  ["omit", "Omit from selection"],
  ["context", "Context only"]
];
const DECISION_FILTER_OPTIONS = [["", "All decisions"], ["__undecided__", "Undecided"], ...DECISION_OPTIONS.slice(1)];
const PDD_STORAGE_KEY = "clinton-europe-pdd-reconciliation-v1";
const PDD_STATUS_OPTIONS = [
  ["", "No status"],
  ["matched-record", "Matched to record"],
  ["source-search", "Needs source search"],
  ["statement-context", "Public context only"],
  ["calendar-gap", "Calendar gap"],
  ["not-volume", "Not volume relevant"]
];
const PDD_STATUS_FILTER_OPTIONS = [["", "All statuses"], ["__unresolved__", "Unresolved"], ...PDD_STATUS_OPTIONS.slice(1)];
const LIBRARY_STATUS_STORAGE_KEY = "clinton-europe-library-pull-statuses-v1";
const LIBRARY_STATUS_OPTIONS = [
  ["", "No status"],
  ["pull-first", "Pull first"],
  ["requested", "Requested"],
  ["reviewed", "Reviewed"],
  ["promote", "Promote candidate"],
  ["defer", "Defer"]
];
const LIBRARY_STATUS_FILTER_OPTIONS = [["", "All statuses"], ["__unworked__", "Unworked"], ...LIBRARY_STATUS_OPTIONS.slice(1)];
const CHRONOLOGY_QUICK_FILTERS = [
  {
    key: "all",
    label: "All chronology",
    detail: "Return to the full date-ordered declassified record set.",
    filter: {}
  },
  {
    key: "source-note",
    label: "Source-note review",
    detail: "Settle archival path, cover-sheet, and classification-line checks.",
    filter: { queue: "source-note" }
  },
  {
    key: "pdf-missing",
    label: "Missing PDFs",
    detail: "Records that still need PDF or item-page confirmation.",
    filter: { queue: "pdf-missing" }
  },
  {
    key: "date-missing",
    label: "Date pending",
    detail: "Undated records that can break the documentary chronology.",
    filter: { queue: "date-missing" }
  },
  {
    key: "cross-volume",
    label: "Cross-volume",
    detail: "Records needing XXII/XXIII/XXIV placement review.",
    filter: { queue: "cross-volume" }
  },
  {
    key: "undecided",
    label: "Undecided",
    detail: "Candidates with no saved include/cross-reference/omit decision.",
    filter: { decision: "__undecided__" }
  },
  {
    key: "full-text",
    label: "Full-text picks",
    detail: "Saved records promoted for possible full text.",
    filter: { decision: "full-text" }
  }
];

const volumeRoot = document.querySelector("#volume-root");
const statementsRoot = document.querySelector("#statements-root");
const statementSearch = document.querySelector("#statement-search");
const statementYearFilter = document.querySelector("#statement-year-filter");
const statementSectionFilter = document.querySelector("#statement-section-filter");
const statementVolumeFilter = document.querySelector("#statement-volume-filter");
const statementPriorityFilter = document.querySelector("#statement-priority-filter");
const clearStatementFilters = document.querySelector("#clear-statement-filters");
const exportStatements = document.querySelector("#export-statements");
const statementSummary = document.querySelector("#statement-summary");
const potentialDocumentsRoot = document.querySelector("#potential-documents-root");
const compilerGapsRoot = document.querySelector("#compiler-gaps-root");
const libraryOverviewRoot = document.querySelector("#library-overview-root");
const libraryLeadsRoot = document.querySelector("#library-leads-root");
const triageRoot = document.querySelector("#triage-root");
const coverageRoot = document.querySelector("#coverage-root");
const worklistRoot = document.querySelector("#worklist-root");
const pddRoot = document.querySelector("#pdd-root");
const deskRoot = document.querySelector("#desk-root");
const recordsRoot = document.querySelector("#records-root");
const chronologyQueueRoot = document.querySelector("#chronology-queue-root");
const savedWorkSummary = document.querySelector("#saved-work-summary");
const savedWorkStatus = document.querySelector("#saved-work-status");
const copySavedWork = document.querySelector("#copy-saved-work");
const exportSavedWork = document.querySelector("#export-saved-work");
const importSavedWork = document.querySelector("#import-saved-work");
const totalRecords = document.querySelector("#total-records");
const pdfLinkedCount = document.querySelector("#pdf-linked-count");
const highLevelCount = document.querySelector("#high-level-count");
const sourceGapCount = document.querySelector("#source-gap-count");
const potentialDocumentCount = document.querySelector("#potential-document-count");
const compilerGapCount = document.querySelector("#compiler-gap-count");
const libraryLeadCount = document.querySelector("#library-lead-count");
const selectionDecisionCount = document.querySelector("#selection-decision-count");
const pddStatusCount = document.querySelector("#pdd-status-count");
const libraryStatusCount = document.querySelector("#library-status-count");
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
const libraryStatusFilter = document.querySelector("#library-status-filter");
const clearLibraryFilters = document.querySelector("#clear-library-filters");
const exportLibrary = document.querySelector("#export-library");
const librarySummary = document.querySelector("#library-summary");
const searchInput = document.querySelector("#record-search");
const volumeFilter = document.querySelector("#volume-filter");
const recordYearFilter = document.querySelector("#record-year-filter");
const sectionFilter = document.querySelector("#section-filter");
const typeFilter = document.querySelector("#type-filter");
const queueFilter = document.querySelector("#queue-filter");
const decisionFilter = document.querySelector("#decision-filter");
const clearFilters = document.querySelector("#clear-filters");
const exportRecords = document.querySelector("#export-records");
const recordsSummary = document.querySelector("#records-summary");
const exportWorklist = document.querySelector("#export-worklist");
const exportDecisions = document.querySelector("#export-decisions");
const pddSearch = document.querySelector("#pdd-search");
const pddPriorityFilter = document.querySelector("#pdd-priority-filter");
const pddStatusFilter = document.querySelector("#pdd-status-filter");
const clearPddFilters = document.querySelector("#clear-pdd-filters");
const exportPdd = document.querySelector("#export-pdd");
const pddSummary = document.querySelector("#pdd-summary");

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

function statementYear(statement) {
  return /^\d{4}/.test(statement.date || "") ? statement.date.slice(0, 4) : "Date pending";
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

function byPddChronology(a, b) {
  return (
    (a.date || "9999").localeCompare(b.date || "9999") ||
    priorityRank(a.priority) - priorityRank(b.priority) ||
    (b.score || 0) - (a.score || 0) ||
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

function titleCase(value = "") {
  return value ? value.slice(0, 1).toUpperCase() + value.slice(1) : value;
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

function downloadJson(fileName, payload) {
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
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

const statementNumberById = new Map(
  [...PUBLIC_STATEMENTS]
    .sort(byStatementSectionThenDate)
    .map((statement, index) => [statement.id, index])
);

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

function populateStatementFilters(statements) {
  addOptions(statementYearFilter, yearOptions(statements.map(statementYear)), "All years");
  addOptions(
    statementSectionFilter,
    uniqueInOrder([...STATEMENT_SECTION_ORDER, ...statements.flatMap((statement) => statement.sections || [])]),
    "All sections"
  );
  addOptions(
    statementVolumeFilter,
    VOLUMES.map((volume) => volume.id),
    "All volumes"
  );
  if (statementVolumeFilter) {
    [...statementVolumeFilter.options].forEach((option) => {
      if (!option.value) return;
      option.textContent = `Volume ${volumeById.get(option.value)?.number || option.value}`;
    });
  }
  addOptions(statementPriorityFilter, uniqueSorted(statements.map((statement) => statement.priority)), "All priorities");
  if (statementPriorityFilter) {
    [...statementPriorityFilter.options].forEach((option) => {
      if (!option.value) return;
      option.textContent = titleCase(option.value);
    });
  }
}

function statementSearchText(statement) {
  return [
    statement.title,
    statement.date,
    statement.packageId,
    statement.granuleId,
    statement.priority,
    statement.notes,
    displayVolume(statement),
    ...(statement.sections || []),
    ...(statement.topics || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterStatements(statements) {
  const query = statementSearch?.value.trim().toLowerCase() || "";
  const year = statementYearFilter?.value || "";
  const section = statementSectionFilter?.value || "";
  const volume = statementVolumeFilter?.value || "";
  const priority = statementPriorityFilter?.value || "";

  return statements.filter((statement) => {
    if (year && statementYear(statement) !== year) return false;
    if (section && !(statement.sections || []).includes(section)) return false;
    if (volume && !(statement.volumeIds || []).includes(volume)) return false;
    if (priority && statement.priority !== priority) return false;
    return !query || statementSearchText(statement).includes(query);
  });
}

function exportCurrentStatements() {
  const rows = filterStatements(PUBLIC_STATEMENTS).sort(byStatementSectionThenDate);
  downloadCsv(`clinton-europe-public-statements-${exportDateStamp()}.csv`, rows, [
    { label: "statement_number", value: (statement) => statementCode(statement, statementNumberById.get(statement.id) || 0) },
    { label: "date", value: (statement) => statement.date },
    { label: "year", value: (statement) => statementYear(statement) },
    { label: "title", value: (statement) => statement.title },
    { label: "primary_section", value: (statement) => primaryStatementSection(statement) },
    { label: "sections", value: (statement) => statement.sections || [] },
    { label: "priority", value: (statement) => statement.priority },
    { label: "volumes", value: (statement) => displayVolume(statement) },
    { label: "topics", value: (statement) => statement.topics || [] },
    { label: "notes", value: (statement) => statement.notes },
    { label: "package_id", value: (statement) => statement.packageId },
    { label: "details_url", value: (statement) => statement.detailsUrl },
    { label: "text_url", value: (statement) => statement.textUrl },
    { label: "pdf_url", value: (statement) => statement.pdfUrl }
  ]);
}

function renderStatements(statements = PUBLIC_STATEMENTS) {
  if (!statementsRoot) return;

  if (!PUBLIC_STATEMENTS.length) {
    const empty = document.createElement("p");
    empty.className = "empty-section";
    empty.textContent =
      "No public statements have been generated yet. Run node scripts/harvest-clinton-public-statements.js to build the dataset.";
    statementsRoot.replaceChildren(empty);
    return;
  }

  if (!statements.length) {
    const empty = document.createElement("p");
    empty.className = "empty-section";
    empty.textContent = "No public statements match the current search or filters.";
    statementsRoot.replaceChildren(empty);
    return;
  }

  const sorted = [...statements].sort(byStatementSectionThenDate);
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
      list.append(createStatementRow(statement, statementNumberById.get(statement.id) || 0));
    }

    section.append(header, list);
    return section;
  });

  statementsRoot.replaceChildren(...sections);
}

function updateStatementSummary(statements) {
  if (!statementSummary) return;
  const year = statementYearFilter?.selectedOptions?.[0]?.textContent || "All years";
  const section = statementSectionFilter?.selectedOptions?.[0]?.textContent || "All sections";
  const volume = statementVolumeFilter?.selectedOptions?.[0]?.textContent || "All volumes";
  const priority = statementPriorityFilter?.selectedOptions?.[0]?.textContent || "All priorities";
  statementSummary.textContent = `Showing ${statements.length} of ${PUBLIC_STATEMENTS.length} public statements / ${year} / ${section} / ${volume} / ${priority}`;
}

function updateStatementsView() {
  const filtered = filterStatements(PUBLIC_STATEMENTS).sort(byStatementSectionThenDate);
  updateStatementSummary(filtered);
  renderStatements(filtered);
}

function loadSelectionDecisions() {
  try {
    return JSON.parse(localStorage.getItem(DECISION_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSelectionDecisions() {
  try {
    localStorage.setItem(DECISION_STORAGE_KEY, JSON.stringify(selectionDecisions));
  } catch {
    // Local storage can be unavailable in some locked-down browser contexts.
  }
}

function loadPddStatuses() {
  try {
    return JSON.parse(localStorage.getItem(PDD_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePddStatuses() {
  try {
    localStorage.setItem(PDD_STORAGE_KEY, JSON.stringify(pddStatuses));
  } catch {
    // Local storage can be unavailable in some locked-down browser contexts.
  }
}

function loadLibraryStatuses() {
  try {
    return JSON.parse(localStorage.getItem(LIBRARY_STATUS_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLibraryStatuses() {
  try {
    localStorage.setItem(LIBRARY_STATUS_STORAGE_KEY, JSON.stringify(libraryStatuses));
  } catch {
    // Local storage can be unavailable in some locked-down browser contexts.
  }
}

function decisionLabel(value) {
  return DECISION_OPTIONS.find(([optionValue]) => optionValue === value)?.[1] || "No decision";
}

function pddStatusLabel(value) {
  return PDD_STATUS_OPTIONS.find(([optionValue]) => optionValue === value)?.[1] || "No status";
}

function libraryStatusLabel(value) {
  return LIBRARY_STATUS_OPTIONS.find(([optionValue]) => optionValue === value)?.[1] || "No status";
}

function decisionForRecord(record) {
  return selectionDecisions[record.id]?.decision || "";
}

function selectionDecisionRows() {
  return allRecords
    .map((record) => ({ record, saved: selectionDecisions[record.id] }))
    .filter(({ saved }) => saved?.decision);
}

function updateSelectionDecisionCount() {
  if (selectionDecisionCount) selectionDecisionCount.textContent = selectionDecisionRows().length.toString();
}

function pddStatusRows() {
  return pddLeads
    .map((item) => ({ item, saved: pddStatuses[item.id] }))
    .filter(({ saved }) => saved?.status);
}

function libraryStatusRows() {
  return (LIBRARY_RESEARCH.leads || [])
    .map((lead) => ({ lead, saved: libraryStatuses[lead.id] }))
    .filter(({ saved }) => saved?.status);
}

function savedWorkCounts() {
  return {
    selectionDecisions: selectionDecisionRows().length,
    pddStatuses: pddStatusRows().length,
    libraryStatuses: libraryStatusRows().length
  };
}

function newestSavedWorkDate() {
  const dates = [
    ...selectionDecisionRows().map(({ saved }) => saved.updatedAt),
    ...pddStatusRows().map(({ saved }) => saved.updatedAt),
    ...libraryStatusRows().map(({ saved }) => saved.updatedAt)
  ]
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
  return dates[0] || "";
}

function savedWorkPayload() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    site: "Clinton Europe FRUS Assister",
    page: window.location.href,
    repository: "https://github.com/therealjameswilson/Clinton-Europe",
    storageKeys: {
      selectionDecisions: DECISION_STORAGE_KEY,
      pddStatuses: PDD_STORAGE_KEY,
      libraryStatuses: LIBRARY_STATUS_STORAGE_KEY
    },
    counts: savedWorkCounts(),
    selectionDecisions,
    pddStatuses,
    libraryStatuses
  };
}

function savedWorkSummaryText() {
  const counts = savedWorkCounts();
  const updatedAt = newestSavedWorkDate();
  return [
    "Clinton Europe FRUS saved-work handoff",
    `Export date: ${formatDate(exportDateStamp())}`,
    `Selection decisions: ${counts.selectionDecisions}`,
    `PDD statuses: ${counts.pddStatuses}`,
    `Library pull statuses: ${counts.libraryStatuses}`,
    `Most recent saved update: ${updatedAt ? formatDate(updatedAt.slice(0, 10)) : "none"}`,
    "",
    "Use Export JSON to move browser-saved work to another machine or archive the review state."
  ].join("\n");
}

function renderSavedWorkPanel(statusText = "") {
  if (savedWorkSummary) {
    const counts = savedWorkCounts();
    const updatedAt = newestSavedWorkDate();
    const cards = [
      ["Selection decisions", counts.selectionDecisions],
      ["PDD statuses", counts.pddStatuses],
      ["Library pull statuses", counts.libraryStatuses],
      ["Latest update", updatedAt ? formatDate(updatedAt.slice(0, 10)) : "None"]
    ].map(([label, value]) => {
      const card = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = String(value);
      const span = document.createElement("span");
      span.textContent = label;
      card.append(strong, span);
      return card;
    });
    savedWorkSummary.replaceChildren(...cards);
  }
  if (savedWorkStatus && statusText) savedWorkStatus.textContent = statusText;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function countLabel(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function mergeSavedEntries(current, incoming, validValues, fieldName, validIds) {
  if (!isPlainObject(incoming)) return 0;
  let count = 0;
  for (const [id, entry] of Object.entries(incoming)) {
    if (validIds && !validIds.has(id)) continue;
    if (!isPlainObject(entry) || !validValues.has(entry[fieldName])) continue;
    current[id] = {
      [fieldName]: entry[fieldName],
      updatedAt: entry.updatedAt || new Date().toISOString()
    };
    count += 1;
  }
  return count;
}

function importSavedWorkPayload(payload) {
  if (!isPlainObject(payload)) throw new Error("Saved-work file is not a JSON object.");
  const imported = {
    selectionDecisions: mergeSavedEntries(
      selectionDecisions,
      payload.selectionDecisions,
      new Set(DECISION_OPTIONS.map(([value]) => value).filter(Boolean)),
      "decision",
      new Set(allRecords.map((record) => record.id))
    ),
    pddStatuses: mergeSavedEntries(
      pddStatuses,
      payload.pddStatuses,
      new Set(PDD_STATUS_OPTIONS.map(([value]) => value).filter(Boolean)),
      "status",
      new Set(pddLeads.map((item) => item.id))
    ),
    libraryStatuses: mergeSavedEntries(
      libraryStatuses,
      payload.libraryStatuses,
      new Set(LIBRARY_STATUS_OPTIONS.map(([value]) => value).filter(Boolean)),
      "status",
      new Set((LIBRARY_RESEARCH.leads || []).map((lead) => lead.id))
    )
  };
  saveSelectionDecisions();
  savePddStatuses();
  saveLibraryStatuses();
  updateRecordsView();
  updatePddView();
  updateLibraryView();
  renderSavedWorkPanel(
    `Imported ${countLabel(imported.selectionDecisions, "decision")}, ${countLabel(imported.pddStatuses, "PDD status", "PDD statuses")}, and ${countLabel(imported.libraryStatuses, "library pull status", "library pull statuses")}.`
  );
}

function updatePddStatusCount() {
  if (pddStatusCount) pddStatusCount.textContent = pddStatusRows().length.toString();
}

function updateLibraryStatusCount() {
  if (libraryStatusCount) libraryStatusCount.textContent = libraryStatusRows().length.toString();
}

function setRecordDecision(record, decision) {
  if (decision) {
    selectionDecisions[record.id] = {
      decision,
      updatedAt: new Date().toISOString()
    };
  } else {
    delete selectionDecisions[record.id];
  }
  saveSelectionDecisions();
  updateSelectionDecisionCount();
  renderSavedWorkPanel();
  renderChronologyQuickFilters(allRecords);
  renderDesk(allRecords);
}

function setPddStatus(item, status) {
  if (status) {
    pddStatuses[item.id] = {
      status,
      updatedAt: new Date().toISOString()
    };
  } else {
    delete pddStatuses[item.id];
  }
  savePddStatuses();
  updatePddStatusCount();
  renderSavedWorkPanel();
}

function setLibraryStatus(lead, status) {
  if (status) {
    libraryStatuses[lead.id] = {
      status,
      updatedAt: new Date().toISOString()
    };
  } else {
    delete libraryStatuses[lead.id];
  }
  saveLibraryStatuses();
  updateLibraryStatusCount();
  renderSavedWorkPanel();
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
let selectionDecisions = loadSelectionDecisions();
const pddLeads = POTENTIAL_DOCUMENTS.filter((item) => item.sourceType === "Presidential Daily Diary").sort(byPddChronology);
let pddStatuses = loadPddStatuses();
let libraryStatuses = loadLibraryStatuses();

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
  if (decisionFilter) {
    decisionFilter.replaceChildren(...DECISION_FILTER_OPTIONS.map(([value, label]) => new Option(label, value)));
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
  const decision = decisionFilter?.value || "";

  return records.filter((record) => {
    if (volume && !(record.volumeIds || []).includes(volume)) return false;
    if (year && chronologyYear(record) !== year) return false;
    if (section && record.section !== section) return false;
    if (type && record.type !== type) return false;
    if (queue && !(record.queues || []).includes(queue)) return false;
    const recordDecision = decisionForRecord(record);
    if (decision === "__undecided__" && recordDecision) return false;
    if (decision && decision !== "__undecided__" && recordDecision !== decision) return false;
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
    { label: "selection_decision", value: (record) => decisionLabel(decisionForRecord(record)) },
    { label: "selection_updated_at", value: (record) => selectionDecisions[record.id]?.updatedAt || "" },
    { label: "countries", value: (record) => record.countries || [] },
    { label: "queues", value: (record) => (record.queues || []).map(queueLabel) },
    { label: "same_day_pdd_count", value: (record) => sameDayPddLeads(record).length },
    { label: "same_day_pdd", value: (record) => sameDayPddLeads(record).map((item) => item.title) },
    { label: "same_day_public_statement_count", value: (record) => sameDayPublicStatements(record).length },
    { label: "same_day_public_statements", value: (record) => sameDayPublicStatements(record).map((statement) => statement.title) },
    { label: "source_note_status", value: (record) => record.sourceNoteStatus },
    { label: "source_note_issues", value: (record) => record.sourceNoteIssues || [] },
    { label: "source_note", value: (record) => record.sourceNote },
    { label: "item_url", value: (record) => record.itemUrl },
    { label: "pdf_url", value: (record) => record.pdfUrl },
    { label: "collection_url", value: (record) => record.collectionUrl }
  ]);
}

function exportCurrentDecisions() {
  downloadCsv(`clinton-europe-selection-decisions-${exportDateStamp()}.csv`, selectionDecisionRows(), [
    { label: "compiler_number", value: ({ record }) => record.compilerNumber },
    { label: "decision", value: ({ saved }) => decisionLabel(saved.decision) },
    { label: "decision_value", value: ({ saved }) => saved.decision },
    { label: "updated_at", value: ({ saved }) => saved.updatedAt },
    { label: "date", value: ({ record }) => record.date || record.sortDate },
    { label: "year", value: ({ record }) => chronologyYear(record) },
    { label: "title", value: ({ record }) => record.title },
    { label: "type", value: ({ record }) => record.type },
    { label: "section", value: ({ record }) => record.section },
    { label: "volumes", value: ({ record }) => displayVolume(record) },
    { label: "queues", value: ({ record }) => (record.queues || []).map(queueLabel) },
    { label: "source_note", value: ({ record }) => record.sourceNote },
    { label: "item_url", value: ({ record }) => record.itemUrl },
    { label: "pdf_url", value: ({ record }) => record.pdfUrl }
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
  updateSelectionDecisionCount();
  updatePddStatusCount();
  updateLibraryStatusCount();
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

function resetRecordFilterControls(filter = {}) {
  if (searchInput) searchInput.value = filter.search || "";
  if (volumeFilter) volumeFilter.value = filter.volumeId || "";
  if (recordYearFilter) recordYearFilter.value = filter.year || "";
  if (sectionFilter) sectionFilter.value = filter.section || "";
  if (typeFilter) typeFilter.value = filter.type || "";
  if (queueFilter) queueFilter.value = filter.queue || "";
  if (decisionFilter) decisionFilter.value = filter.decision || "";
}

function recordMatchesChronologyQuickFilter(record, filter = {}) {
  if (filter.search && !recordSearchText(record).includes(filter.search.toLowerCase())) return false;
  if (filter.volumeId && !(record.volumeIds || []).includes(filter.volumeId)) return false;
  if (filter.year && chronologyYear(record) !== filter.year) return false;
  if (filter.section && record.section !== filter.section) return false;
  if (filter.type && record.type !== filter.type) return false;
  if (filter.queue && !(record.queues || []).includes(filter.queue)) return false;

  const recordDecision = decisionForRecord(record);
  if (filter.decision === "__undecided__") return !recordDecision;
  if (filter.decision) return recordDecision === filter.decision;

  return true;
}

function isChronologyQuickFilterActive(filter = {}) {
  return (
    (searchInput?.value || "") === (filter.search || "") &&
    (volumeFilter?.value || "") === (filter.volumeId || "") &&
    (recordYearFilter?.value || "") === (filter.year || "") &&
    (sectionFilter?.value || "") === (filter.section || "") &&
    (typeFilter?.value || "") === (filter.type || "") &&
    (queueFilter?.value || "") === (filter.queue || "") &&
    (decisionFilter?.value || "") === (filter.decision || "")
  );
}

function applyChronologyQuickFilter(filter = {}) {
  resetRecordFilterControls(filter);
  updateRecordsView();
  document.querySelector("#records")?.scrollIntoView({ block: "start" });
}

function createChronologyQueueCard(item, count) {
  const button = document.createElement("button");
  const active = isChronologyQuickFilterActive(item.filter);
  button.type = "button";
  button.className = `chronology-queue-card${active ? " is-active" : ""}`;
  button.dataset.chronologyQueue = item.key;
  button.setAttribute("aria-pressed", active ? "true" : "false");
  button.disabled = count === 0 && Object.keys(item.filter || {}).length > 0;

  const countNode = document.createElement("span");
  countNode.className = "chronology-queue-count";
  countNode.textContent = count.toString();

  const label = document.createElement("strong");
  label.textContent = item.label;

  const detail = document.createElement("p");
  detail.textContent = item.detail;

  button.append(countNode, label, detail);
  button.addEventListener("click", () => applyChronologyQuickFilter(item.filter));
  return button;
}

function renderChronologyQuickFilters(records) {
  if (!chronologyQueueRoot) return;
  const cards = CHRONOLOGY_QUICK_FILTERS.map((item) => {
    const count = records.filter((record) => recordMatchesChronologyQuickFilter(record, item.filter)).length;
    return createChronologyQueueCard(item, count);
  });
  chronologyQueueRoot.replaceChildren(...cards);
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
    if (decisionFilter) decisionFilter.value = filter.decision || "";
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

  if (filter.target === "pdd") {
    if (pddSearch) pddSearch.value = filter.search || "";
    if (pddPriorityFilter) pddPriorityFilter.value = filter.priority || "";
    if (pddStatusFilter) pddStatusFilter.value = filter.status || "";
    updatePddView();
    document.querySelector("#pdd-reconciliation")?.scrollIntoView({ block: "start" });
    return;
  }

  if (filter.target === "library") {
    if (librarySearch) librarySearch.value = filter.search || "";
    if (libraryClusterFilter) libraryClusterFilter.value = filter.clusterId || "";
    if (libraryPriorityFilter) libraryPriorityFilter.value = filter.priority || "";
    if (libraryStatusFilter) libraryStatusFilter.value = filter.status || "";
    updateLibraryView();
    document.querySelector("#library-research")?.scrollIntoView({ block: "start" });
    return;
  }

  if (filter.target === "statements") {
    if (statementSearch) statementSearch.value = filter.search || "";
    if (statementYearFilter) statementYearFilter.value = filter.year || "";
    if (statementSectionFilter) statementSectionFilter.value = filter.section || "";
    if (statementVolumeFilter) statementVolumeFilter.value = filter.volumeId || "";
    if (statementPriorityFilter) statementPriorityFilter.value = filter.priority || "";
    updateStatementsView();
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

function inVolume(item, volumeId) {
  return !volumeId || (item.volumeIds || []).includes(volumeId);
}

function countMatching(items, predicate) {
  return items.filter(predicate).length;
}

function createCoverageCount(count, action, label = count.toString()) {
  if (!count) {
    const empty = document.createElement("span");
    empty.className = "coverage-zero";
    empty.textContent = "0";
    return empty;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "coverage-count";
  button.textContent = label;
  button.addEventListener("click", () => applyRelatedFilter(action));
  return button;
}

function createCoverageTable(scope) {
  const article = document.createElement("article");
  article.className = "coverage-card";

  const title = document.createElement("h3");
  title.textContent = scope.label;

  const table = document.createElement("table");
  table.className = "coverage-table";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  for (const headingText of ["Year", "Records", "Statements", "Leads", "High Leads"]) {
    const heading = document.createElement("th");
    heading.scope = headingText === "Year" ? "col" : "col";
    heading.textContent = headingText;
    headerRow.append(heading);
  }
  thead.append(headerRow);

  const tbody = document.createElement("tbody");
  const years = [...yearOptions(POTENTIAL_DOCUMENTS.map(documentYear)).filter((year) => year !== "Date pending"), "Date pending"];

  for (const year of years) {
    const row = document.createElement("tr");
    const yearCell = document.createElement("th");
    yearCell.scope = "row";
    yearCell.textContent = year;
    row.append(yearCell);

    const recordCount = countMatching(
      allRecords,
      (record) => chronologyYear(record) === year && inVolume(record, scope.volumeId)
    );
    const statementCount = countMatching(
      PUBLIC_STATEMENTS,
      (statement) => statementYear(statement) === year && inVolume(statement, scope.volumeId)
    );
    const leadCount = countMatching(
      POTENTIAL_DOCUMENTS,
      (item) => documentYear(item) === year && inVolume(item, scope.volumeId)
    );
    const highLeadCount = countMatching(
      POTENTIAL_DOCUMENTS,
      (item) => documentYear(item) === year && inVolume(item, scope.volumeId) && item.priority === "High"
    );

    const cells = [
      createCoverageCount(recordCount, { target: "records", year, volumeId: scope.volumeId }),
      createCoverageCount(statementCount, { target: "statements", year, volumeId: scope.volumeId }),
      createCoverageCount(leadCount, { target: "documents", year, volumeId: scope.volumeId }),
      createCoverageCount(highLeadCount, { target: "documents", year, volumeId: scope.volumeId, priority: "High" })
    ];

    for (const content of cells) {
      const cell = document.createElement("td");
      cell.append(content);
      row.append(cell);
    }

    tbody.append(row);
  }

  table.append(thead, tbody);

  const note = document.createElement("p");
  note.className = "coverage-note";
  note.textContent =
    "Counts are source appearances in the current assister, not final FRUS selections; source leads can map to multiple volumes.";

  article.append(title, table, note);
  return article;
}

function renderCoverage() {
  if (!coverageRoot) return;
  const scopes = [
    { label: "All Volumes", volumeId: "" },
    ...VOLUMES.map((volume) => ({
      label: `Volume ${volume.number}`,
      volumeId: volume.id
    }))
  ];
  coverageRoot.replaceChildren(...scopes.map(createCoverageTable));
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
        { label: "PDD worksheet", target: "pdd" },
        { label: "High-priority PDD", target: "pdd", priority: "High" }
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
        { label: "Unworked high pulls", target: "library", priority: "High", status: "__unworked__" },
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

function hasSection(item, section) {
  return item.section === section || (item.sections || []).includes(section);
}

function buildCompilerWorklist() {
  const sourceExceptionRecords = allRecords.filter((record) =>
    (record.sourceNoteIssues || []).some((issue) => ["missing-pdf-url", "missing-release-id"].includes(issue))
  );
  const missingPdfRecords = allRecords.filter((record) => !record.pdfUrl);
  const crossVolumeRecords = allRecords.filter((record) => (record.queues || []).includes("cross-volume"));
  const xxiiRecords = allRecords.filter((record) => (record.volumeIds || []).includes("frus1993-00v22"));
  const undatedDocuments = POTENTIAL_DOCUMENTS.filter((item) => !item.date);
  const highUndatedDocuments = undatedDocuments.filter((item) => item.priority === "High");
  const pddDocuments = POTENTIAL_DOCUMENTS.filter((item) => item.sourceType === "Presidential Daily Diary");
  const highPddDocuments = pddDocuments.filter((item) => item.priority === "High");
  const libraryLeads = LIBRARY_RESEARCH.leads || [];
  const highLibraryLeads = libraryLeads.filter((lead) => lead.priority === "High");
  const highStatements = PUBLIC_STATEMENTS.filter((statement) => /high/i.test(statement.priority || ""));
  const balkans1999Leads = POTENTIAL_DOCUMENTS.filter(
    (item) => hasSection(item, "Balkans and Kosovo") && documentYear(item) === "1999"
  );
  const highBalkans1999Leads = balkans1999Leads.filter((item) => item.priority === "High");
  const earlyNatoEuRecords = allRecords.filter(
    (record) => record.section === "NATO and EU" && ["1993", "1994", "1995", "1996"].includes(chronologyYear(record))
  );
  const earlyNatoEuLeads = POTENTIAL_DOCUMENTS.filter(
    (item) =>
      (hasSection(item, "NATO and European Security") || hasSection(item, "EU, OSCE, and Summits")) &&
      ["1993", "1994", "1995", "1996"].includes(documentYear(item))
  );
  const countryHoleNames = ["Netherlands", "Belgium", "Portugal", "Austria", "Denmark", "Norway", "Sweden", "Finland"];
  const countryHoles = countryHoleNames.filter((country) => !allRecords.some((record) => recordSearchText(record).includes(country.toLowerCase())));

  return [
    {
      priority: "Critical",
      lane: "Source Integrity",
      count: `${sourceExceptionRecords.length} records`,
      title: "Clear blocking source-note exceptions",
      why:
        "Before a record can become a FRUS text candidate, missing PDFs and missing release identifiers need to be resolved or explicitly marked unavailable.",
      output: "A source-note exception sheet with final status for each missing PDF or missing release-id item.",
      evidence: `${missingPdfRecords.length} records lack direct PDF links; ${sourceExceptionRecords.length} records have missing-PDF or missing-release metadata flags.`,
      actions: [
        { label: "Missing PDFs", target: "records", queue: "pdf-missing" },
        { label: "Missing release IDs", target: "records", search: "missing-release-id" }
      ]
    },
    {
      priority: "Critical",
      lane: "Chronology Control",
      count: `${highUndatedDocuments.length}/${undatedDocuments.length}`,
      title: "Date the high-priority external leads first",
      why:
        "Undated leads are the easiest way to lose a key source across the XXIII/XXIV date boundary, especially for Bosnia and Kosovo.",
      output: "A dated lead list with any Kosovo/Bosnia folder-level records split into the correct policy volume.",
      evidence: `${highUndatedDocuments.length} high-priority leads and ${undatedDocuments.length} total source leads are still date-pending.`,
      actions: [
        { label: "High undated leads", target: "documents", year: "Date pending", priority: "High" },
        { label: "All date-pending leads", target: "documents", year: "Date pending" }
      ]
    },
    {
      priority: "High",
      lane: "Volume Placement",
      count: `${xxiiRecords.length} records`,
      title: "Create the Volume XXII keeper versus cross-reference split",
      why:
        "Every declassified memcon/telcon touches the high-level contacts volume, but many should support XXIII or XXIV as cross-references rather than full XXII text selections.",
      output: "A keeper list with one disposition per high-level contact: full text, policy-volume cross-reference, or omit.",
      evidence: `${crossVolumeRecords.length} records are flagged for cross-volume review across Volumes XXII, XXIII, and XXIV.`,
      actions: [
        { label: "Undecided XXII", target: "records", volumeId: "frus1993-00v22", decision: "__undecided__" },
        { label: "XXII contacts", target: "records", volumeId: "frus1993-00v22" },
        { label: "XXIII band", target: "records", volumeId: "frus1993-00v23" },
        { label: "XXIV band", target: "records", volumeId: "frus1993-00v24" }
      ]
    },
    {
      priority: "High",
      lane: "Daily Diary",
      count: `${highPddDocuments.length}/${pddDocuments.length}`,
      title: "Reconcile PDD calls and meetings against memcons/telcons",
      why:
        "The diary can reveal calls or meetings that need a matching memcon, briefing book, public statement, or explicit absence note in the compilation file.",
      output: "A PDD reconciliation log tying each high-priority meeting/call to an internal source or a documented gap.",
      evidence: `${highPddDocuments.length} high-priority Presidential Daily Diary leads are available out of ${pddDocuments.length} total diary hits.`,
      actions: [
        { label: "High-priority PDD", target: "pdd", priority: "High" },
        { label: "Unresolved PDD", target: "pdd", status: "__unresolved__" },
        { label: "All PDD leads", target: "pdd" }
      ]
    },
    {
      priority: "High",
      lane: "Library Visit",
      count: `${highLibraryLeads.length} pulls`,
      title: "Pre-build the Clinton Library reading-room pull slips",
      why:
        "The finding-aid pass is too large to browse cold on site; the first visit should start with decision-control, PC/DC, trip-book, NATO, Kosovo, and Northern Ireland runs.",
      output: "A box/folder pull sheet sorted by cluster, OA box, finding-aid part, page, and line.",
      evidence: `${highLibraryLeads.length} high-priority pull leads are flagged across ${libraryLeads.length} total finding-aid leads.`,
      actions: [
        { label: "Unworked high pulls", target: "library", priority: "High", status: "__unworked__" },
        { label: "High-priority pulls", target: "library", priority: "High" },
        { label: "PC/DC cluster", target: "library", clusterId: "pc-dc-policy-control" },
        { label: "NATO summit cluster", target: "library", clusterId: "nato-eu-summits" }
      ]
    },
    {
      priority: "High",
      lane: "Balkans and Kosovo",
      count: `${balkans1999Leads.length} leads`,
      title: "Break the 1999 Kosovo block into a sub-series",
      why:
        "The 1999 lead volume is large enough to distort the Balkans chapter unless Kosovo, Bosnia/SFOR, NATO use-of-force, and diplomatic follow-through are separated.",
      output: "A 1999 Kosovo/Balkans sub-series with high-priority items reviewed first and medium-priority runs batched by source family.",
      evidence: `${balkans1999Leads.length} Balkans/Kosovo leads fall in 1999; ${highBalkans1999Leads.length} are currently high-priority.`,
      actions: [
        { label: "1999 Balkans leads", target: "documents", search: "Balkans and Kosovo", year: "1999" },
        { label: "Kosovo leads", target: "documents", search: "Kosovo", year: "1999" }
      ]
    },
    {
      priority: "High",
      lane: "NATO and EU",
      count: `${earlyNatoEuRecords.length} records`,
      title: "Build the 1993-1996 NATO/EU policy spine",
      why:
        "The early policy volume needs a stronger internal-document line for Partnership for Peace, NATO enlargement, OSCE, EU, and transatlantic agenda decisions.",
      output: "A chronological NATO/EU spine with decision memoranda, summit books, and briefing papers separated from public-context material.",
      evidence: `${earlyNatoEuRecords.length} direct NATO/EU chronology records and ${earlyNatoEuLeads.length} early NATO/EU source leads are currently visible for 1993-1996.`,
      actions: [
        { label: "NATO/EU records", target: "records", search: "NATO", volumeId: "frus1993-00v23" },
        { label: "Early NATO/EU leads", target: "documents", search: "NATO", volumeId: "frus1993-00v23" }
      ]
    },
    {
      priority: "Medium",
      lane: "Country Balance",
      count: `${countryHoles.length} gaps`,
      title: "Audit low-visibility Western Europe partners",
      why:
        "Current direct records cluster around the United Kingdom, France, and Germany; smaller partners still matter for NATO, EU, summit, and Balkans diplomacy.",
      output: "A country-balance note listing search results, confirmed omissions, and any source leads promoted for Spain, Benelux, Portugal, Nordics, Austria, Greece, and Turkey.",
      evidence: `${countryHoles.join(", ")} currently have no direct Clinton Library chronology hits in the working set.`,
      actions: [
        { label: "Western Europe leads", target: "documents", search: "Western Europe Bilateral" },
        { label: "Statements context", target: "statements", section: "Western Europe Bilateral" }
      ]
    },
    {
      priority: "Medium",
      lane: "Public Context",
      count: `${highStatements.length} statements`,
      title: "Tie public statements to internal selection choices",
      why:
        "Public Papers should frame the documentary chronology and explain omissions, but they should not substitute for internal memoranda or decision records.",
      output: "A public-context crosswalk linking speeches, statements, and declarations to internal records or source-lead gaps.",
      evidence: `${highStatements.length} high-priority public statements are mapped to the volume set out of ${PUBLIC_STATEMENTS.length} total public-statement records.`,
      actions: [
        { label: "High statements", target: "statements", priority: "high" },
        { label: "All statements", target: "statements" }
      ]
    }
  ];
}

function createWorklistCard(item, index) {
  const card = document.createElement("article");
  card.className = `worklist-card ${severityClass(item.priority)}`;

  const header = document.createElement("div");
  header.className = "gap-card-header";
  const priority = document.createElement("span");
  priority.className = "gap-severity";
  priority.textContent = item.priority;
  const lane = document.createElement("span");
  lane.className = "gap-area";
  lane.textContent = item.lane;
  header.append(priority, lane);

  const count = document.createElement("strong");
  count.className = "worklist-count";
  count.textContent = item.count;

  const title = document.createElement("h3");
  title.textContent = `${String(index + 1).padStart(2, "0")}. ${item.title}`;

  const why = document.createElement("p");
  why.className = "gap-risk";
  why.textContent = item.why;

  const body = document.createElement("div");
  body.className = "worklist-body";
  const output = document.createElement("p");
  const outputLabel = document.createElement("strong");
  outputLabel.textContent = "Output:";
  output.append(outputLabel, ` ${item.output}`);
  const evidence = document.createElement("p");
  const evidenceLabel = document.createElement("strong");
  evidenceLabel.textContent = "Evidence:";
  evidence.append(evidenceLabel, ` ${item.evidence}`);
  body.append(output, evidence);

  const actions = document.createElement("div");
  actions.className = "gap-actions";
  for (const action of item.actions || []) actions.append(createTriageAction(action));

  card.append(header, count, title, why, body);
  if (actions.children.length) card.append(actions);
  return card;
}

function renderWorklist() {
  if (!worklistRoot) return;
  worklistRoot.replaceChildren(...buildCompilerWorklist().map(createWorklistCard));
}

function exportCurrentWorklist() {
  downloadCsv(`clinton-europe-compiler-worklist-${exportDateStamp()}.csv`, buildCompilerWorklist(), [
    { label: "priority", value: (item) => item.priority },
    { label: "lane", value: (item) => item.lane },
    { label: "count", value: (item) => item.count },
    { label: "title", value: (item) => item.title },
    { label: "why", value: (item) => item.why },
    { label: "output", value: (item) => item.output },
    { label: "evidence", value: (item) => item.evidence },
    { label: "actions", value: (item) => (item.actions || []).map((action) => action.label) }
  ]);
}

function pddCode(index) {
  return `PDD ${String(index + 1).padStart(3, "0")}`;
}

function pddStatusFor(item) {
  return pddStatuses[item.id]?.status || "";
}

function sameDayRecords(item) {
  if (!item.date) return [];
  return allRecords.filter((record) => record.date === item.date).sort(byChronology);
}

function sameDayStatements(item) {
  if (!item.date) return [];
  return PUBLIC_STATEMENTS.filter((statement) => statement.date === item.date).sort(byStatementSectionThenDate);
}

function sameDayPddLeads(record) {
  if (!record.date) return [];
  return pddLeads.filter((item) => item.date === record.date).sort(byPddChronology);
}

function sameDayPublicStatements(record) {
  if (!record.date) return [];
  return PUBLIC_STATEMENTS.filter((statement) => statement.date === record.date).sort(byStatementSectionThenDate);
}

function populatePddFilters() {
  addOptions(pddPriorityFilter, uniqueSorted(pddLeads.map((item) => item.priority)), "All priorities");
  if (pddStatusFilter) {
    pddStatusFilter.replaceChildren(...PDD_STATUS_FILTER_OPTIONS.map(([value, label]) => new Option(label, value)));
  }
}

function pddSearchText(item) {
  return [
    potentialDocumentSearchText(item),
    pddStatusLabel(pddStatusFor(item)),
    ...sameDayRecords(item).map((record) => `${record.title} ${record.compilerNumber} ${record.section}`),
    ...sameDayStatements(item).map((statement) => `${statement.title} ${statement.sections?.join(" ")}`)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterPddLeads(items) {
  const query = pddSearch?.value.trim().toLowerCase() || "";
  const priority = pddPriorityFilter?.value || "";
  const status = pddStatusFilter?.value || "";

  return items.filter((item) => {
    if (priority && item.priority !== priority) return false;
    const itemStatus = pddStatusFor(item);
    if (status === "__unresolved__" && itemStatus) return false;
    if (status && status !== "__unresolved__" && itemStatus !== status) return false;
    return !query || pddSearchText(item).includes(query);
  });
}

function exportCurrentPdd() {
  const rows = filterPddLeads(pddLeads).sort(byPddChronology);
  downloadCsv(`clinton-europe-pdd-reconciliation-${exportDateStamp()}.csv`, rows, [
    { label: "status", value: (item) => pddStatusLabel(pddStatusFor(item)) },
    { label: "status_value", value: (item) => pddStatusFor(item) },
    { label: "status_updated_at", value: (item) => pddStatuses[item.id]?.updatedAt || "" },
    { label: "date", value: (item) => item.date || "Date pending" },
    { label: "priority", value: (item) => item.priority },
    { label: "score", value: (item) => item.score },
    { label: "title", value: (item) => item.title },
    { label: "section", value: (item) => item.section || item.sections?.[0] },
    { label: "volumes", value: (item) => displayVolumeLabels(item) },
    { label: "identifier", value: (item) => item.identifier },
    { label: "same_day_record_count", value: (item) => sameDayRecords(item).length },
    { label: "same_day_records", value: (item) => sameDayRecords(item).map((record) => `${record.compilerNumber}: ${record.title}`) },
    { label: "same_day_statement_count", value: (item) => sameDayStatements(item).length },
    { label: "same_day_statements", value: (item) => sameDayStatements(item).map((statement) => statement.title) },
    { label: "summary", value: (item) => item.summary },
    { label: "source_note", value: (item) => item.sourceNote },
    { label: "source_url", value: (item) => item.sourceUrl },
    { label: "pdf_url", value: (item) => item.pdfUrl || item.digitalObjectUrl }
  ]);
}

function createPddStatusControl(item) {
  const wrap = document.createElement("div");
  wrap.className = "pdd-status-control";

  const label = document.createElement("label");
  const labelText = document.createElement("span");
  labelText.textContent = "Reconciliation status";
  const select = document.createElement("select");
  select.replaceChildren(...PDD_STATUS_OPTIONS.map(([value, optionLabel]) => new Option(optionLabel, value)));
  select.value = pddStatusFor(item);
  label.append(labelText, select);

  const status = document.createElement("p");
  status.className = "selection-status";
  const updateStatus = () => {
    const saved = pddStatuses[item.id];
    status.textContent = saved?.status
      ? `Saved as ${pddStatusLabel(saved.status)}${saved.updatedAt ? ` on ${formatDate(saved.updatedAt.slice(0, 10))}` : ""}.`
      : "No reconciliation status saved.";
  };
  updateStatus();

  select.addEventListener("change", () => {
    setPddStatus(item, select.value);
    updateStatus();
    if (pddStatusFilter?.value) updatePddView();
  });

  wrap.append(label, status);
  return wrap;
}

function createPddMatchList(title, items, emptyText, formatter) {
  const wrap = document.createElement("div");
  wrap.className = "pdd-match-list";
  const heading = document.createElement("h4");
  heading.textContent = `${title} (${items.length})`;
  const list = document.createElement("ul");
  for (const item of items.slice(0, 4)) {
    const li = document.createElement("li");
    const formatted = formatter(item);
    if (formatted.href) {
      const link = document.createElement("a");
      link.href = formatted.href;
      link.rel = "noreferrer";
      link.textContent = formatted.label;
      li.append(link);
    } else {
      li.textContent = formatted.label;
    }
    list.append(li);
  }
  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = emptyText;
    list.append(li);
  } else if (items.length > 4) {
    const li = document.createElement("li");
    li.textContent = `Plus ${items.length - 4} more same-day item${items.length - 4 === 1 ? "" : "s"}.`;
    list.append(li);
  }
  wrap.append(heading, list);
  return wrap;
}

function createPddRow(item, index) {
  const row = document.createElement("article");
  row.className = "document-row pdd-row";

  const dateStack = document.createElement("div");
  dateStack.className = "record-date-stack";
  const number = document.createElement("span");
  number.className = "record-doc-number";
  number.textContent = pddCode(index);
  const date = document.createElement("time");
  date.className = "record-date";
  if (/^\d{4}-\d{2}-\d{2}$/.test(item.date || "")) date.dateTime = item.date;
  date.textContent = shortDate(item.date);
  dateStack.append(number, date);

  const body = document.createElement("div");
  const title = document.createElement("a");
  title.className = "record-title";
  title.href = item.sourceUrl || item.pdfUrl || item.digitalObjectUrl || "#";
  title.rel = "noreferrer";
  title.textContent = item.title;

  const sourceLine = document.createElement("p");
  sourceLine.className = "record-source-line";
  sourceLine.textContent = `${item.identifier || "Diary entry"} / ${item.sourceCollection || "Presidential Daily Diary"}`;

  const note = document.createElement("p");
  note.className = "record-note";
  note.textContent = item.summary || "Diary lead queued for reconciliation.";

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

  const matches = document.createElement("div");
  matches.className = "pdd-match-panel";
  matches.append(
    createPddStatusControl(item),
    createPddMatchList(
      "Same-day chronology",
      sameDayRecords(item),
      "No same-day memcon/telcon currently in the chronology.",
      (record) => ({ label: `${record.compilerNumber}: ${record.title}`, href: record.itemUrl || record.pdfUrl })
    ),
    createPddMatchList(
      "Same-day public statements",
      sameDayStatements(item),
      "No same-day public statement currently mapped.",
      (statement) => ({ label: statement.title, href: statement.detailsUrl || statement.textUrl || statement.pdfUrl })
    )
  );

  const sourceTrail = document.createElement("details");
  sourceTrail.className = "record-source-note";
  const summary = document.createElement("summary");
  summary.textContent = "Diary source note";
  const sourceText = document.createElement("p");
  sourceText.className = "record-frus-source-note";
  sourceText.textContent = item.sourceNote || "Diary source note pending.";
  const queries = document.createElement("p");
  queries.textContent = item.matchedQueries?.length
    ? `Matched queries: ${item.matchedQueries.slice(0, 12).join("; ")}.`
    : "Matched query trail pending.";
  sourceTrail.append(summary, sourceText, queries);

  body.append(title, sourceLine, note, meta, matches, sourceTrail);

  const links = document.createElement("div");
  links.className = "record-links";
  for (const [label, url] of [
    ["PDF", item.pdfUrl],
    ["Source", item.sourceUrl],
    ["Catalog", item.catalogUrl],
    ["Report", item.sourceReports?.[0]]
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

function renderPddLeads(items) {
  if (!pddRoot) return;
  pddRoot.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty-section";
    empty.textContent = pddLeads.length
      ? "No Presidential Daily Diary leads match the current filters."
      : "No Presidential Daily Diary leads have been generated yet.";
    pddRoot.append(empty);
    return;
  }

  const sorted = [...items].sort(byPddChronology);
  const pddNumbers = new Map(pddLeads.map((item, index) => [item.id, index]));
  const years = uniqueInOrder(sorted.map(documentYear));
  for (const year of years) {
    const yearItems = sorted.filter((item) => documentYear(item) === year);
    const section = document.createElement("section");
    section.className = "record-section pdd-year-section";
    section.id = `pdd-${year.toLowerCase().replaceAll(" ", "-")}`;

    const header = document.createElement("div");
    header.className = "record-section-header";
    const heading = document.createElement("h3");
    heading.textContent = year;
    const count = document.createElement("p");
    count.className = "record-count";
    count.textContent = `${yearItems.length} diary leads`;
    header.append(heading, count);

    const list = document.createElement("div");
    list.className = "record-list pdd-list";
    for (const item of yearItems) list.append(createPddRow(item, pddNumbers.get(item.id) || 0));

    section.append(header, list);
    pddRoot.append(section);
  }
}

function updatePddSummary(items) {
  if (!pddSummary) return;
  const priority = pddPriorityFilter?.selectedOptions?.[0]?.textContent || "All priorities";
  const status = pddStatusFilter?.selectedOptions?.[0]?.textContent || "All statuses";
  pddSummary.textContent = `Showing ${items.length} of ${pddLeads.length} diary leads / ${priority} / ${status}`;
}

function updatePddView() {
  const filtered = filterPddLeads(pddLeads).sort(byPddChronology);
  updatePddSummary(filtered);
  renderPddLeads(filtered);
  updatePddStatusCount();
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

  const decisions = document.createElement("div");
  decisions.className = "desk-panel desk-panel-wide";
  const decisionsTitle = document.createElement("h3");
  decisionsTitle.textContent = "Selection Decisions";
  const decisionRows = selectionDecisionRows();
  const decisionList = document.createElement("ol");
  decisionList.className = "desk-list";
  for (const [value, label] of DECISION_OPTIONS.filter(([optionValue]) => optionValue)) {
    const count = decisionRows.filter(({ saved }) => saved.decision === value).length;
    const item = document.createElement("li");
    item.textContent = `${label}: ${count}`;
    decisionList.append(item);
  }
  const undecidedItem = document.createElement("li");
  undecidedItem.textContent = `Undecided records: ${records.length - decisionRows.length}`;
  decisionList.append(undecidedItem);
  const decisionActions = document.createElement("div");
  decisionActions.className = "queue-buttons decision-actions";
  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.className = "queue-button";
  exportButton.textContent = `Export saved decisions (${decisionRows.length})`;
  exportButton.addEventListener("click", exportCurrentDecisions);
  decisionActions.append(exportButton);
  decisions.append(decisionsTitle, decisionList, decisionActions);

  deskRoot.replaceChildren(metrics, queues, sections, split, decisions);
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

function issueLabel(issue) {
  return titleCase((issue || "").replaceAll("-", " "));
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the textarea copy path below.
    }
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  field.style.top = "0";
  document.body.append(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Copy command unavailable");
  return true;
}

function createCopyButton(text, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-button";
  button.textContent = label;
  button.disabled = !text;
  button.addEventListener("click", async () => {
    if (!text) return;
    try {
      await copyText(text);
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = label;
      }, 1800);
    } catch {
      button.textContent = "Copy unavailable";
      window.setTimeout(() => {
        button.textContent = label;
      }, 2200);
    }
  });
  return button;
}

function sourceCheckItems(record) {
  const issues = new Set(record.sourceNoteIssues || []);
  return [
    {
      label: "Release ID",
      value: record.releaseId || "Missing",
      state: record.releaseId ? "ok" : "issue"
    },
    {
      label: "PDF",
      value: record.pdfUrl ? "Linked" : "Missing",
      state: record.pdfUrl ? "ok" : "issue"
    },
    {
      label: "Archival folder",
      value: issues.has("archival-box-folder-pending") ? "Cover sheet needed" : "No flag",
      state: issues.has("archival-box-folder-pending") ? "pending" : "ok"
    },
    {
      label: "Class/draft line",
      value: issues.has("classification-drafting-approval-pending") ? "Cover sheet needed" : "No flag",
      state: issues.has("classification-drafting-approval-pending") ? "pending" : "ok"
    },
    {
      label: "Blocking issues",
      value: (record.sourceNoteIssues || []).filter((issue) => /missing/.test(issue)).map(issueLabel).join("; ") || "None flagged",
      state: (record.sourceNoteIssues || []).some((issue) => /missing/.test(issue)) ? "issue" : "ok"
    }
  ];
}

function createSourceCheckPanel(record) {
  const panel = document.createElement("div");
  panel.className = "source-check-panel";

  const list = document.createElement("dl");
  list.className = "source-check-list";
  for (const item of sourceCheckItems(record)) {
    const wrap = document.createElement("div");
    wrap.className = `source-check-item source-check-${item.state}`;
    const term = document.createElement("dt");
    term.textContent = item.label;
    const detail = document.createElement("dd");
    detail.textContent = item.value;
    wrap.append(term, detail);
    list.append(wrap);
  }

  const actions = document.createElement("div");
  actions.className = "source-check-actions";
  actions.append(createCopyButton(record.sourceNote || "", "Copy source note"));
  if (record.provenanceNote) actions.append(createCopyButton(record.provenanceNote, "Copy provenance"));

  panel.append(list, actions);
  return panel;
}

function createSameDayContextList(title, items, emptyText, getLink) {
  const wrap = document.createElement("div");
  wrap.className = "same-day-context-list";

  const heading = document.createElement("h4");
  heading.textContent = `${title} (${items.length})`;
  wrap.append(heading);

  if (!items.length) {
    const empty = document.createElement("p");
    empty.textContent = emptyText;
    wrap.append(empty);
    return wrap;
  }

  const list = document.createElement("ul");
  for (const item of items.slice(0, 8)) {
    const row = document.createElement("li");
    const { label, href, meta } = getLink(item);
    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.rel = "noreferrer";
      link.textContent = label;
      row.append(link);
    } else {
      row.textContent = label;
    }
    if (meta) {
      const metaNode = document.createElement("span");
      metaNode.textContent = meta;
      row.append(metaNode);
    }
    list.append(row);
  }

  if (items.length > 8) {
    const row = document.createElement("li");
    row.textContent = `${items.length - 8} more same-day items.`;
    list.append(row);
  }

  wrap.append(list);
  return wrap;
}

function createSameDayContextActions(record, pddItems, statements) {
  const actions = document.createElement("div");
  actions.className = "same-day-context-actions";

  const pddButton = document.createElement("button");
  pddButton.type = "button";
  pddButton.textContent = `PDD on ${shortDate(record.date)} (${pddItems.length})`;
  pddButton.disabled = pddItems.length === 0;
  pddButton.addEventListener("click", () => applyRelatedFilter({ target: "pdd", search: record.date }));
  actions.append(pddButton);

  const statementsButton = document.createElement("button");
  statementsButton.type = "button";
  statementsButton.textContent = `Public Papers on ${shortDate(record.date)} (${statements.length})`;
  statementsButton.disabled = statements.length === 0;
  statementsButton.addEventListener("click", () => applyRelatedFilter({ target: "statements", search: record.date }));
  actions.append(statementsButton);

  return actions;
}

function createSameDayContextPanel(record) {
  const pddItems = sameDayPddLeads(record);
  const statements = sameDayPublicStatements(record);
  const hasContext = Boolean(pddItems.length || statements.length);

  const details = document.createElement("details");
  details.className = `same-day-context${hasContext ? " has-context" : ""}`;
  const summary = document.createElement("summary");
  summary.textContent = hasContext
    ? `Same-day context: ${pddItems.length} PDD / ${statements.length} public`
    : "Same-day context: none mapped";

  const panel = document.createElement("div");
  panel.className = "same-day-context-grid";
  panel.append(
    createSameDayContextList(
      "Presidential Daily Diary",
      pddItems,
      "No same-day diary lead currently mapped.",
      (item) => ({
        label: item.title,
        href: item.sourceUrl || item.pdfUrl || item.digitalObjectUrl,
        meta: [item.priority, pddStatusLabel(pddStatusFor(item))].filter(Boolean).join(" / ")
      })
    ),
    createSameDayContextList(
      "Public Papers",
      statements,
      "No same-day public statement currently mapped.",
      (statement) => ({
        label: statement.title,
        href: statement.detailsUrl || statement.textUrl || statement.pdfUrl,
        meta: [statement.priority ? `${titleCase(statement.priority)} priority` : "", primaryStatementSection(statement)].filter(Boolean).join(" / ")
      })
    )
  );

  if (record.date && hasContext) panel.append(createSameDayContextActions(record, pddItems, statements));

  details.append(summary, panel);
  return details;
}

function createSelectionControl(record) {
  const wrap = document.createElement("div");
  wrap.className = "selection-control";

  const label = document.createElement("label");
  const labelText = document.createElement("span");
  labelText.textContent = "Selection decision";
  const select = document.createElement("select");
  select.replaceChildren(...DECISION_OPTIONS.map(([value, optionLabel]) => new Option(optionLabel, value)));
  select.value = decisionForRecord(record);
  label.append(labelText, select);

  const status = document.createElement("p");
  status.className = "selection-status";
  const updateStatus = () => {
    const saved = selectionDecisions[record.id];
    status.textContent = saved?.decision
      ? `Saved as ${decisionLabel(saved.decision)}${saved.updatedAt ? ` on ${formatDate(saved.updatedAt.slice(0, 10))}` : ""}.`
      : "No selection decision saved.";
  };
  updateStatus();

  select.addEventListener("change", () => {
    setRecordDecision(record, select.value);
    updateStatus();
    if (decisionFilter?.value) updateRecordsView();
  });

  wrap.append(label, status);
  return wrap;
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
  if (libraryStatusFilter) {
    libraryStatusFilter.replaceChildren(...LIBRARY_STATUS_FILTER_OPTIONS.map(([value, label]) => new Option(label, value)));
  }
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
    libraryStatusLabel(libraryStatuses[lead.id]?.status || ""),
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
  const status = libraryStatusFilter?.value || "";

  return leads.filter((lead) => {
    if (cluster && !(lead.clusterIds || []).includes(cluster)) return false;
    if (priority && lead.priority !== priority) return false;
    const leadStatus = libraryStatuses[lead.id]?.status || "";
    if (status === "__unworked__" && leadStatus) return false;
    if (status && status !== "__unworked__" && leadStatus !== status) return false;
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
    { label: "pull_status", value: (lead) => libraryStatusLabel(libraryStatuses[lead.id]?.status || "") },
    { label: "pull_status_value", value: (lead) => libraryStatuses[lead.id]?.status || "" },
    { label: "pull_status_updated_at", value: (lead) => libraryStatuses[lead.id]?.updatedAt || "" },
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

function createLibraryStatusControl(lead) {
  const wrap = document.createElement("div");
  wrap.className = "library-status-control selection-control";

  const label = document.createElement("label");
  const labelText = document.createElement("span");
  labelText.textContent = "Reading-room status";
  const select = document.createElement("select");
  select.replaceChildren(...LIBRARY_STATUS_OPTIONS.map(([value, optionLabel]) => new Option(optionLabel, value)));
  select.value = libraryStatuses[lead.id]?.status || "";
  label.append(labelText, select);

  const status = document.createElement("p");
  status.className = "selection-status";
  const updateStatus = () => {
    const saved = libraryStatuses[lead.id];
    status.textContent = saved?.status
      ? `Saved as ${libraryStatusLabel(saved.status)}${saved.updatedAt ? ` on ${formatDate(saved.updatedAt.slice(0, 10))}` : ""}.`
      : "No reading-room status saved.";
  };
  updateStatus();

  select.addEventListener("change", () => {
    setLibraryStatus(lead, select.value);
    updateStatus();
    if (libraryStatusFilter?.value) updateLibraryView();
  });

  wrap.append(label, status);
  return wrap;
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

  body.append(title, sourceLine, note, meta, createLibraryStatusControl(lead));

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
    librarySearch?.value.trim() || libraryClusterFilter?.value || libraryPriorityFilter?.value || libraryStatusFilter?.value
  );
  const leadLimit = hasNarrowFilter ? 80 : 30;

  if (librarySearch?.value.trim() || libraryStatusFilter?.value) {
    const section = document.createElement("section");
    section.className = "record-section library-lead-section";

    const header = document.createElement("div");
    header.className = "record-section-header";
    const heading = document.createElement("h3");
    heading.textContent = "Filtered Pull Leads";
    const count = document.createElement("p");
    count.className = "record-count";
    count.textContent = `${leads.length} leads`;
    header.append(heading, count);

    const list = document.createElement("div");
    list.className = "record-list";
    for (const lead of leads.slice(0, leadLimit)) list.append(createLibraryLeadRow(lead));

    if (leads.length > leadLimit) {
      const truncated = document.createElement("p");
      truncated.className = "empty-section";
      truncated.textContent = `Showing the first ${leadLimit} filtered pull leads. Narrow the search to see more precise pull targets.`;
      list.append(truncated);
    }

    section.append(header, list);
    libraryLeadsRoot.append(section);
    return;
  }

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
  const status = libraryStatusFilter?.selectedOptions?.[0]?.textContent || "All statuses";
  librarySummary.textContent = `Showing ${leads.length} of ${(LIBRARY_RESEARCH.leads || []).length} Clinton Library pull leads / ${cluster} / ${priority} / ${status}`;
}

function updateLibraryView() {
  const filtered = sortLibraryLeads(filterLibraryLeads(LIBRARY_RESEARCH.leads || []));
  updateLibrarySummary(filtered);
  renderLibraryLeads(filtered);
  updateLibraryStatusCount();
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
  sourceNote.append(summary, createSourceCheckPanel(record), sourceText, provenance, issues, subjects);

  body.append(title, sourceLine, note, meta, topics, flags, createSelectionControl(record), createSameDayContextPanel(record), sourceNote);

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
  const decision = decisionFilter?.selectedOptions?.[0]?.textContent || "All decisions";
  recordsSummary.textContent = `Showing ${records.length} of ${allRecords.length} records / ${volume} / ${year} / ${section} / ${queue} / ${decision}`;
}

function updateRecordsView() {
  const filtered = filterRecords(allRecords).sort(byChronology);
  renderChronologyQuickFilters(allRecords);
  updateSummary(filtered);
  renderRecords(filtered);
  renderDesk(allRecords);
  setStats(allRecords);
}

function enableFilters() {
  for (const control of [searchInput, volumeFilter, recordYearFilter, sectionFilter, typeFilter, queueFilter, decisionFilter]) {
    control?.addEventListener("input", updateRecordsView);
    control?.addEventListener("change", updateRecordsView);
  }

  for (const control of [documentSearch, documentSourceFilter, documentYearFilter, documentVolumeFilter, documentPriorityFilter]) {
    control?.addEventListener("input", updatePotentialDocumentsView);
    control?.addEventListener("change", updatePotentialDocumentsView);
  }

  for (const control of [statementSearch, statementYearFilter, statementSectionFilter, statementVolumeFilter, statementPriorityFilter]) {
    control?.addEventListener("input", updateStatementsView);
    control?.addEventListener("change", updateStatementsView);
  }

  for (const control of [librarySearch, libraryClusterFilter, libraryPriorityFilter, libraryStatusFilter]) {
    control?.addEventListener("input", updateLibraryView);
    control?.addEventListener("change", updateLibraryView);
  }

  for (const control of [pddSearch, pddPriorityFilter, pddStatusFilter]) {
    control?.addEventListener("input", updatePddView);
    control?.addEventListener("change", updatePddView);
  }

  clearFilters?.addEventListener("click", () => {
    resetRecordFilterControls();
    updateRecordsView();
    searchInput?.focus();
  });
  exportRecords?.addEventListener("click", exportCurrentRecords);
  exportDecisions?.addEventListener("click", exportCurrentDecisions);

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

  clearStatementFilters?.addEventListener("click", () => {
    if (statementSearch) statementSearch.value = "";
    if (statementYearFilter) statementYearFilter.value = "";
    if (statementSectionFilter) statementSectionFilter.value = "";
    if (statementVolumeFilter) statementVolumeFilter.value = "";
    if (statementPriorityFilter) statementPriorityFilter.value = "";
    updateStatementsView();
    statementSearch?.focus();
  });
  exportStatements?.addEventListener("click", exportCurrentStatements);

  clearLibraryFilters?.addEventListener("click", () => {
    if (librarySearch) librarySearch.value = "";
    if (libraryClusterFilter) libraryClusterFilter.value = "";
    if (libraryPriorityFilter) libraryPriorityFilter.value = "";
    if (libraryStatusFilter) libraryStatusFilter.value = "";
    updateLibraryView();
    librarySearch?.focus();
  });
  exportLibrary?.addEventListener("click", exportCurrentLibraryLeads);
  exportWorklist?.addEventListener("click", exportCurrentWorklist);
  copySavedWork?.addEventListener("click", async () => {
    try {
      await copyText(savedWorkSummaryText());
      renderSavedWorkPanel("Copied saved-work summary.");
    } catch {
      renderSavedWorkPanel("Copy unavailable. Use Export JSON instead.");
    }
  });
  exportSavedWork?.addEventListener("click", () => {
    downloadJson(`clinton-europe-saved-work-${exportDateStamp()}.json`, savedWorkPayload());
    renderSavedWorkPanel("Downloaded saved-work JSON handoff.");
  });
  importSavedWork?.addEventListener("change", async () => {
    const [file] = importSavedWork.files || [];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      importSavedWorkPayload(payload);
    } catch {
      renderSavedWorkPanel("Import failed. Choose a saved-work JSON file exported from this page.");
    } finally {
      importSavedWork.value = "";
    }
  });
  clearPddFilters?.addEventListener("click", () => {
    if (pddSearch) pddSearch.value = "";
    if (pddPriorityFilter) pddPriorityFilter.value = "";
    if (pddStatusFilter) pddStatusFilter.value = "";
    updatePddView();
    pddSearch?.focus();
  });
  exportPdd?.addEventListener("click", exportCurrentPdd);
}

renderVolumes();
populateStatementFilters(PUBLIC_STATEMENTS);
updateStatementsView();
populateDocumentFilters(POTENTIAL_DOCUMENTS);
updatePotentialDocumentsView();
renderCompilerGaps();
populateLibraryFilters();
renderLibraryOverview();
updateLibraryView();
populatePddFilters();
updatePddView();
renderWorklist();
renderTriage();
renderCoverage();
populateFilters(allRecords);
enableFilters();
renderSavedWorkPanel();
updateRecordsView();
