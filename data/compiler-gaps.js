window.CLINTON_EUROPE_COMPILER_GAPS = {
  "generatedAt": "2026-10-31T00:10:28.784Z",
  "summary": {
    "totalGaps": 9,
    "criticalGaps": 2,
    "highGaps": 5,
    "mediumGaps": 2
  },
  "metrics": {
    "records": {
      "total": 463,
      "bySection": {
        "Balkans": 11,
        "Central Europe": 23,
        "France": 59,
        "Germany": 67,
        "Italy": 8,
        "NATO and EU": 21,
        "Netherlands": 2,
        "Portugal": 1,
        "Russia and FSU Cross-Reference": 137,
        "Spain": 2,
        "United Kingdom": 132
      },
      "byYear": {
        "1993": 43,
        "1994": 45,
        "1995": 50,
        "1996": 39,
        "1997": 60,
        "1998": 93,
        "1999": 92,
        "2000": 39,
        "Undated": 2
      },
      "byVolume": {
        "frus1993-00v22": 463,
        "frus1993-00v23": 177,
        "frus1993-00v24": 286
      },
      "sourceNoteRecords": 463,
      "frusReadySourceNotes": 0,
      "sourceNoteScaffolds": 456,
      "digitalControlRecords": 436,
      "sourceNoteMetadataGaps": 7,
      "missingPdfRecords": 10,
      "crossVolumeRecords": 463
    },
    "publicStatements": {
      "total": 90,
      "byYear": {
        "1993": 11,
        "1994": 14,
        "1995": 12,
        "1996": 5,
        "1997": 11,
        "1998": 14,
        "1999": 12,
        "2000": 11
      },
      "byVolume": {
        "frus1993-00v22": 51,
        "frus1993-00v23": 36,
        "frus1993-00v24": 41
      }
    },
    "potentialDocuments": {
      "total": 1320,
      "bySourceType": {
        "NARA Catalog 7388808": 575,
        "NARA Scout": 210,
        "Policy worksheet — date conflict": 1,
        "Presidential Daily Diary": 326,
        "Strobe Talbott FOIA": 206,
        "Transmittal only — attachment lead": 1,
        "Unofficial translation": 1
      },
      "bySection": {
        "Balkans and Kosovo": 563,
        "Central and Eastern Europe": 87,
        "EU, OSCE, and Summits": 26,
        "France": 1,
        "Germany": 1,
        "NATO and EU": 1,
        "NATO and European Security": 98,
        "Russia Cross-Reference": 184,
        "Western Europe Bilateral": 359
      },
      "byYear": {
        "1993": 57,
        "1994": 47,
        "1995": 84,
        "1996": 99,
        "1997": 116,
        "1998": 197,
        "1999": 391,
        "2000": 114,
        "Undated": 215
      },
      "byPriority": {
        "High": 174,
        "Medium": 1146
      },
      "byVolume": {
        "frus1993-00v22": 1024,
        "frus1993-00v23": 791,
        "frus1993-00v24": 919
      },
      "undatedPotentialDocuments": 215,
      "highPriorityPotentialDocuments": 174,
      "mediumPriorityPotentialDocuments": 1146
    }
  },
  "gaps": [
    {
      "id": "source-note-reconciliation",
      "severity": "Critical",
      "area": "Source Integrity",
      "title": "Source-note provenance still needs archival verification",
      "compilerRisk": "The memcon and telcon rows now carry URL-free FRUS provenance scaffolds, but Digital Library release/item identifiers are only public provenance controls. A record should not become a final FRUS citation until the PDF cover sheet and finding aid confirm the exact archival path plus original classification, distribution, drafting, and approval data.",
      "evidence": [
        "0 of 463 Clinton Library candidate records have complete published-style source notes ready for compiler review.",
        "456 records have FRUS provenance scaffolds that still need archival verification.",
        "436 records preserve Digital Library release/item IDs as provenance controls rather than final archival paths.",
        "7 records still need core source-note metadata such as a release identifier.",
        "463 of 463 Clinton Library candidate records carry the source-note review queue.",
        "10 Clinton Library candidate records do not have direct PDF links yet.",
        "463 records are also marked for cross-volume placement review."
      ],
      "nextSteps": [
        "Open the PDF cover sheets and finding-aid targets for high-level contacts first and normalize the archival citation path.",
        "Resolve the missing-PDF queue before selecting any document as a documentary-text candidate.",
        "Record final source-note decisions back into the candidate record layer, not just the narrative report."
      ],
      "relatedFilters": [
        {
          "label": "Source-note queue",
          "target": "records",
          "queue": "source-note"
        },
        {
          "label": "Missing PDFs",
          "target": "records",
          "queue": "pdf-missing"
        }
      ]
    },
    {
      "id": "undated-source-leads",
      "severity": "Critical",
      "area": "Chronology Control",
      "title": "Potential source leads include a large undated block",
      "compilerRisk": "The FRUS volumes are chronological. Undated NARA and FOIA leads can distort volume placement, especially for Bosnia/Kosovo records that may fall on either side of the 1996/1997 volume boundary.",
      "evidence": [
        "215 of 1320 potential source leads have no normalized year.",
        "172 undated leads are in Balkans and Kosovo.",
        "1146 potential leads are medium priority, so date normalization is needed before down-selecting."
      ],
      "nextSteps": [
        "Extract dates from folder titles, digital-object filenames, cover sheets, and Strobe FOIA manifest fields.",
        "Split undated Kosovo/Bosnia leads between Volume XXIII and XXIV before drafting a chronology.",
        "Promote any dated folder-level lead with a direct digital object and head-of-state relevance to high-priority review."
      ],
      "relatedFilters": [
        {
          "label": "Potential documents",
          "target": "documents",
          "search": "Date pending"
        },
        {
          "label": "Balkans leads",
          "target": "documents",
          "search": "Balkans and Kosovo"
        }
      ]
    },
    {
      "id": "volume-boundary-overlap",
      "severity": "High",
      "area": "Volume Placement",
      "title": "High-level contacts overlap both policy volumes",
      "compilerRisk": "Volume XXII captures high-level contacts across the whole administration, while Volumes XXIII and XXIV divide policy by date. The current data correctly flags overlap, but the compiler still has to decide which high-level contacts become source texts and which remain cross-references.",
      "evidence": [
        "463 records map to Volume XXII.",
        "177 records map to Volume XXIII and 286 map to Volume XXIV.",
        "1024 potential source leads also touch Volume XXII, with 791 touching XXIII and 919 touching XXIV."
      ],
      "nextSteps": [
        "Create a keeper list for head-of-state/head-of-government contacts that deserve full-text treatment in XXII.",
        "For each keeper, note whether the same document also carries the policy story for XXIII or XXIV.",
        "Use public statements only as context anchors unless they directly explain a documentary omission."
      ],
      "relatedFilters": [
        {
          "label": "Volume XXII records",
          "target": "records",
          "volumeId": "frus1993-00v22"
        },
        {
          "label": "Volume XXIV documents",
          "target": "documents",
          "volumeId": "frus1993-00v24"
        }
      ]
    },
    {
      "id": "balkans-kosovo-imbalance",
      "severity": "High",
      "area": "Balkans and Kosovo",
      "title": "Balkans/Kosovo leads are abundant but uneven by year and source type",
      "compilerRisk": "The source base is large for 1999 Kosovo but thin in the Clinton Library memcon/telcon corpus and uneven around Dayton implementation. A compiler relying only on the high-volume lead list may over-weight 1999 and under-build the 1996-1997 bridge.",
      "evidence": [
        "563 potential leads are tagged Balkans and Kosovo.",
        "Only 11 Clinton Library candidate records are in the Balkans section.",
        "Balkans and Kosovo potential leads include 253 in 1999, 0 in 1997, and 22 in 1996."
      ],
      "nextSteps": [
        "Separate Bosnia/Dayton, Kosovo, and regional NATO-use-of-force documents before selection.",
        "Look for Principals Committee, Deputies Committee, and NSC memo traffic to bridge the 1996-1997 gap.",
        "Treat 1999 Kosovo leads as a sub-series rather than allowing them to dominate the entire Balkans chapter."
      ],
      "relatedFilters": [
        {
          "label": "Balkans record queue",
          "target": "records",
          "search": "Balkans"
        },
        {
          "label": "Kosovo leads",
          "target": "documents",
          "search": "Kosovo"
        }
      ]
    },
    {
      "id": "nato-eu-early-years",
      "severity": "High",
      "area": "NATO and EU",
      "title": "Early NATO/EU policy coverage is thin in direct candidate records",
      "compilerRisk": "The 1993-1996 policy volume needs NATO enlargement, Partnership for Peace, EU/transatlantic, OSCE, and summit-policy material. The current direct record layer is sparse before 1995 and does not yet supply a strong institutional policy spine.",
      "evidence": [
        "The NATO and EU Clinton Library section has 0 records in 1993 and 0 in 1994.",
        "NATO and European Security potential leads have 1 lead in 1995 and 8 in 1996.",
        "EU, OSCE, and Summits has only 26 potential leads across the whole administration."
      ],
      "nextSteps": [
        "Run targeted NARA Scout searches for Partnership for Peace, NATO enlargement, Madrid summit, OSCE, EU, and transatlantic agenda terms.",
        "Prioritize NSC decision memoranda, briefing books, PDD/PRD material, and summit books over public-statement duplicates.",
        "Add explicit EU/OSCE/summit section assignments to any newly found records so they do not disappear into regional buckets."
      ],
      "relatedFilters": [
        {
          "label": "NATO/EU records",
          "target": "records",
          "search": "NATO"
        },
        {
          "label": "EU/OSCE leads",
          "target": "documents",
          "search": "EU OSCE Summits"
        }
      ]
    },
    {
      "id": "western-europe-country-holes",
      "severity": "High",
      "area": "Western Europe Bilateral",
      "title": "Western Europe country coverage is concentrated in a few relationships",
      "compilerRisk": "The record layer is strong for the United Kingdom, France, Germany, and Northern Ireland, but it does not yet demonstrate adequate bilateral coverage for several Western European partners that may matter for NATO, EU, Balkans, and summit diplomacy.",
      "evidence": [
        "Clinton Library records by section: United Kingdom 132, Germany 67, France 59, Italy 8.",
        "Search hits in records: Spain 3, Netherlands 2, Belgium 4, Portugal 1.",
        "Northern Ireland is visible with 12 records, 234 potential leads, and 14 public statements."
      ],
      "nextSteps": [
        "Run country-specific searches for Spain, Portugal, Netherlands, Belgium, Nordics, Austria, Greece, and Turkey where they intersect NATO/EU/Balkans policy.",
        "Keep Northern Ireland as a distinct bilateral/UK-Ireland cluster rather than burying it under generic UK records.",
        "Audit Italy and Spain around Balkans, NATO, and G7/summit diplomacy before final country balance decisions."
      ],
      "relatedFilters": [
        {
          "label": "Western Europe leads",
          "target": "documents",
          "search": "Western Europe Bilateral"
        },
        {
          "label": "Northern Ireland leads",
          "target": "documents",
          "search": "Northern Ireland"
        }
      ]
    },
    {
      "id": "central-eastern-europe-accession",
      "severity": "Medium",
      "area": "Central and Eastern Europe",
      "title": "Central/Eastern Europe needs accession-era document depth",
      "compilerRisk": "Poland, Czech, Hungary, Romania, Baltic, and Ukraine-related leads are present, but the source mix is uneven. The accession story needs policy documents, not only leader-call records or Strobe FOIA hits.",
      "evidence": [
        "Central Europe Clinton Library records total 23; the section has 0 in 1997 and 0 in 2000.",
        "Central and Eastern Europe potential leads total 87, with 1 from the NARA 7388808 catalog sweep.",
        "Search hits across current data: Poland 6 records/104 leads; Czech 9 records/8 leads; Hungary 8 records/4 leads; Romania 0 records/116 leads."
      ],
      "nextSteps": [
        "Search for NATO accession packages, Senate ratification, Madrid summit, and bilateral accession consultations.",
        "Use Strobe FOIA as a discovery layer, then confirm whether corresponding NSC/RMO documents exist with better provenance.",
        "Separate Ukraine/Russia cross-reference material from Central Europe accession material before chapter drafting."
      ],
      "relatedFilters": [
        {
          "label": "Central Europe records",
          "target": "records",
          "search": "Central Europe"
        },
        {
          "label": "Poland accession leads",
          "target": "documents",
          "search": "Poland NATO"
        }
      ]
    },
    {
      "id": "russia-cross-reference-scope",
      "severity": "Medium",
      "area": "Russia Cross-Reference",
      "title": "Russia/FSU cross-references may swamp Europe volume boundaries",
      "compilerRisk": "Russia and FSU records are relevant to NATO, Ukraine, Balkans, and European security, but they should not become a backdoor Russia volume. The compiler needs a clear inclusion rule for Europe-facing Russia material.",
      "evidence": [
        "137 Clinton Library records are in the Russia and FSU cross-reference section.",
        "184 potential source leads are in Russia Cross-Reference, including 38 high-priority leads.",
        "Ukraine appears in 15 Clinton Library records and 140 potential leads."
      ],
      "nextSteps": [
        "Define an inclusion test: use Russia/FSU documents only when they directly carry NATO, Ukraine, Balkans/Kosovo, or European-security policy.",
        "Flag purely bilateral U.S.-Russia material for cross-reference rather than full inclusion.",
        "Coordinate any Russia/FSU document selections with the relevant FRUS Russia/FSU volume boundaries."
      ],
      "relatedFilters": [
        {
          "label": "Russia/FSU records",
          "target": "records",
          "queue": "russia-fsu-review"
        },
        {
          "label": "Ukraine leads",
          "target": "documents",
          "search": "Ukraine"
        }
      ]
    },
    {
      "id": "oct2026-copy-and-date-verification",
      "severity": "High",
      "area": "October 30 release",
      "title": "Reconcile source copies and unresolved contact dates",
      "compilerRisk": "Extracted text is a documentary lead, not a facsimile-verified source note. Two contacts have conflicting day dates; a cover, unofficial translation and policy worksheet must not become additional meetings.",
      "evidence": [
        "27 substantive presidential/ministerial contacts reviewed at the cited physical page spans; 3 related source leads remain distinct.",
        "Dini February 16/17, 1997 and Cook October 6/7, 1998 remain undated in the core chronology.",
        "NATO–Russia Understanding: body January 27, 1997; catalog June 4, 2018.",
        "Kohl January 13 transmittal contains no dialogue; French original and unofficial English translation are separate source objects."
      ],
      "nextSteps": [
        "Compare original facsimiles and archival copies, verify source-note classification/distribution/drafting, and retrieve referenced attachments.",
        "Resolve disputed dates against schedules without overwriting the preserved catalog dates.",
        "Decide full text, extract, cross-reference or omission at the compiler selection control."
      ],
      "relatedFilters": [
        {
          "label": "October 30 chronology",
          "target": "records",
          "search": "October 30 release"
        },
        {
          "label": "Related source leads",
          "target": "documents",
          "search": "October 30 release"
        }
      ]
    }
  ]
};
