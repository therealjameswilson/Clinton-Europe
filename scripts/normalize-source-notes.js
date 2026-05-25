const fs = require("fs");
const path = require("path");
const { buildStyleAudit, buildStyleAuditMarkdown, normalizeRecord } = require("./source-note-style");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "records.json");
const DATA_JS_PATH = path.join(ROOT, "data", "records.js");
const REPORT_JSON_PATH = path.join(ROOT, "reports", "source-note-style-audit.json");
const REPORT_MD_PATH = path.join(ROOT, "reports", "source-note-style-audit.md");

function main() {
  const records = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const normalized = records.map((record) => normalizeRecord(record));
  const audit = buildStyleAudit(normalized);
  const json = `${JSON.stringify(normalized, null, 2)}\n`;

  fs.writeFileSync(DATA_PATH, json);
  fs.writeFileSync(DATA_JS_PATH, `window.CLINTON_EUROPE_RECORDS = ${json};\n`);
  fs.writeFileSync(REPORT_JSON_PATH, `${JSON.stringify(audit, null, 2)}\n`);
  fs.writeFileSync(REPORT_MD_PATH, buildStyleAuditMarkdown(audit));

  console.log(
    `Normalized ${normalized.length} source notes; ${audit.summary.frusStyleCandidates} FRUS-style candidates, ${audit.summary.needsSourceNoteMetadata} metadata gaps.`
  );
}

main();
