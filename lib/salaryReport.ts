/**
 * Generates the teacher-salary PDF report and downloads it directly — no
 * print dialog.
 *
 * The report is column driven: the caller passes the column keys it wants, in
 * the order it wants them, and the layout (widths, orientation, font size,
 * totals row) is derived from that selection so any combination still fills
 * the page cleanly.
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
  phone?: string | null;
  monthLabel: string;
  year: number;
  /** Days that counted towards the payout. */
  learningDays?: number;
  /** Per-day rate used to compute the base amount. */
  unitPrice?: number;
  /** Extra amount granted on top of the day-rate total. */
  bonus?: number;
  /** Learning days × unit price, i.e. the total without the bonus. */
  baseAmount?: number;
  /** Bonus included — this is what gets paid. */
  amount: number;
  status: SalaryReportStatus;
};

export type SalaryReportColumnKey =
  | "index"
  | "teacherName"
  | "phone"
  | "bankAccount"
  | "bankAccountName"
  | "bankAccountNumber"
  | "month"
  | "year"
  | "learningDays"
  | "unitPrice"
  | "baseAmount"
  | "bonus"
  | "amount"
  | "status";

export type SalaryReportOrientation = "auto" | "portrait" | "landscape";

export type SalaryReportOptions = {
  /** Amharic UI? Drives every label in the report. */
  isAm: boolean;
  /** Human readable period, e.g. "ሐምሌ 2018" or "All periods". */
  periodLabel: string;
  /** Slug used for the PDF file name, e.g. "2018-07". */
  fileLabel: string;
  rows: SalaryReportRow[];
  formatCurrency: (amount: number) => string;
  /** Columns to print, in order. Defaults to {@link DEFAULT_SALARY_REPORT_COLUMNS}. */
  columns?: SalaryReportColumnKey[];
  /** "auto" picks landscape only when the columns don't fit portrait. */
  orientation?: SalaryReportOrientation;
  /** Print the grand-total row. Defaults to true. */
  includeTotals?: boolean;
  /** Print the "Prepared by / Approved by" block. Defaults to true. */
  includeSignatures?: boolean;
};

type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

type HorizontalAlign = "left" | "center" | "right";

type ColumnContext = {
  isAm: boolean;
  formatCurrency: (amount: number) => string;
};

export type SalaryReportColumn = {
  key: SalaryReportColumnKey;
  labelAm: string;
  labelEn: string;
  /** Short description shown in the picker UI, not in the PDF. */
  hintAm?: string;
  hintEn?: string;
  /** Smallest width, in mm, that keeps the column readable. */
  minWidth: number;
  /** Share of the leftover page width this column gets. */
  weight: number;
  halign: HorizontalAlign;
  bold?: boolean;
  muted?: boolean;
  value: (row: SalaryReportRow, index: number, ctx: ColumnContext) => string;
  /** Set for columns that carry a grand total. */
  total?: (rows: SalaryReportRow[], ctx: ColumnContext) => string;
};

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

const numberOf = (value: unknown) => Number(value) || 0;

const rowBonus = (row: SalaryReportRow) => numberOf(row.bonus);

const rowBase = (row: SalaryReportRow) =>
  row.baseAmount !== undefined && row.baseAmount !== null
    ? numberOf(row.baseAmount)
    : numberOf(row.amount) - rowBonus(row);

const sumBy = (
  rows: SalaryReportRow[],
  pick: (row: SalaryReportRow) => number,
) => rows.reduce((sum, row) => sum + pick(row), 0);

/**
 * Every column the report knows how to print, in the order they appear when a
 * caller asks for "all columns". The picker UI is built from this list too, so
 * adding a column here is enough to expose it everywhere.
 */
export const SALARY_REPORT_COLUMNS: SalaryReportColumn[] = [
  {
    key: "index",
    labelAm: "ተ.ቁ",
    labelEn: "#",
    hintAm: "የረድፍ ቁጥር",
    hintEn: "Row number",
    minWidth: 8,
    weight: 0.2,
    halign: "center",
    muted: true,
    value: (_row, index) => String(index + 1),
  },
  {
    key: "teacherName",
    labelAm: "የመምህር ስም",
    labelEn: "Teacher name",
    hintAm: "ሙሉ ስም",
    hintEn: "Full name",
    minWidth: 30,
    weight: 2.4,
    halign: "left",
    bold: true,
    value: (row) => row.teacherName,
  },
  {
    key: "phone",
    labelAm: "ስልክ",
    labelEn: "Phone",
    hintAm: "የመምህሩ ስልክ ቁጥር",
    hintEn: "Teacher phone number",
    minWidth: 22,
    weight: 1.2,
    halign: "left",
    value: (row) => row.phone?.trim() ?? "",
  },
  {
    key: "bankAccount",
    labelAm: "የባንክ ሂሳብ",
    labelEn: "Bank account",
    hintAm: "የባንክ ስም እና ቁጥር በአንድ አምድ",
    hintEn: "Bank name and number in one column",
    minWidth: 34,
    weight: 2.2,
    halign: "left",
    value: (row) =>
      [row.bankAccountName?.trim(), row.bankAccountNumber?.trim()]
        .filter(Boolean)
        .join("\n"),
  },
  {
    key: "bankAccountName",
    labelAm: "የባንክ ስም",
    labelEn: "Bank name",
    hintAm: "የሂሳቡ ባለቤት/ባንክ ስም",
    hintEn: "Bank / account holder name",
    minWidth: 24,
    weight: 1.6,
    halign: "left",
    value: (row) => row.bankAccountName?.trim() ?? "",
  },
  {
    key: "bankAccountNumber",
    labelAm: "የሂሳብ ቁጥር",
    labelEn: "Account number",
    hintAm: "የባንክ ሂሳብ ቁጥር",
    hintEn: "Bank account number",
    minWidth: 26,
    weight: 1.6,
    halign: "left",
    value: (row) => row.bankAccountNumber?.trim() ?? "",
  },
  {
    key: "month",
    labelAm: "ወር",
    labelEn: "Month",
    hintAm: "የደሞዙ ወር",
    hintEn: "Salary month",
    minWidth: 16,
    weight: 0.9,
    halign: "left",
    value: (row) => row.monthLabel,
  },
  {
    key: "year",
    labelAm: "ዓመት",
    labelEn: "Year",
    hintAm: "የደሞዙ ዓመት",
    hintEn: "Salary year",
    minWidth: 12,
    weight: 0.5,
    halign: "center",
    value: (row) => String(row.year),
  },
  {
    key: "learningDays",
    labelAm: "የመማሪያ ቀናት",
    labelEn: "Learning days",
    hintAm: "ለክፍያ የተቆጠሩ ቀናት",
    hintEn: "Days counted for payment",
    minWidth: 16,
    weight: 0.9,
    halign: "right",
    value: (row) => numberOf(row.learningDays).toLocaleString(),
    total: (rows) =>
      sumBy(rows, (row) => numberOf(row.learningDays)).toLocaleString(),
  },
  {
    key: "unitPrice",
    labelAm: "የአሃድ ዋጋ",
    labelEn: "Unit price",
    hintAm: "የአንድ ቀን ክፍያ",
    hintEn: "Rate per day",
    minWidth: 20,
    weight: 1,
    halign: "right",
    value: (row, _index, ctx) => ctx.formatCurrency(numberOf(row.unitPrice)),
  },
  {
    key: "baseAmount",
    labelAm: "መሰረታዊ ደሞዝ",
    labelEn: "Salary",
    hintAm: "ጉርሻ ሳይጨመር",
    hintEn: "Before bonus",
    minWidth: 26,
    weight: 1.2,
    halign: "right",
    value: (row, _index, ctx) => ctx.formatCurrency(rowBase(row)),
    total: (rows, ctx) => ctx.formatCurrency(sumBy(rows, rowBase)),
  },
  {
    key: "bonus",
    labelAm: "ጉርሻ",
    labelEn: "Bonus",
    hintAm: "ተጨማሪ ክፍያ",
    hintEn: "Extra payment",
    minWidth: 24,
    weight: 1,
    halign: "right",
    value: (row, _index, ctx) => ctx.formatCurrency(rowBonus(row)),
    total: (rows, ctx) => ctx.formatCurrency(sumBy(rows, rowBonus)),
  },
  {
    key: "amount",
    labelAm: "ጠቅላላ መጠን",
    labelEn: "Total amount",
    hintAm: "የሚከፈለው ጠቅላላ",
    hintEn: "What gets paid",
    minWidth: 26,
    weight: 1.3,
    halign: "right",
    bold: true,
    value: (row, _index, ctx) => ctx.formatCurrency(numberOf(row.amount)),
    total: (rows, ctx) =>
      ctx.formatCurrency(sumBy(rows, (row) => numberOf(row.amount))),
  },
  {
    key: "status",
    labelAm: "ሁኔታ",
    labelEn: "Status",
    hintAm: "የክፍያ ሁኔታ",
    hintEn: "Payment status",
    minWidth: 20,
    weight: 1,
    halign: "center",
    bold: true,
    value: (row, _index, ctx) => statusLabel(row.status, ctx.isAm),
  },
];

/** Matches the report as it looked before columns became selectable. */
export const DEFAULT_SALARY_REPORT_COLUMNS: SalaryReportColumnKey[] = [
  "index",
  "teacherName",
  "bankAccount",
  "baseAmount",
  "bonus",
  "amount",
  "status",
];

/** One-click column sets offered by the picker. */
export const SALARY_REPORT_PRESETS: Array<{
  id: string;
  labelAm: string;
  labelEn: string;
  columns: SalaryReportColumnKey[];
}> = [
  {
    id: "standard",
    labelAm: "መደበኛ",
    labelEn: "Standard",
    columns: DEFAULT_SALARY_REPORT_COLUMNS,
  },
  {
    id: "bank",
    labelAm: "የባንክ ክፍያ",
    labelEn: "Bank payout",
    columns: [
      "index",
      "teacherName",
      "bankAccountName",
      "bankAccountNumber",
      "amount",
    ],
  },
  {
    id: "detailed",
    labelAm: "ሙሉ ዝርዝር",
    labelEn: "Full detail",
    columns: SALARY_REPORT_COLUMNS.filter(
      (column) => column.key !== "bankAccount",
    ).map((column) => column.key),
  },
  {
    id: "compact",
    labelAm: "አጭር",
    labelEn: "Compact",
    columns: ["index", "teacherName", "amount", "status"],
  },
];

/** Printable width of an A4 page in each orientation, minus the 12mm margins. */
export const A4_CONTENT_WIDTH = { portrait: 186, landscape: 273 };

/**
 * How much width the selection needs and whether it still fits a portrait
 * page — the picker uses this to show which orientation "auto" will land on.
 */
export const measureSalaryReportColumns = (keys: SalaryReportColumnKey[]) => {
  const requiredWidth = resolveSalaryReportColumns(keys).reduce(
    (sum, column) => sum + column.minWidth,
    0,
  );

  return {
    requiredWidth,
    fitsPortrait: requiredWidth <= A4_CONTENT_WIDTH.portrait,
    fitsLandscape: requiredWidth <= A4_CONTENT_WIDTH.landscape,
  };
};

export const salaryReportColumnLabel = (
  column: SalaryReportColumn,
  isAm: boolean,
) => (isAm ? column.labelAm : column.labelEn);

export const salaryReportColumnHint = (
  column: SalaryReportColumn,
  isAm: boolean,
) => (isAm ? column.hintAm : column.hintEn) ?? "";

const columnByKey = new Map(
  SALARY_REPORT_COLUMNS.map((column) => [column.key, column]),
);

/** Drops unknown keys and duplicates while keeping the caller's order. */
export const resolveSalaryReportColumns = (
  keys: SalaryReportColumnKey[] | undefined,
) => {
  const requested = keys?.length ? keys : DEFAULT_SALARY_REPORT_COLUMNS;
  const seen = new Set<SalaryReportColumnKey>();
  const resolved: SalaryReportColumn[] = [];

  requested.forEach((key) => {
    if (seen.has(key)) return;
    const column = columnByKey.get(key);
    if (!column) return;
    seen.add(key);
    resolved.push(column);
  });

  return resolved.length
    ? resolved
    : (DEFAULT_SALARY_REPORT_COLUMNS.map(
        (key) => columnByKey.get(key) as SalaryReportColumn,
      ) as SalaryReportColumn[]);
};

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
    console.error(
      "Ethiopic font unavailable, falling back to Helvetica",
      error,
    );
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

function statusLabel(status: SalaryReportStatus, isAm: boolean) {
  switch (status) {
    case "approved":
      return isAm ? "ጸድቋል" : "Approved";
    case "rejected":
      return isAm ? "ውድቅ ተደርጓል" : "Rejected";
    default:
      return isAm ? "በመጠባበቅ ላይ" : "Pending";
  }
}

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
 * Spreads the printable width across the selected columns: every column keeps
 * at least its minimum, the leftover is shared by weight, and an over-full
 * selection is scaled down proportionally instead of spilling off the page.
 */
const computeColumnWidths = (
  columns: SalaryReportColumn[],
  available: number,
) => {
  const totalMin = columns.reduce((sum, column) => sum + column.minWidth, 0);

  if (totalMin > available) {
    const scale = available / totalMin;
    return columns.map((column) => column.minWidth * scale);
  }

  const totalWeight = columns.reduce((sum, column) => sum + column.weight, 0);
  const extra = available - totalMin;

  return columns.map(
    (column) =>
      column.minWidth +
      (totalWeight > 0 ? (extra * column.weight) / totalWeight : 0),
  );
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
  columns,
  orientation = "auto",
  includeTotals = true,
  includeSignatures = true,
}: SalaryReportOptions) {
  const t = (am: string, en: string) => (isAm ? am : en);
  const ctx: ColumnContext = { isAm, formatCurrency };

  const activeColumns = resolveSalaryReportColumns(columns);

  const [{ jsPDF: JsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const margin = 12;
  const A4_WIDTH = 210;
  const requiredWidth = activeColumns.reduce(
    (sum, column) => sum + column.minWidth,
    0,
  );
  const resolvedOrientation =
    orientation === "auto"
      ? requiredWidth > A4_WIDTH - margin * 2
        ? "landscape"
        : "portrait"
      : orientation;

  const doc = new JsPDF({
    orientation: resolvedOrientation,
    unit: "mm",
    format: "a4",
  }) as JsPdfWithAutoTable;

  const font = await registerFonts(doc);
  const logo = await loadLogo();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const right = pageWidth - margin;
  const headerBottom = 32;

  const generatedAt = new Date().toLocaleString(isAm ? "am-ET" : "en-US");
  const reportTitle = t(
    "የመምህራን ደሞዝ ሪፖርት",
    "Teacher Allowance for Quran Report",
  );

  // When every row covers the same month/year — the usual case, since reports
  // are generated per month — the period is stated once in the header.
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
    doc.text(`${t("የተዘጋጀበት", "Generated")}: ${generatedAt}`, right, 23.5, {
      align: "right",
    });

    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.6);
    doc.line(margin, headerBottom - 4, right, headerBottom - 4);
  };

  const body = rows.map((row, index) =>
    activeColumns.map((column) => column.value(row, index, ctx)),
  );

  const widths = computeColumnWidths(activeColumns, pageWidth - margin * 2);
  const columnStyles: Record<number, Record<string, unknown>> = {};
  activeColumns.forEach((column, index) => {
    columnStyles[index] = {
      cellWidth: widths[index],
      halign: column.halign,
      ...(column.bold ? { fontStyle: "bold" } : {}),
      ...(column.muted ? { textColor: MUTED } : {}),
    };
  });

  // Denser selections need a smaller type size to stay on one line.
  const bodyFontSize =
    activeColumns.length >= 11 ? 7 : activeColumns.length >= 9 ? 7.8 : 8.5;

  const statusIndex = activeColumns.findIndex(
    (column) => column.key === "status",
  );
  const bonusIndex = activeColumns.findIndex(
    (column) => column.key === "bonus",
  );

  // The totals row: a label spanning the leading descriptive columns, then one
  // total per summable column.
  const firstTotalIndex = activeColumns.findIndex((column) => column.total);
  const totalsLabel = `${t("ጠቅላላ ድምር", "Grand total")} — ${rows.length.toLocaleString()} ${t(
    "መዝገቦች",
    "records",
  )}`;

  let foot: Array<Array<string | { content: string; colSpan: number }>> = [];

  if (includeTotals && rows.length > 0) {
    if (firstTotalIndex === -1) {
      foot = [[{ content: totalsLabel, colSpan: activeColumns.length }]];
    } else {
      const cells: Array<string | { content: string; colSpan: number }> = [];

      if (firstTotalIndex > 0) {
        cells.push({ content: totalsLabel, colSpan: firstTotalIndex });
      }

      activeColumns.slice(firstTotalIndex).forEach((column) => {
        cells.push(column.total ? column.total(rows, ctx) : "");
      });

      foot = [cells];
    }
  }

  autoTable(doc, {
    startY: headerBottom + 3,
    margin: { top: headerBottom + 3, right: margin, bottom: 18, left: margin },
    theme: "grid",
    head: [
      activeColumns.map((column) => salaryReportColumnLabel(column, isAm)),
    ],
    body,
    // Only the final page carries the grand total, so a page break can't be
    // mistaken for a subtotal.
    showFoot: "lastPage",
    ...(foot.length ? { foot } : {}),
    styles: {
      font,
      fontStyle: "normal",
      fontSize: bodyFontSize,
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
      fontSize: bodyFontSize,
      fillColor: TEAL,
      textColor: [255, 255, 255],
      lineColor: TEAL,
      halign: "left",
    },
    footStyles: {
      font,
      fontStyle: "bold",
      // Same size as the body: the totals are the longest strings in their
      // columns, so a larger type would be the first thing to wrap.
      fontSize: bodyFontSize,
      fillColor: [238, 244, 242],
      textColor: INK,
      lineColor: LINE,
    },
    alternateRowStyles: { fillColor: ZEBRA },
    columnStyles,
    // Colour the status column per row, highlight non-zero bonuses, and keep
    // the totals aligned with the numbers above them.
    didParseCell: (data) => {
      if (data.section === "head") {
        data.cell.styles.halign =
          activeColumns[data.column.index]?.halign ?? "left";
        return;
      }

      if (data.section === "body") {
        if (statusIndex >= 0 && data.column.index === statusIndex) {
          data.cell.styles.textColor = statusColor(
            rows[data.row.index]?.status ?? "pending",
          );
        }

        if (bonusIndex >= 0 && data.column.index === bonusIndex) {
          const bonus = rowBonus(
            rows[data.row.index] ?? ({} as SalaryReportRow),
          );
          if (bonus > 0) {
            data.cell.styles.textColor = TEAL;
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.textColor = MUTED;
          }
        }
        return;
      }

      if (data.section === "foot" && firstTotalIndex >= 0) {
        // The label cell spans the leading columns, so the first foot cell can
        // be the label even though its column index is 0.
        const isLabelCell = firstTotalIndex > 0 && data.column.index === 0;
        data.cell.styles.halign = isLabelCell
          ? "left"
          : (activeColumns[data.column.index]?.halign ?? "right");
      }
    },
    didDrawPage: drawHeader,
  });

  // Signature block — placed after the table, on a new page if it won't fit.
  if (includeSignatures) {
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
  }

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
      {
        align: "right",
      },
    );
  }

  doc.save(`teacher-salary-report-${fileLabel}.pdf`);
}
