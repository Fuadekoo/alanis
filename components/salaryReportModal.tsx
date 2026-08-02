"use client";

/**
 * Column picker for the teacher-salary PDF: choose which columns go into the
 * report, in what order, then download. The choice is remembered per browser
 * so the next download starts from the same layout.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/heroui";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Columns3,
  CreditCard,
  Download,
  EyeOff,
  FileText,
  RotateCcw,
} from "lucide-react";
import {
  DEFAULT_SALARY_REPORT_COLUMNS,
  SALARY_REPORT_BANK_COLUMNS,
  SALARY_REPORT_COLUMNS,
  SALARY_REPORT_PRESETS,
  measureSalaryReportColumns,
  salaryReportColumnHint,
  salaryReportColumnLabel,
  type SalaryReportColumnKey,
  type SalaryReportOrientation,
} from "@/lib/salaryReport";

const STORAGE_KEY = "teacher-salary-report-layout";

export type SalaryReportSettings = {
  columns: SalaryReportColumnKey[];
  orientation: SalaryReportOrientation;
  includeTotals: boolean;
  includeSignatures: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isAm: boolean;
  /** Human readable period the report will cover. */
  periodLabel: string;
  /** How many rows the report will contain. */
  recordCount: number;
  isDownloading: boolean;
  onDownload: (settings: SalaryReportSettings) => void;
};

const DEFAULT_SETTINGS: SalaryReportSettings = {
  columns: DEFAULT_SALARY_REPORT_COLUMNS,
  orientation: "auto",
  includeTotals: true,
  includeSignatures: true,
};

const VALID_KEYS = new Set(SALARY_REPORT_COLUMNS.map((column) => column.key));

const readStoredSettings = (): SalaryReportSettings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<SalaryReportSettings>;
    const columns = (parsed.columns ?? []).filter(
      (key): key is SalaryReportColumnKey => VALID_KEYS.has(key),
    );

    return {
      columns: columns.length ? columns : DEFAULT_SETTINGS.columns,
      orientation:
        parsed.orientation === "portrait" || parsed.orientation === "landscape"
          ? parsed.orientation
          : "auto",
      includeTotals: parsed.includeTotals !== false,
      includeSignatures: parsed.includeSignatures !== false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const sameColumns = (a: SalaryReportColumnKey[], b: SalaryReportColumnKey[]) =>
  a.length === b.length && a.every((key, index) => key === b[index]);

const columnByKey = (key: SalaryReportColumnKey) =>
  SALARY_REPORT_COLUMNS.find((column) => column.key === key);

/** Small on/off pill used for the bank-details shortcuts. */
function ToggleChip({
  label,
  isOn,
  onToggle,
}: {
  label: string;
  isOn: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isOn}
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
        isOn
          ? "border-success-500 bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-200"
          : "border-default-300 bg-transparent text-default-400 line-through dark:border-default-600"
      }`}
    >
      <span
        className={`flex size-3.5 items-center justify-center rounded-full border ${
          isOn
            ? "border-success-500 bg-success-500 text-white"
            : "border-default-300 dark:border-default-600"
        }`}
      >
        {isOn && <Check className="size-2.5" />}
      </span>
      {label}
    </button>
  );
}

function SalaryReportModal({
  isOpen,
  onClose,
  isAm,
  periodLabel,
  recordCount,
  isDownloading,
  onDownload,
}: Props) {
  const [settings, setSettings] =
    useState<SalaryReportSettings>(DEFAULT_SETTINGS);

  // Restore the last used layout whenever the picker is reopened.
  useEffect(() => {
    if (isOpen) setSettings(readStoredSettings());
  }, [isOpen]);

  const selected = settings.columns;

  const selectedColumns = useMemo(
    () =>
      selected
        .map((key) =>
          SALARY_REPORT_COLUMNS.find((column) => column.key === key),
        )
        .filter(Boolean) as (typeof SALARY_REPORT_COLUMNS)[number][],
    [selected],
  );

  const availableColumns = useMemo(
    () =>
      SALARY_REPORT_COLUMNS.filter((column) => !selected.includes(column.key)),
    [selected],
  );

  const fit = useMemo(() => measureSalaryReportColumns(selected), [selected]);

  const effectiveOrientation =
    settings.orientation === "auto"
      ? fit.fitsPortrait
        ? "portrait"
        : "landscape"
      : settings.orientation;

  const isTooWide =
    (effectiveOrientation === "portrait" && !fit.fitsPortrait) ||
    (effectiveOrientation === "landscape" && !fit.fitsLandscape);

  const activePresetId = useMemo(
    () =>
      SALARY_REPORT_PRESETS.find((preset) =>
        sameColumns(preset.columns, selected),
      )?.id ?? null,
    [selected],
  );

  const update = (patch: Partial<SalaryReportSettings>) =>
    setSettings((current) => ({ ...current, ...patch }));

  const removeColumn = (key: SalaryReportColumnKey) =>
    update({ columns: selected.filter((item) => item !== key) });

  /**
   * Turning a column back on slots it in next to where it naturally belongs
   * instead of dumping it at the end — without reshuffling the order the user
   * arranged by hand.
   */
  const toggleColumn = (key: SalaryReportColumnKey) => {
    if (selected.includes(key)) {
      removeColumn(key);
      return;
    }

    const order = SALARY_REPORT_COLUMNS.map((column) => column.key);
    const position = selected.findIndex(
      (item) => order.indexOf(item) > order.indexOf(key),
    );
    const next = [...selected];
    next.splice(position === -1 ? next.length : position, 0, key);

    update({ columns: next });
  };

  const hasBankColumns = selected.some((key) =>
    SALARY_REPORT_BANK_COLUMNS.includes(key),
  );

  const moveColumn = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= selected.length) return;

    const next = [...selected];
    [next[index], next[target]] = [next[target], next[index]];
    update({ columns: next });
  };

  const handleDownload = () => {
    if (!selected.length || isDownloading) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // a full or blocked storage must never block the download
    }

    onDownload(settings);
  };

  const t = (am: string, en: string) => (isAm ? am : en);

  const orientationOptions: Array<{
    key: SalaryReportOrientation;
    label: string;
  }> = [
    { key: "auto", label: t("ራስ-ሰር", "Auto") },
    { key: "portrait", label: t("ቁመት", "Portrait") },
    { key: "landscape", label: t("ወርድ", "Landscape") },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={isDownloading ? () => {} : onClose}
      size="3xl"
      scrollBehavior="inside"
      backdrop="blur"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-success-100 text-success-600 dark:bg-success-500/15 dark:text-success-300">
              <Columns3 className="size-4" />
            </span>
            <span className="text-base font-semibold">
              {t("የPDF ሪፖርት አምዶች", "PDF report columns")}
            </span>
          </div>
          <p className="text-xs font-normal text-default-500">
            {t(
              `${periodLabel} • ${recordCount.toLocaleString()} መዝገቦች — በሪፖርቱ ውስጥ የሚገቡትን አምዶች ይምረጡ`,
              `${periodLabel} • ${recordCount.toLocaleString()} record${
                recordCount === 1 ? "" : "s"
              } — pick the columns that go into the report`,
            )}
          </p>
        </ModalHeader>

        <ModalBody className="gap-4">
          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-default-500">
              {t("ፈጣን ምርጫ", "Quick sets")}
            </span>
            {SALARY_REPORT_PRESETS.map((preset) => {
              const isActive = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => update({ columns: [...preset.columns] })}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    isActive
                      ? "border-success-500 bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-200"
                      : "border-default-200 bg-white text-default-600 hover:border-default-300 hover:bg-default-100 dark:border-default-700 dark:bg-default-900/60 dark:text-default-300 dark:hover:bg-default-800/60"
                  }`}
                >
                  {isAm ? preset.labelAm : preset.labelEn}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-default-200 px-3 py-1 text-xs font-medium text-default-500 transition hover:bg-default-100 dark:border-default-700 dark:hover:bg-default-800/60"
            >
              <RotateCcw className="size-3" />
              {t("ወደ ነባሪ መልስ", "Reset")}
            </button>
          </div>

          {/* Bank details shortcut — the one people flip most often. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-default-200 bg-default-50/60 p-3 dark:border-default-700 dark:bg-default-900/40">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-default-500">
              <CreditCard className="size-3.5" />
              {t("የባንክ መረጃ", "Bank details")}
            </span>
            {SALARY_REPORT_BANK_COLUMNS.map((key) => {
              const column = columnByKey(key);
              if (!column) return null;
              return (
                <ToggleChip
                  key={key}
                  label={salaryReportColumnLabel(column, isAm)}
                  isOn={selected.includes(key)}
                  onToggle={() => toggleColumn(key)}
                />
              );
            })}
            {hasBankColumns && (
              <button
                type="button"
                onClick={() =>
                  update({
                    columns: selected.filter(
                      (key) => !SALARY_REPORT_BANK_COLUMNS.includes(key),
                    ),
                  })
                }
                className="ml-auto inline-flex items-center gap-1 rounded-full border border-default-200 px-3 py-1 text-xs font-medium text-default-500 transition hover:bg-default-100 dark:border-default-700 dark:hover:bg-default-800/60"
              >
                <EyeOff className="size-3" />
                {t("ሁሉንም የባንክ አምዶች ደብቅ", "Hide all bank columns")}
              </button>
            )}
          </div>

          {/* Every column, printed or hidden, with one on/off box each */}
          <div className="rounded-xl border border-default-200 p-3 dark:border-default-700">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-default-500">
                {t("የሪፖርቱ አምዶች", "Report columns")}
              </span>
              <span className="rounded-full bg-default-100 px-2 py-0.5 text-[11px] font-semibold text-default-600 dark:bg-default-800/60 dark:text-default-300">
                {t(
                  `${selected.length} ከ ${SALARY_REPORT_COLUMNS.length} ይታተማሉ`,
                  `${selected.length} of ${SALARY_REPORT_COLUMNS.length} printed`,
                )}
              </span>
            </div>

            {selectedColumns.length === 0 ? (
              <p className="rounded-lg border border-dashed border-default-300 p-4 text-center text-xs text-default-400 dark:border-default-600">
                {t("ቢያንስ አንድ አምድ ይምረጡ", "Tick at least one column to continue")}
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {selectedColumns.map((column, index) => (
                  <li
                    key={column.key}
                    className="flex items-center gap-1 rounded-lg border border-success-200 bg-success-50/40 px-2 py-1.5 dark:border-success-500/30 dark:bg-success-500/10"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked
                      onClick={() => toggleColumn(column.key)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center rounded border border-success-500 bg-success-500 text-white">
                        <Check className="size-3" />
                      </span>
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-bold text-success-700 dark:bg-default-900/70 dark:text-success-300">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-default-700 dark:text-default-200">
                          {salaryReportColumnLabel(column, isAm)}
                        </span>
                        <span className="block truncate text-[11px] text-default-400">
                          {salaryReportColumnHint(column, isAm)}
                        </span>
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        aria-label={t("ወደ ላይ", "Move up")}
                        onClick={() => moveColumn(index, -1)}
                        disabled={index === 0}
                        className="rounded-md p-1 text-default-400 transition hover:bg-white hover:text-default-600 disabled:opacity-30 dark:hover:bg-default-800"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={t("ወደ ታች", "Move down")}
                        onClick={() => moveColumn(index, 1)}
                        disabled={index === selectedColumns.length - 1}
                        className="rounded-md p-1 text-default-400 transition hover:bg-white hover:text-default-600 disabled:opacity-30 dark:hover:bg-default-800"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={t("ደብቅ", "Hide")}
                        onClick={() => removeColumn(column.key)}
                        className="rounded-md p-1 text-default-400 transition hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-danger-500/10"
                      >
                        <EyeOff className="size-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {availableColumns.length > 0 && (
              <>
                <div className="my-2.5 flex items-center gap-2">
                  <span className="h-px flex-1 bg-default-200 dark:bg-default-700" />
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-default-400">
                    <EyeOff className="size-3" />
                    {t("የተደበቁ — አይታተሙም", "Hidden — not printed")}
                  </span>
                  <span className="h-px flex-1 bg-default-200 dark:bg-default-700" />
                </div>

                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {availableColumns.map((column) => (
                    <li key={column.key}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={false}
                        onClick={() => toggleColumn(column.key)}
                        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-default-300 px-2 py-1.5 text-left opacity-70 transition hover:border-success-400 hover:bg-success-50/50 hover:opacity-100 dark:border-default-600 dark:hover:border-success-500/50 dark:hover:bg-success-500/10"
                      >
                        <span className="size-4 shrink-0 rounded border border-default-300 dark:border-default-600" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-default-600 dark:text-default-300">
                            {salaryReportColumnLabel(column, isAm)}
                          </span>
                          <span className="block truncate text-[11px] text-default-400">
                            {salaryReportColumnHint(column, isAm)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Page options */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-default-200 p-3 dark:border-default-700">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-default-500">
                {t("የገጽ አቀማመጥ", "Page layout")}
              </span>
              <div className="inline-flex rounded-lg border border-default-200 p-0.5 dark:border-default-700">
                {orientationOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => update({ orientation: option.key })}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      settings.orientation === option.key
                        ? "bg-default-900 text-white dark:bg-default-100 dark:text-default-900"
                        : "text-default-500 hover:bg-default-100 dark:hover:bg-default-800"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {[
              {
                key: "includeTotals" as const,
                label: t("የድምር ረድፍ", "Totals row"),
              },
              {
                key: "includeSignatures" as const,
                label: t("የፊርማ ቦታ", "Signature block"),
              },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => update({ [option.key]: !settings[option.key] })}
                className="inline-flex items-center gap-2 text-xs font-medium text-default-600 dark:text-default-300"
              >
                <span
                  className={`flex size-4 items-center justify-center rounded border transition ${
                    settings[option.key]
                      ? "border-success-500 bg-success-500 text-white"
                      : "border-default-300 dark:border-default-600"
                  }`}
                >
                  {settings[option.key] && <Check className="size-3" />}
                </span>
                {option.label}
              </button>
            ))}
          </div>

          {/* Layout hint */}
          <div
            className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
              isTooWide
                ? "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-200"
                : "bg-default-100 text-default-500 dark:bg-default-800/60 dark:text-default-300"
            }`}
          >
            <FileText className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {isTooWide
                ? t(
                    "ብዙ አምዶች ተመርጠዋል — ጽሑፉ ትንሽ ሆኖ ይታተማል። አምድ ያስወግዱ ወይም ወርድ አቀማመጥ ይጠቀሙ።",
                    "That is a lot of columns for one page — the text will be shrunk to fit. Remove a column or switch to landscape.",
                  )
                : t(
                    `${selected.length} አምዶች • ${
                      effectiveOrientation === "landscape" ? "ወርድ" : "ቁመት"
                    } A4`,
                    `${selected.length} column${
                      selected.length === 1 ? "" : "s"
                    } • A4 ${effectiveOrientation}`,
                  )}
            </span>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isDownloading}>
            {t("ተመለስ", "Cancel")}
          </Button>
          <Button
            color="success"
            startContent={
              isDownloading ? undefined : <Download className="size-4" />
            }
            isLoading={isDownloading}
            isDisabled={selected.length === 0 || recordCount === 0}
            onPress={handleDownload}
          >
            {t("PDF አውርድ", "Download PDF")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default SalaryReportModal;
