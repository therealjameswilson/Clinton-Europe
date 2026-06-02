# FRUS 1993-2000 Europe Assister

A GitHub Pages research assister for three Clinton-era FRUS Europe volumes:

1. Volume XXII, *Europe: High-Level Contacts*
2. Volume XXIII, *Europe: Policy, 1993-1996*
3. Volume XXIV, *Europe: Policy, 1997-2000*

The site is modeled on the Bush 41 Western Europe assister. It gives a compiler-facing
desk for Clinton Digital Library memcons and telcons: candidate record review,
volume placement, source-note reconciliation, PDF availability, country/section
assignment, declassification queues, and a first-pass triage layer that links
the compiler directly into the next source-note, volume-placement, PDD, NARA,
Strobe, public-statement, and Clinton Library pull tasks. The filtered
chronology, public statements, potential source leads, and Clinton Library pull
list can also be exported as CSV for spreadsheet review or reading-room
planning. A compiler action queue now turns the datasets into concrete work
packets with expected outputs and direct jumps into the relevant filtered
records. Record rows include source-note verification panels for release ID,
PDF, archival-folder, and classification/drafting checks, with copy buttons for
candidate notes and provenance text. The chronology also works as a local
selection worksheet: compiler decisions are saved in the browser, can be
filtered, and export as a CSV keeper/cross-reference/omit list. A dedicated
Presidential Daily Diary worksheet compares diary calls and meetings to
same-day chronology records and public statements, saves reconciliation
statuses in the browser, and exports the PDD log as CSV. Year filters on the
chronology, public statements, and source-lead pool support quick work across
the XXIII/XXIV policy-volume date split, while the coverage matrix exposes
year/volume imbalances and jumps directly into the matching filtered working
set.

## Data

Static volume anchors live in `data/volumes.js`. Candidate records live in
`data/records.json`, with a generated `data/records.js` mirror so `index.html`
can render directly from GitHub Pages or from the filesystem. Key public
statements by President Clinton live in `data/public-statements.json`, mirrored
to `data/public-statements.js` for the same static-page workflow. Broader
potential source leads live in `data/potential-documents.json`, mirrored to
`data/potential-documents.js`. Compiler-risk gaps live in
`data/compiler-gaps.json`, mirrored to `data/compiler-gaps.js`. Clinton Library
finding-aid pull priorities live in `data/clinton-library-research.json`,
mirrored to `data/clinton-library-research.js`.

Records are harvested from:

- Clinton Digital Library Memcons collection: <https://clinton.presidentiallibraries.us/collections/show/255>
- Clinton Digital Library Telcons collection: <https://clinton.presidentiallibraries.us/collections/show/256>

The harvester uses public HTML pages instead of the Omeka JSON output, because
the JSON route can be blocked by the site protection layer.

Public statements are harvested from GovInfo Public Papers:

- GovInfo Public Papers, William J. Clinton: <https://www.govinfo.gov/app/collection/ppp/president-42_Clinton,%20William%20J.>

## Refresh the Dataset

```bash
node scripts/harvest-clinton-digital-library.js
```

The script writes:

- `data/records.json`
- `data/records.js`
- `reports/clinton-digital-library-harvest.json`

Every harvested item is treated as a preliminary source-note record. Use the PDF
cover sheet and item provenance to reconcile each row into a final FRUS-style
source note before using the record in a documentary chronology.

To normalize the public source-note field to the FRUS-style archival-chain
pattern while preserving item/PDF URLs in provenance notes:

```bash
node scripts/normalize-source-notes.js
```

That command writes:

- `data/records.json`
- `data/records.js`
- `reports/source-note-style-audit.json`
- `reports/source-note-style-audit.md`

To refresh the public-statement layer:

```bash
node scripts/harvest-clinton-public-statements.js
```

That command scans Clinton Public Papers book context pages on GovInfo, filters
for Europe, NATO, Balkans, Northern Ireland, and transatlantic policy terms, and
writes:

- `data/public-statements.json`
- `data/public-statements.js`
- `reports/clinton-public-statements.json`
- `reports/clinton-public-statements.md`

To rebuild the public potential-document layer after refreshing the NARA,
Presidential Daily Diary, and Strobe reports:

```bash
node scripts/build-potential-documents.js
```

That command dedupes high and medium priority leads from:

- `reports/nara-scout-candidates.json`
- `reports/nara-collection-7388808-candidates.json`
- `reports/presidential-daily-diary-candidates.json`
- `reports/strobe-talbott-candidates.json`
- `reports/strobe-talbott-local-candidates.json`

It writes:

- `data/potential-documents.json`
- `data/potential-documents.js`
- `reports/potential-documents.json`
- `reports/potential-documents.md`

To rebuild the compiler-risk gap layer after refreshing the source datasets:

```bash
node scripts/build-compiler-gaps.js
```

That command writes:

- `data/compiler-gaps.json`
- `data/compiler-gaps.js`
- `reports/compiler-gaps.md`

To rebuild the Clinton Library visit-planning layer from the local
`2013-0185-M_Part1.pdf` through `2013-0185-M_Part4.pdf` finding aids:

```bash
node scripts/build-clinton-library-research.js
```

The default PDF paths are the local iCloud Drive copies. You can pass alternate
PDF paths as positional arguments. The command writes:

- `data/clinton-library-research.json`
- `data/clinton-library-research.js`
- `reports/clinton-library-research.md`

## Strobe Talbott FOIA Candidates

Run a Strobe Talbott FOIA triage pass when looking for related Europe, NATO, and
Balkans material:

```bash
node scripts/find-strobe-candidates.js
```

That command reads the published Strobe Talbott FOIA manifest and writes
`reports/strobe-talbott-candidates.json` plus
`reports/strobe-talbott-candidates.md`.

To scan a local expanded Strobe checkout instead:

```bash
node scripts/find-strobe-candidates.js \
  "/Users/jameswilson/Documents/New project/strobe-talbott-foia/data/manifest.json" \
  --prefix=strobe-talbott-local-candidates
```

## NARA Catalog and Scout Candidates

Run a NARA Scout-style pass across the main Clinton NSC Europe-facing scopes:

```bash
node scripts/find-nara-scout-candidates.js --limit=50
```

That command writes `reports/nara-scout-candidates.json` and
`reports/nara-scout-candidates.md`.

To reproduce the broader NARA Catalog search rooted at the Clinton NSC Records
Management Office collection, including every descendant record under NAID
7388808 plus the scoped online textual `Europe` comparison search:

```bash
node scripts/find-nara-collection-candidates.js --all-limit=6000 --limit=1000
```

That command writes `reports/nara-collection-7388808-candidates.json` and
`reports/nara-collection-7388808-candidates.md`.

To search the Presidential Daily Diary collection for Europe-facing calls and
meetings:

```bash
node scripts/find-presidential-daily-diary-candidates.js
```

That command scans the Clinton Digital Library mirror of the Ellen McCathran
Presidential Daily Diary collection, extracts the original PDFs with
`pdftotext`, and writes `reports/presidential-daily-diary-candidates.json` plus
`reports/presidential-daily-diary-candidates.md`. The report preserves the
NARA Catalog identifiers listed on the item pages, including the requested
`2010-0083-F` diary sample set.

## Local Preview

This is a static site. You can open `index.html` directly, or run a local server:

```bash
python3 -m http.server 4182
```

Then open <http://127.0.0.1:4182/>.

## Official FRUS Anchors

- Volume XXII: <https://history.state.gov/historicaldocuments/frus1993-00v22>
- Volume XXIII: <https://history.state.gov/historicaldocuments/frus1993-00v23>
- Volume XXIV: <https://history.state.gov/historicaldocuments/frus1993-00v24>

## Publish

This repository includes a GitHub Pages workflow at
`.github/workflows/deploy-pages.yml`. After pushing to `main`, set the repository
Pages source to GitHub Actions if it is not already selected. The repository
also includes `.nojekyll` so the static data and report assets are served
without Jekyll processing.
