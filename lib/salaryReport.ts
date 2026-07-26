/**
 * Generates the teacher-salary PDF report and downloads it directly — no
 * print dialog.
 *
 * Amharic (Ethiopic) text needs an embedded font: jsPDF's built-in fonts only
 * cover Latin. A subset of Noto Sans Ethiopic lives in /public/fonts and is
 * fetched lazily the first time a report is generated.
 */

import type { jsPDF } from "jspdf";

export type SalaryReportStatus = "pending" | "approved" | "rejected" | string;

export type SalaryReportRow = {
  teacherName: string;
  /** Blank in the report when the teacher has no bank account on file. */
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  monthLabel: string;
  year: number;
  amount: number;
  status: SalaryReportStatus;
};

export type SalaryReportOptions = {
  /** Amharic UI? Drives every label in the report. */
  isAm: boolean;
  /** Human readable period, e.g. "ሐምሌ 2018" or "All periods". */
  periodLabel: string;
  /** Slug used for the PDF file name, e.g. "2018-07". */
  fileLabel: string;
  rows: SalaryReportRow[];
  formatCurrency: (amount: number) => string;
};

type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

const FONT_FAMILY = "NotoEthiopic";
const FONT_FILES = {
  normal: "/fonts/NotoSansEthiopic-Regular.ttf",
  bold: "/fonts/NotoSansEthiopic-Bold.ttf",
};
const LOGO_URL = "/al-anis.jpg";

/** Brand colours, as jsPDF RGB triples. */
const TEAL: [number, number, number] = [15, 118, 110];
const INK: [number, number, number] = [22, 33, 28];
const MUTED: [number, number, number] = [107, 122, 116];
const LINE: [number, number, number] = [206, 216, 211];
const ZEBRA: [number, number, number] = [246, 250, 249];
const GREEN: [number, number, number] = [22, 101, 52];
const AMBER: [number, number, number] = [146, 64, 14];
const RED: [number, number, number] = [153, 27, 27];

// Fetched once per page load and reused for later downloads.
let fontCache: { normal: string; bold: string } | null = null;
let logoCache: string | null | undefined;

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...Array.from(bytes.subarray(i, i + chunkSize)),
    );
  }

  return btoa(binary);
};

const fetchAsBase64 = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return arrayBufferToBase64(await response.arrayBuffer());
};

/** Registers the Ethiopic font; falls back to Helvetica if it can't load. */
const registerFonts = async (doc: jsPDF) => {
  try {
    if (!fontCache) {
      const [normal, bold] = await Promise.all([
        fetchAsBase64(FONT_FILES.normal),
        fetchAsBase64(FONT_FILES.bold),
      ]);
      fontCache = { normal, bold };
    }

    doc.addFileToVFS("NotoSansEthiopic-Regular.ttf", fontCache.normal);
    doc.addFont("NotoSansEthiopic-Regular.ttf", FONT_FAMILY, "normal");
    doc.addFileToVFS("NotoSansEthiopic-Bold.ttf", fontCache.bold);
    doc.addFont("NotoSansEthiopic-Bold.ttf", FONT_FAMILY, "bold");

    return FONT_FAMILY;
  } catch (error) {
    console.error("Ethiopic font unavailable, falling back to Helvetica", error);
    return "helvetica";
  }
};

const loadLogo = async () => {
  if (logoCache !== undefined) return logoCache;

  try {
    logoCache = `data:image/jpeg;base64,${await fetchAsBase64(LOGO_URL)}`;
  } catch {
    logoCache = null;
  }

  return logoCache;
};

const statusLabel = (status: SalaryReportStatus, isAm: boolean) => {
  switch (status) {
    case "approved":
      return isAm ? "ጸድቋል" : "Approved";
    case "rejected":
      return isAm ? "ውድቅ ተደርጓል" : "Rejected";
    default:
      return isAm ? "በመጠባበቅ ላይ" : "Pending";
  }
};

const statusColor = (status: SalaryReportStatus): [number, number, number] => {
  switch (status) {
    case "approved":
      return GREEN;
    case "rejected":
      return RED;
    default:
      return AMBER;
  }
};

/**
 * Builds the report and triggers the browser download.
 * Resolves once the file has been handed to the browser.
 */
export async function downloadSalaryReport({
  isAm,
  periodLabel,
  fileLabel,
  rows,
  formatCurrency,
}: SalaryReportOptions) {
  const t = (am: string, en: string) => (isAm ? am : en);

  const [{ jsPDF: JsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new JsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as JsPdfWithAutoTable;

  const font = await registerFonts(doc);
  const logo = await loadLogo();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const right = pageWidth - margin;
  const headerBottom = 32;

  const total = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const generatedAt = new Date().toLocaleString(isAm ? "am-ET" : "en-US");
  const reportTitle = t("የመምህራን ደሞዝ ሪፖርት", "Teacher Salary Report");

  // When every row covers the same month/year — the usual case, since reports
  // are generated per month — the period is stated once in the header and the
  // repeated Month/Year columns are dropped.
  const singlePeriod =
    rows.length > 0 &&
    rows.every(
      (row) =>
        row.monthLabel === rows[0].monthLabel && row.year === rows[0].year,
    );
  const headerPeriod = singlePeriod
    ? `${rows[0].monthLabel} ${rows[0].year}`
    : periodLabel;

  doc.setProperties({
    title: reportTitle,
    subject: `${reportTitle} — ${headerPeriod}`,
    author: "Al Anis",
    creator: "Al Anis",
  });

  /** Drawn on every page so multi-page reports stay identifiable. */
  const drawHeader = () => {
    if (logo) {
      try {
        doc.addImage(logo, "JPEG", margin, 10, 16, 16);
      } catch {
        // a broken logo must never block the report
      }
    }

    const textX = logo ? margin + 21 : margin;

    doc.setFont(font, "bold");
    doc.setFontSize(15);
    doc.setTextColor(...INK);
    doc.text("Al Anis", textX, 17);

    doc.setFont(font, "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEAL);
    doc.text(reportTitle, textX, 23.5);

    doc.setFont(font, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(t("የሪፖርቱ ወቅት", "Report period"), right, 13, { align: "right" });

    doc.setFont(font, "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(headerPeriod, right, 18.5, { align: "right" });

    doc.setFont(font, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      `${t("የተዘጋጀበት", "Generated")}: ${generatedAt}`,
      right,
      23.5,
      { align: "right" },
    );

    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.6);
    doc.line(margin, headerBottom - 4, right, headerBottom - 4);
  };

  // Bank name above the account number; left blank when neither is on file.
  const bankAccountCell = (row: SalaryReportRow) =>
    [row.bankAccountName?.trim(), row.bankAccountNumber?.trim()]
      .filter(Boolean)
      .join("\n");

  const body = rows.map((row, index) => [
    String(index + 1),
    row.teacherName,
    bankAccountCell(row),
    ...(singlePeriod ? [] : [row.monthLabel, String(row.year)]),
    formatCurrency(Number(row.amount) || 0),
    statusLabel(row.status, isAm),
  ]);

  // Column indexes shift when the Month/Year pair is dropped.
  const amountIndex = singlePeriod ? 3 : 5;
  const statusIndex = amountIndex + 1;

  autoTable(doc, {
    startY: headerBottom + 3,
    margin: { top: headerBottom + 3, right: margin, bottom: 18, left: margin },
    theme: "grid",
    head: [
      [
        "#",
        t("የመምህር ስም", "Teacher name"),
        t("የባንክ ሂሳብ", "Bank account"),
        ...(singlePeriod ? [] : [t("ወር", "Month"), t("ዓመት", "Year")]),
        t("ጠቅላላ መጠን", "Total amount"),
        t("ሁኔታ", "Status"),
      ],
    ],
    body,
    // Only the final page carries the grand total, so a page break can't be
    // mistaken for a subtotal.
    showFoot: "lastPage",
    foot: [
      [
        {
          content: `${t("ጠቅላላ ድምር", "Grand total")} — ${rows.length.toLocaleString()} ${t(
            "መዝገቦች",
            "records",
          )}`,
          colSpan: amountIndex,
        },
        formatCurrency(total),
        "",
      ],
    ],
    styles: {
      font,
      fontStyle: "normal",
      fontSize: 8.5,
      cellPadding: { top: 2.2, right: 2, bottom: 2.2, left: 2 },
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.15,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      font,
      fontStyle: "bold",
      fontSize: 8.5,
      fillColor: TEAL,
      textColor: [255, 255, 255],
      lineColor: TEAL,
      halign: "left",
    },
    footStyles: {
      font,
      fontStyle: "bold",
      fontSize: 9.5,
      fillColor: [238, 244, 242],
      textColor: INK,
      lineColor: LINE,
    },
    alternateRowStyles: { fillColor: ZEBRA },
    columnStyles: singlePeriod
      ? {
          0: { cellWidth: 10, halign: "center", textColor: MUTED },
          1: { cellWidth: 56, fontStyle: "bold" },
          2: { cellWidth: 56 },
          3: { cellWidth: 36, halign: "right", fontStyle: "bold" },
          4: { cellWidth: 28, halign: "center", fontStyle: "bold" },
        }
      : {
          0: { cellWidth: 8, halign: "center", textColor: MUTED },
          1: { cellWidth: 43, fontStyle: "bold" },
          2: { cellWidth: 45 },
          3: { cellWidth: 20 },
          4: { cellWidth: 13, halign: "center" },
          5: { cellWidth: 30, halign: "right", fontStyle: "bold" },
          6: { cellWidth: 27, halign: "center", fontStyle: "bold" },
        },
    // Colour the status column per row, and keep the total right-aligned.
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === statusIndex) {
        data.cell.styles.textColor = statusColor(
          rows[data.row.index]?.status ?? "pending",
        );
      }
      if (data.section === "foot" && data.column.index === amountIndex) {
        data.cell.styles.halign = "right";
      }
    },
    didDrawPage: drawHeader,
  });

  // Signature block — placed after the table, on a new page if it won't fit.
  let cursorY = (doc.lastAutoTable?.finalY ?? headerBottom) + 18;
  if (cursorY + 22 > pageHeight - 18) {
    doc.addPage();
    drawHeader();
    cursorY = headerBottom + 18;
  }

  const columnWidth = (right - margin - 20) / 2;
  const signatures: Array<[string, number]> = [
    [t("ያዘጋጀው", "Prepared by"), margin],
    [t("ያጸደቀው", "Approved by"), margin + columnWidth + 20],
  ];

  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  signatures.forEach(([label, x]) => {
    doc.line(x, cursorY, x + columnWidth, cursorY);
    doc.setFont(font, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(label, x, cursorY + 4.5);
  });

  // Page footer, stamped last so the page count is final.
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 12, right, pageHeight - 12);

    doc.setFont(font, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      t(
        "ይህ ሪፖርት ከአል-አኒስ ስርዓት በራስ-ሰር የተዘጋጀ ነው።",
        "Generated automatically by the Al Anis system.",
      ),
      margin,
      pageHeight - 8,
    );
    doc.text(
      `${t("ገጽ", "Page")} ${page} / ${pageCount}`,
      right,
      pageHeight - 8,
      { align: "right" },
    );
  }

  doc.save(`teacher-salary-report-${fileLabel}.pdf`);
}
