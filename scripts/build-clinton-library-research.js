const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_PDFS = [1, 2, 3, 4].map((part) =>
  path.join(
    os.homedir(),
    "Library/Mobile Documents/com~apple~CloudDocs",
    `2013-0185-M_Part${part}.pdf`
  )
);

const CLUSTERS = [
  {
    id: "balkans-kosovo",
    title: "Balkans, Kosovo, and Stability Pact",
    section: "Balkans and Kosovo",
    priority: "Critical",
    patterns: [
      /Kosovo/i,
      /Bosnia/i,
      /SFOR|KFOR/i,
      /FRY|Yugoslav|Serbia|Milosevic|Montenegro/i,
      /Macedonia|Albania|Croatia|Slovenia/i,
      /Stability Pact|Dayton|ICTY|Balkans|Presevo/i,
      /Southeast European Affairs/i
    ],
    rationale:
      "Best on-site return for Volume XXIV and late Volume XXIII: PC/DC traffic, Kosovo implementation, Bosnia/SFOR, FRY, and Stability Pact files appear in dense runs."
  },
  {
    id: "nato-eu-summits",
    title: "NATO, EU, OSCE, and Summit Books",
    section: "NATO and European Security",
    priority: "Critical",
    patterns: [
      /NATO/i,
      /E\.U\.|\bEU\b|European Union/i,
      /OSCE|ESDI|CFE/i,
      /Summit|Sherpa|Briefing Book|POTUS Trip/i,
      /Partnership for Peace|Defense Capabilities/i
    ],
    rationale:
      "Targets the thin early NATO/EU gap: enlargement, Madrid, summit preparation, OSCE, EU, and defense-policy material."
  },
  {
    id: "northern-ireland",
    title: "Northern Ireland and UK-Ireland",
    section: "Western Europe Bilateral",
    priority: "High",
    patterns: [
      /Northern Ireland|Ireland|Sinn Fein|\bIRA\b|Good Friday/i,
      /Patten|Decommissioning|Demilitarization|Dublin|London|St\. Patrick/i,
      /Prime Minister Major|UK\/Ireland|United Kingdom/i
    ],
    rationale:
      "Keeps the peace-process file distinct from generic UK records, with strong folder runs around 1995, 1998, 1999, and 2000."
  },
  {
    id: "western-europe-bilateral",
    title: "Western Europe Bilateral Gaps",
    section: "Western Europe Bilateral",
    priority: "High",
    patterns: [
      /France|Chirac/i,
      /Germany|Bonn|Berlin/i,
      /Italy|D'Alema|Prodi|Aviano/i,
      /Spain|Aznar|Madrid/i,
      /Portugal|Netherlands|Belgium|Norway|Denmark|Sweden|Finland|Austria/i,
      /Greece|Cyprus|Turkey|Aegean/i
    ],
    rationale:
      "Builds pull targets for countries underrepresented in the existing memcon/telcon rows, especially Spain, Nordics, Greece/Cyprus/Turkey, Italy, Belgium, and Portugal."
  },
  {
    id: "central-eastern-europe",
    title: "Central/Eastern Europe and Accession",
    section: "Central and Eastern Europe",
    priority: "High",
    patterns: [
      /Poland|Warsaw/i,
      /Czech|Hungary|Romania|Bulgaria/i,
      /Baltic|Estonia|Latvia|Lithuania/i,
      /Ukraine|Kuchma|Slovak|Slovenia|Riga/i,
      /NATO Enlargement|accession/i
    ],
    rationale:
      "Supplies accession-era and trip-book targets for Poland, Czech/Hungary, Romania/Bulgaria, Baltics, and Ukraine cross-over issues."
  },
  {
    id: "pc-dc-policy-control",
    title: "PC/DC, PDD/PRD, and Decision Control",
    section: "Compiler Control",
    priority: "Critical",
    patterns: [
      /\bPC\b|Principals Committee/i,
      /\bDC\b|Deputies Committee/i,
      /PDD|PRD|Presidential Decision Directive|Presidential Review Directive/i,
      /Decision|Strategy|Policy|Pol-Mil/i
    ],
    rationale:
      "Highest value for limited reading-room time: these folders can anchor actual decision chronology instead of only briefing or public-context material."
  },
  {
    id: "russia-ukraine-cross-reference",
    title: "Russia/Ukraine Cross-Reference",
    section: "Russia Cross-Reference",
    priority: "Medium",
    patterns: [
      /Russia|Yeltsin|Gore-Chernomyrdin|NIS|Eurasian/i,
      /Ukraine|Kuchma|START|CFE|Helsinki/i
    ],
    rationale:
      "Useful only when the file directly bears on NATO, Ukraine, Balkans, European security, or summit placement."
  },
  {
    id: "public-context-speechwriting",
    title: "Speechwriting and Public Context",
    section: "Public Context",
    priority: "Medium",
    patterns: [
      /Speechwriting|Speech|Remarks|Radio Address|Press Availability|Statement|Op-Ed/i,
      /D-Day|UNGA|G-7|G-8/i
    ],
    rationale:
      "Lower priority than decision files, but useful for matching public statements to internal drafts, talking points, and trip messaging."
  }
];

const OFFICE_BOOST = /European Affairs|Southeast European Affairs|Kosovo Office|Bosnia-|Records Management|Staff Director|Executive Secretary|National Security Advisor|Defense Policy|Multilateral/i;
const EXCLUDE_OFFICE = /African Affairs|Inter-American|Asian Affairs|Near East|China|Korea|Latin America/i;
const PRIMARY_CLUSTER_IDS = new Set(
  CLUSTERS.filter((cluster) => !["pc-dc-policy-control", "public-context-speechwriting"].includes(cluster.id)).map(
    (cluster) => cluster.id
  )
);
const PUBLIC_CONTEXT_TERMS = /Europe|NATO|Kosovo|Bosnia|Ireland|D-Day|G-7|G-8|UNGA|France|Germany|Italy|Spain|Poland|Russia|Ukraine/i;
const HIGH_VALUE = [
  [/POTUS|President Clinton|President's|President /i, 8],
  [/\bPC\b|Principals Committee|\bDC\b|Deputies Committee/i, 9],
  [/PDD|PRD|Presidential Decision Directive|Presidential Review Directive/i, 9],
  [/Briefing Book|Trip Book|POTUS Trip|Summit|Visit|Meeting/i, 6],
  [/NATO Enlargement|Kosovo Air Campaign|KFOR|SFOR|Stability Pact|Dayton|Northern Ireland Peace|Good Friday/i, 7],
  [/Strategy|Decision|Policy|Pol-Mil|Implementation/i, 5],
  [/Chron Files|Notebook|Notes/i, 3],
  [/Speechwriting|Press|News Clips/i, -3]
];

function cleanText(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+([,;\]])/g, "$1")
    .replace(/\[(\d|1)\]/g, "[$1]")
    .trim();
}

function extractText(pdfPath) {
  return childProcess.execFileSync("pdftotext", ["-layout", pdfPath, "-"], {
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
}

function parseRows(text, part) {
  const rows = [];
  let page = 1;
  let last = null;
  const lines = text.split(/\r?\n/);

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
    const rawLine = lines[lineNumber];
    const pageBreaks = (rawLine.match(/\f/g) || []).length;
    const line = rawLine.replace(/\f/g, "").trimEnd();
    if (!line.trim()) {
      page += pageBreaks;
      continue;
    }

    const match = line.match(/^\s*(\d{2,5})\s+(.+?)\s{2,}([A-Za-z].*)$/);
    if (match) {
      last = {
        part,
        page,
        line: lineNumber + 1,
        box: match[1],
        folder: cleanText(match[2]),
        notes: cleanText(match[3])
      };
      rows.push(last);
    } else if (
      last &&
      /^\s{5,}\S/.test(rawLine) &&
      !/^(OA\/ID|Number|Folder|Notes|Withdrawal|DOCUMENT|SUBJECT|COLLECTION|RESTRICTION)/i.test(
        line.trim()
      )
    ) {
      const continuation = cleanText(line);
      if (
        continuation &&
        continuation.length < 120 &&
        !/Clinton Library|Presidential Records Act|Freedom of Information|RESTRICTION CODES/i.test(
          continuation
        )
      ) {
        last.folder = cleanText(`${last.folder} ${continuation}`);
      }
    }

    page += pageBreaks;
  }

  return rows.filter((row) => row.folder.length >= 2 && row.folder.length <= 220);
}

function clustersFor(row) {
  const haystack = `${row.folder} ${row.notes}`;
  return CLUSTERS.filter((cluster) => cluster.patterns.some((pattern) => pattern.test(haystack))).map(
    (cluster) => cluster.id
  );
}

function scoreRow(row, clusterIds) {
  const haystack = `${row.folder} ${row.notes}`;
  let score = clusterIds.length * 4;
  if (OFFICE_BOOST.test(row.notes)) score += 3;
  for (const [pattern, points] of HIGH_VALUE) {
    if (pattern.test(haystack)) score += points;
  }
  if (EXCLUDE_OFFICE.test(row.notes) && !/Europe|NATO|Kosovo|Bosnia|Ireland|Russia|Ukraine/i.test(row.folder)) {
    score -= 8;
  }
  return score;
}

function priorityFor(score, clusterIds) {
  if (score >= 20 || clusterIds.includes("pc-dc-policy-control")) return "High";
  if (score >= 12) return "Medium";
  return "Review";
}

function countEntries(items, getter) {
  const counts = new Map();
  for (const item of items) {
    const key = getter(item) || "Unassigned";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function countBy(items, getter) {
  return Object.fromEntries(countEntries(items, getter));
}

function topBoxes(leads, clusterId) {
  return countEntries(leads.filter((lead) => lead.clusterIds.includes(clusterId)), (lead) => lead.box)
    .slice(0, 10)
    .map(([box, count]) => ({ box, count }));
}

function buildMarkdown(data) {
  const lines = [
    "# Clinton Library Research Plan",
    "",
    `Generated: ${data.generatedAt}`,
    "",
    `Parsed ${data.summary.rowsParsed} finding-aid rows from ${data.summary.pdfCount} PDF parts and selected ${data.summary.leadCount} Europe-relevant on-site leads.`,
    "",
    "## Pull Strategy",
    "",
    ...data.pullStrategy.map((item) => `- ${item}`),
    "",
    "## Research Clusters",
    ""
  ];

  for (const cluster of data.clusters) {
    lines.push(`### ${cluster.priority}: ${cluster.title}`, "");
    lines.push(cluster.rationale, "");
    lines.push(`Leads: ${cluster.leadCount}. Top boxes/OA IDs: ${cluster.topBoxes.map((box) => `${box.box} (${box.count})`).join(", ")}.`, "");
    lines.push("Representative folders:");
    for (const lead of cluster.representativeLeads) {
      lines.push(`- Box/OA ${lead.box}; ${lead.folder}; ${lead.notes}; Part ${lead.part}, page ${lead.page}.`);
    }
    lines.push("");
  }

  while (lines[lines.length - 1] === "") lines.pop();
  return `${lines.join("\n")}\n`;
}

function main() {
  const pdfs = process.argv.slice(2);
  const pdfPaths = pdfs.length ? pdfs : DEFAULT_PDFS;
  const rows = [];

  pdfPaths.forEach((pdfPath, index) => {
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Missing finding aid PDF: ${pdfPath}`);
    }
    rows.push(...parseRows(extractText(pdfPath), index + 1));
  });

  const leads = rows
    .map((row) => {
      const clusterIds = clustersFor(row);
      const score = scoreRow(row, clusterIds);
      const hasPrimaryCluster = clusterIds.some((id) => PRIMARY_CLUSTER_IDS.has(id));
      const isPublicEuropeContext =
        clusterIds.includes("public-context-speechwriting") && PUBLIC_CONTEXT_TERMS.test(row.folder);
      return {
        id: `clinton-library-2013-0185-m-p${row.part}-${row.page}-${row.line}-${row.box}`,
        release: "2013-0185-M",
        part: row.part,
        page: row.page,
        line: row.line,
        box: row.box,
        folder: row.folder,
        notes: row.notes,
        clusterIds,
        clusterLabels: clusterIds.map((id) => CLUSTERS.find((cluster) => cluster.id === id)?.title).filter(Boolean),
        score,
        priority: priorityFor(score, clusterIds),
        keep: hasPrimaryCluster || isPublicEuropeContext
      };
    })
    .filter((lead) => lead.keep && lead.clusterIds.length && lead.priority !== "Review")
    .sort((a, b) => b.score - a.score || a.box.localeCompare(b.box) || a.folder.localeCompare(b.folder));

  const deduped = [];
  const seen = new Set();
  for (const lead of leads) {
    const key = `${lead.box}::${lead.folder}::${lead.notes}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(lead);
  }

  const clusters = CLUSTERS.map((cluster) => {
    const clusterLeads = deduped.filter((lead) => lead.clusterIds.includes(cluster.id));
    return {
      id: cluster.id,
      title: cluster.title,
      section: cluster.section,
      priority: cluster.priority,
      rationale: cluster.rationale,
      leadCount: clusterLeads.length,
      topBoxes: topBoxes(deduped, cluster.id),
      representativeLeads: clusterLeads.slice(0, 12)
    };
  }).filter((cluster) => cluster.leadCount);

  const data = {
    generatedAt: new Date().toISOString(),
    source: {
      release: "2013-0185-M",
      description: "Clinton Presidential Records, National Security Council finding-aid parts supplied locally.",
      pdfParts: pdfPaths.map((pdfPath, index) => ({
        part: index + 1,
        fileName: path.basename(pdfPath)
      }))
    },
    summary: {
      pdfCount: pdfPaths.length,
      rowsParsed: rows.length,
      leadCount: deduped.length,
      highPriorityLeads: deduped.filter((lead) => lead.priority === "High").length,
      mediumPriorityLeads: deduped.filter((lead) => lead.priority === "Medium").length,
      clusterCount: clusters.length,
      topBoxes: countEntries(deduped, (lead) => lead.box)
        .slice(0, 12)
        .map(([box, count]) => ({ box, count }))
    },
    pullStrategy: [
      "Pull PC/DC, PDD/PRD, and briefing-book folders first; they are most likely to anchor decision chronology.",
      "Batch boxes/OA IDs by cluster before requesting material, especially dense Kosovo/Southeast Europe and European Affairs runs.",
      "Use speechwriting folders after decision files, mainly to compare public language against internal policy framing.",
      "Treat Russia/Ukraine folders as cross-references unless they directly carry NATO, Ukraine, Balkans, or European-security policy."
    ],
    clusters,
    leads: deduped
  };

  fs.writeFileSync(path.join(ROOT, "data/clinton-library-research.json"), `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(
    path.join(ROOT, "data/clinton-library-research.js"),
    `window.CLINTON_EUROPE_LIBRARY_RESEARCH = ${JSON.stringify(data, null, 2)};\n`
  );
  fs.writeFileSync(path.join(ROOT, "reports/clinton-library-research.md"), buildMarkdown(data));
  console.log(`Wrote ${deduped.length} Clinton Library research leads across ${clusters.length} clusters.`);
}

main();
